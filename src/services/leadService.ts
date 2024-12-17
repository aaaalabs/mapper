import { supabase } from '../lib/supabase';

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

export async function createLead(lead: Lead) {
  try {
    const timestamp = new Date().toISOString();
    const currentUser = (await supabase.auth.getUser()).data.user;

    // Don't create leads for admin user
    if (currentUser?.email === 'admin@libralab.ai') {
      return null;
    }

    const { data, error } = await supabase
      .from('map_leads')
      .insert([{
        ...lead,
        status: lead.status || 'pending',
        event_data: lead.event_data ? JSON.stringify(lead.event_data) : null,
        created_at: timestamp,
        updated_at: timestamp
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating lead:', error);
      throw new Error('Failed to create lead');
    }

    return data;
  } catch (error) {
    console.error('Error in createLead:', error);
    throw new Error('Failed to create lead');
  }
}

export async function updateLead(id: string, updates: Partial<Lead>) {
  try {
    const timestamp = new Date().toISOString();
    const { data, error } = await supabase
      .from('map_leads')
      .update({
        ...updates,
        event_data: updates.event_data ? JSON.stringify(updates.event_data) : undefined,
        updated_at: timestamp
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating lead:', error);
      throw new Error('Failed to update lead');
    }

    return data;
  } catch (error) {
    console.error('Error in updateLead:', error);
    throw new Error('Failed to update lead');
  }
}

export async function findLeadByEmail(email: string) {
  try {
    const { data, error } = await supabase
      .from('map_leads')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No lead found
      }
      console.error('Error finding lead:', error);
      throw new Error('Failed to find lead');
    }

    return data;
  } catch (error) {
    console.error('Error in findLeadByEmail:', error);
    throw new Error('Failed to find lead');
  }
}

export async function associateLeadWithMap(leadId: string, mapId: string) {
  return updateLead(leadId, { map_id: mapId });
}

export async function associateLeadWithFeedback(leadId: string, feedbackId: string) {
  return updateLead(leadId, { feedback_id: feedbackId });
}

export async function trackLeadInteraction(email: string, interactionType: string, event_data: Record<string, any> = {}) {
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

    return updateLead(lead.id!, { event_data: updatedEventData });
  }
}
