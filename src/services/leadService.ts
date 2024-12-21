import { supabase } from '../lib/supabase';
import { trackErrorWithContext, ErrorSeverity } from '../services/errorTracking';
import type { Lead } from '../types/lead';

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
}

export const createLead = async (data: Omit<Lead, 'id' | 'created_at'>): Promise<Lead> => {
  try {
    const timestamp = new Date().toISOString();
    const currentUser = (await supabase.auth.getUser()).data.user;

    // Don't create leads for admin user
    if (currentUser?.email === 'admin@libralab.ai') {
      return null;
    }

    const { data: lead, error } = await supabase
      .from('map_leads')
      .insert([{
        ...data,
        status: data.status || 'pending',
        event_data: data.event_data ? JSON.stringify(data.event_data) : null,
        created_at: timestamp,
        updated_at: timestamp
      }])
      .select()
      .single();

    if (error) {
      trackErrorWithContext(new Error(`Failed to create lead: ${error.message}`), {
        category: 'LEAD',
        subcategory: 'CREATION',
        severity: ErrorSeverity.HIGH,
        metadata: {
          leadData: data,
          error: error.message,
          code: error.code
        }
      });
      throw error;
    }

    return lead;
  } catch (error) {
    trackErrorWithContext(error instanceof Error ? error : new Error('Lead creation failed'), {
      category: 'LEAD',
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

export const updateLead = async (id: string, updates: Partial<Lead>): Promise<void> => {
  try {
    const timestamp = new Date().toISOString();
    const { error } = await supabase
      .from('map_leads')
      .update({
        ...updates,
        event_data: updates.event_data ? JSON.stringify(updates.event_data) : undefined,
        updated_at: timestamp
      })
      .eq('id', id);

    if (error) {
      trackErrorWithContext(new Error(`Failed to update lead: ${error.message}`), {
        category: 'LEAD',
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
      category: 'LEAD',
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
        category: 'LEAD',
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
      category: 'LEAD',
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

export const associateLeadWithMap = async (leadId: string, mapId: string): Promise<void> => {
  return updateLead(leadId, { map_id: mapId });
};

export const associateLeadWithFeedback = async (leadId: string, feedbackId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('map_leads')
      .update({ feedback_id: feedbackId })
      .eq('id', leadId);

    if (error) {
      trackErrorWithContext(new Error(`Failed to associate lead with feedback: ${error.message}`), {
        category: 'LEAD',
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
      category: 'LEAD',
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
      category: 'LEAD',
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
