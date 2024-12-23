import { supabase } from '../lib/supabase';
import { trackEvent, trackError } from './analytics';
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
      await trackError(new Error(`Failed to create lead: ${error.message}`), {
        category: 'lead',
        severity: 'high',
        metadata: { email: data.email, leadType: data.lead_type }
      });
      return null;
    }

    return lead;
  } catch (error) {
    await trackError(error instanceof Error ? error : new Error('Lead creation failed'), {
      category: 'lead',
      severity: 'high',
      metadata: { email: data.email, leadType: data.lead_type }
    });
    return null;
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
      await trackError(new Error(`Failed to update lead: ${error.message}`), {
        category: 'lead',
        severity: 'high',
        metadata: { leadId: id, updates }
      });
      throw error;
    }
  } catch (error) {
    await trackError(error instanceof Error ? error : new Error('Lead update failed'), {
      category: 'lead',
      severity: 'high',
      metadata: { leadId: id, updates }
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
      await trackError(new Error(`Failed to find lead: ${error.message}`), {
        category: 'lead',
        severity: 'medium',
        metadata: { email }
      });
      throw error;
    }

    return data;
  } catch (error) {
    await trackError(error instanceof Error ? error : new Error('Lead find failed'), {
      category: 'lead',
      severity: 'medium',
      metadata: { email }
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
      await trackError(new Error(`Failed to associate lead with feedback: ${error.message}`), {
        category: 'lead',
        severity: 'medium',
        metadata: { leadId, feedbackId }
      });
      // Don't throw, just log the error
    }
  } catch (error) {
    await trackError(error instanceof Error ? error : new Error('Lead association failed'), {
      category: 'lead',
      severity: 'medium',
      metadata: { leadId, feedbackId }
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
    await trackError(error instanceof Error ? error : new Error('Lead interaction tracking failed'), {
      category: 'lead',
      severity: 'medium',
      metadata: { email, interactionType, event_data }
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
      await trackError(new Error(`Failed to fetch leads: ${error.message}`), {
        category: 'lead',
        severity: 'high',
        metadata: { error: error.message }
      });
      throw error;
    }

    return leads;
  } catch (error) {
    console.error('Error fetching leads:', error);
    await trackError(error instanceof Error ? error : new Error('Failed to fetch leads'), {
      category: 'lead',
      severity: 'high',
      metadata: { error: error.message }
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
      await trackError(new Error(`Failed to fetch leads by session: ${error.message}`), {
        category: 'lead',
        severity: 'high',
        metadata: { sessionId, error: error.message }
      });
      throw error;
    }

    return leads;
  } catch (error) {
    console.error('Error fetching leads by session:', error);
    await trackError(error instanceof Error ? error : new Error('Failed to fetch leads by session'), {
      category: 'lead',
      severity: 'high',
      metadata: { sessionId, error: error.message }
    });
    throw error;
  }
};
