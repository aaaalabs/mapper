import { supabase } from '../lib/supabase';
import { trackErrorWithContext, ErrorSeverity, ErrorCategory } from './analytics';
import type { Lead, LeadInsert, LeadUpdate, MapLead } from '../types/lead';

export type LeadType = 'beta_waitlist' | 'data_extraction';
export type LeadStatus = 'pending' | 'contacted' | 'converted' | 'rejected';

export interface Lead {
  id?: string;
  email: string;
  name: string;
  lead_type: LeadType;
  status: LeadStatus;
  source?: string;
  community_link?: string;
  event_data?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  map_id?: string;
  feedback_id?: string;
  session_id?: string;
}

export interface LeadInsert extends Omit<Lead, 'id' | 'created_at' | 'updated_at'> {
  event_data?: Record<string, any>;
}

export interface LeadUpdate extends Partial<Lead> {
  event_data?: Record<string, any>;
}

// Create a new lead
export const createLead = async (data: Omit<LeadInsert, 'updated_at'>): Promise<Lead | null> => {
  try {
    const currentUser = (await supabase.auth.getUser()).data.user;

    // Don't create leads for admin user
    if (currentUser?.email === 'admin@libralab.ai') {
      return null;
    }

    const sessionId = localStorage.getItem('session_id');

    const { data: lead, error } = await supabase
      .from('map_leads')
      .insert({
        ...data,
        status: data.status || 'pending',
        event_data: data.event_data ? JSON.stringify(data.event_data) : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        session_id: sessionId
      })
      .select()
      .single();

    if (error) {
      trackErrorWithContext(new Error(`Failed to create lead: ${error.message}`), {
        category: ErrorCategory.LEAD,
        subcategory: 'CREATION',
        severity: ErrorSeverity.HIGH,
        metadata: {
          leadData: data,
          error: error.message
        }
      });
      throw error;
    }

    return lead;
  } catch (error) {
    console.error('Error creating lead:', error);
    trackErrorWithContext(error instanceof Error ? error : new Error('Lead creation failed'), {
      category: ErrorCategory.LEAD,
      subcategory: 'CREATION',
      severity: ErrorSeverity.HIGH,
      metadata: {
        leadData: data,
        error: error instanceof Error ? error.message : String(error)
      }
    });
    throw error;
  }
};

// Update a lead
export const updateLead = async (id: string, updates: Omit<LeadUpdate, 'updated_at'>): Promise<void> => {
  try {
    const { error } = await supabase
      .from('map_leads')
      .update({
        ...updates,
        event_data: updates.event_data ? JSON.stringify(updates.event_data) : undefined,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      trackErrorWithContext(new Error(`Failed to update lead: ${error.message}`), {
        category: ErrorCategory.LEAD,
        subcategory: 'UPDATE',
        severity: ErrorSeverity.HIGH,
        metadata: {
          leadId: id,
          updates,
          error: error.message,
          code: error.code
        }
      });
      throw error;
    }
  } catch (error) {
    trackErrorWithContext(error instanceof Error ? error : new Error('Lead update failed'), {
      category: ErrorCategory.LEAD,
      subcategory: 'UPDATE',
      severity: ErrorSeverity.HIGH,
      metadata: {
        leadId: id,
        updates,
        error: error instanceof Error ? error.message : String(error)
      }
    });
    throw error;
  }
};

// Find a lead by email
export const findLeadByEmail = async (email: string): Promise<Lead | null> => {
  try {
    if (!email) {
      return null;
    }

    const { data, error } = await supabase
      .from('map_leads')
      .select('*')
      .ilike('email', email.toLowerCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No results found
        return null;
      }
      trackErrorWithContext(new Error(`Failed to find lead: ${error.message}`), {
        category: ErrorCategory.LEAD,
        subcategory: 'FIND',
        severity: ErrorSeverity.MEDIUM,
        metadata: {
          email,
          error: error.message,
          code: error.code
        }
      });
      throw error;
    }

    return data;
  } catch (error) {
    trackErrorWithContext(error instanceof Error ? error : new Error('Lead find failed'), {
      category: ErrorCategory.LEAD,
      subcategory: 'FIND',
      severity: ErrorSeverity.MEDIUM,
      metadata: {
        email,
        error: error instanceof Error ? error.message : String(error)
      }
    });
    return null; // Return null instead of throwing to make this operation non-blocking
  }
};

// Associate a lead with a map
export const associateLeadWithMap = async (leadId: string, mapId: string): Promise<void> => {
  return updateLead(leadId, { map_id: mapId });
};

// Associate a lead with feedback
export const associateLeadWithFeedback = async (leadId: string, feedbackId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('map_leads')
      .update({ feedback_id: feedbackId, updated_at: new Date().toISOString() })
      .eq('id', leadId);

    if (error) {
      trackErrorWithContext(new Error(`Failed to associate lead with feedback: ${error.message}`), {
        category: ErrorCategory.LEAD,
        subcategory: 'ASSOCIATE',
        severity: ErrorSeverity.MEDIUM,
        metadata: {
          leadId,
          feedbackId,
          error: error.message,
          code: error.code
        }
      });
      // Don't throw, just log the error
    }
  } catch (error) {
    trackErrorWithContext(error instanceof Error ? error : new Error('Lead association failed'), {
      category: ErrorCategory.LEAD,
      subcategory: 'ASSOCIATE',
      severity: ErrorSeverity.MEDIUM,
      metadata: {
        leadId,
        feedbackId,
        error: error instanceof Error ? error.message : String(error)
      }
    });
    // Don't throw, just log the error
  }
};

// Track a lead interaction
export const trackLeadInteraction = async (
  email: string,
  interactionType: string,
  event_data: Record<string, any> = {}
): Promise<void> => {
  try {
    const lead = await findLeadByEmail(email);
  
    if (lead) {
      const updatedEventData = {
        ...lead.event_data,
        interactions: [
          ...(lead.event_data?.interactions || []),
          {
            type: interactionType,
            timestamp: new Date().toISOString(),
            ...event_data
          }
        ]
      };

      await updateLead(lead.id!, { event_data: updatedEventData });
    }
  } catch (error) {
    trackErrorWithContext(error instanceof Error ? error : new Error('Lead interaction tracking failed'), {
      category: ErrorCategory.LEAD,
      subcategory: 'INTERACTION',
      severity: ErrorSeverity.MEDIUM,
      metadata: {
        email,
        interactionType,
        event_data,
        error: error instanceof Error ? error.message : String(error)
      }
    });
    throw error;
  }
};

// Get all leads
export const getLeads = async (): Promise<Lead[]> => {
  try {
    const { data: leads, error } = await supabase
      .from('map_leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      trackErrorWithContext(new Error(`Failed to fetch leads: ${error.message}`), {
        category: ErrorCategory.LEAD,
        subcategory: 'FETCH',
        severity: ErrorSeverity.HIGH,
        metadata: { error: error.message }
      });
      throw error;
    }

    return leads;
  } catch (error) {
    console.error('Error fetching leads:', error);
    trackErrorWithContext(error instanceof Error ? error : new Error('Failed to fetch leads'), {
      category: ErrorCategory.LEAD,
      subcategory: 'FETCH',
      severity: ErrorSeverity.HIGH,
      metadata: {
        error: error instanceof Error ? error.message : String(error)
      }
    });
    throw error;
  }
};

// Get leads by session ID
export const getLeadsBySession = async (sessionId: string): Promise<Lead[]> => {
  try {
    const { data: leads, error } = await supabase
      .from('map_leads')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    if (error) {
      trackErrorWithContext(new Error(`Failed to fetch leads by session: ${error.message}`), {
        category: ErrorCategory.LEAD,
        subcategory: 'FETCH_BY_SESSION',
        severity: ErrorSeverity.HIGH,
        metadata: { 
          sessionId,
          error: error.message 
        }
      });
      throw error;
    }

    return leads;
  } catch (error) {
    console.error('Error fetching leads by session:', error);
    trackErrorWithContext(error instanceof Error ? error : new Error('Failed to fetch leads by session'), {
      category: ErrorCategory.LEAD,
      subcategory: 'FETCH_BY_SESSION',
      severity: ErrorSeverity.HIGH,
      metadata: {
        sessionId,
        error: error instanceof Error ? error.message : String(error)
      }
    });
    throw error;
  }
};
