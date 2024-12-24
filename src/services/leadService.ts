import { supabase } from '../lib/supabase';
import { trackError } from './analytics';
import { ERROR_CATEGORY } from './analytics';
import type { Lead, LeadInsert, LeadUpdate } from '../types/lead';

// Create a new lead
export const createLead = async (data: Omit<LeadInsert, 'updated_at'>): Promise<Lead | null> => {
  try {
    const currentUser = (await supabase.auth.getUser()).data.user;

    // Don't create leads for admin user
    if (currentUser?.email === 'admin@libralab.ai') {
      return null;
    }

    const sessionId = localStorage.getItem('currentSessionId');

    const { data: lead, error } = await supabase
      .from('map_leads')
      .insert({
        ...data,
        status: data.status || 'pending',
        event_data: data.event_data || null,
        metadata: data.metadata || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        session_id: sessionId
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create lead:', error);
      await trackError(new Error(`Failed to create lead: ${error.message}`), {
        category: ERROR_CATEGORY.LEAD,
        severity: 'high',
        metadata: { 
          email: data.email, 
          leadType: data.lead_type,
          sessionId,
          error: error.message
        }
      });
      return null;
    }

    return lead;
  } catch (error) {
    await trackError(error instanceof Error ? error : new Error('Lead creation failed'), {
      category: ERROR_CATEGORY.LEAD,
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
        event_data: updates.event_data ?? null,
        metadata: updates.metadata ?? {},
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      await trackError(new Error(`Failed to update lead: ${error.message}`), {
        category: ERROR_CATEGORY.LEAD,
        severity: 'high',
        metadata: { leadId: id, updates }
      });
      throw error;
    }
  } catch (error) {
    await trackError(error instanceof Error ? error : new Error('Lead update failed'), {
      category: ERROR_CATEGORY.LEAD,
      severity: 'high',
      metadata: { leadId: id, updates }
    });
    throw error;
  }
};

// Find a lead by email
export const findLeadByEmail = async (email: string): Promise<Lead | null> => {
  try {
    const { data, error } = await supabase
      .from('map_leads')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      await trackError(new Error(`Failed to find lead: ${error.message}`), {
        category: ERROR_CATEGORY.LEAD,
        severity: 'high',
        metadata: { email }
      });
      return null;
    }

    return data;
  } catch (error) {
    await trackError(error instanceof Error ? error : new Error('Lead lookup failed'), {
      category: ERROR_CATEGORY.LEAD,
      severity: 'high',
      metadata: { email }
    });
    return null;
  }
};

// Associate a lead with a map
export const associateLeadWithMap = async (leadId: string, mapId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('map_leads')
      .update({ map_id: mapId })
      .eq('id', leadId);

    if (error) {
      await trackError(new Error(`Failed to associate lead with map: ${error.message}`), {
        category: ERROR_CATEGORY.LEAD,
        severity: 'high',
        metadata: { leadId, mapId }
      });
      throw error;
    }
  } catch (error) {
    await trackError(error instanceof Error ? error : new Error('Lead-map association failed'), {
      category: ERROR_CATEGORY.LEAD,
      severity: 'high',
      metadata: { leadId, mapId }
    });
    throw error;
  }
};

// Associate a lead with feedback
export const associateLeadWithFeedback = async (leadId: string, feedbackId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('map_leads')
      .update({ feedback_id: feedbackId })
      .eq('id', leadId);

    if (error) {
      await trackError(new Error(`Failed to associate lead with feedback: ${error.message}`), {
        category: ERROR_CATEGORY.LEAD,
        severity: 'high',
        metadata: { leadId, feedbackId }
      });
      throw error;
    }
  } catch (error) {
    await trackError(error instanceof Error ? error : new Error('Lead-feedback association failed'), {
      category: ERROR_CATEGORY.LEAD,
      severity: 'high',
      metadata: { leadId, feedbackId }
    });
    throw error;
  }
};

// Get all leads
export const getLeads = async (): Promise<Lead[]> => {
  try {
    const { data, error } = await supabase
      .from('map_leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      await trackError(new Error(`Failed to get leads: ${error.message}`), {
        category: ERROR_CATEGORY.LEAD,
        severity: 'high',
        metadata: {}
      });
      return [];
    }

    return data || [];
  } catch (error) {
    await trackError(error instanceof Error ? error : new Error('Get leads failed'), {
      category: ERROR_CATEGORY.LEAD,
      severity: 'high',
      metadata: {}
    });
    return [];
  }
};

// Get leads by session ID
export const getLeadsBySession = async (sessionId: string): Promise<Lead[]> => {
  try {
    const { data, error } = await supabase
      .from('map_leads')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    if (error) {
      await trackError(new Error(`Failed to get leads by session: ${error.message}`), {
        category: ERROR_CATEGORY.LEAD,
        severity: 'high',
        metadata: { sessionId }
      });
      return [];
    }

    return data || [];
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Get leads by session failed');
    await trackError(err, {
      category: ERROR_CATEGORY.LEAD,
      severity: 'high',
      metadata: { sessionId }
    });
    return [];
  }
};
