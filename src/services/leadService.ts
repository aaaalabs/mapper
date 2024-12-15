import { supabase } from '../config/supabase';

export type LeadType = 'beta_waitlist' | 'data_extraction';
export type LeadStatus = 'pending' | 'contacted' | 'converted' | 'rejected';

export interface Lead {
  id?: string;
  email: string;
  name: string;
  community_link?: string;
  lead_type: LeadType;
  status?: LeadStatus;
  map_id?: string;
  feedback_id?: string;
  notes?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export async function createLead(lead: Lead) {
  const { data, error } = await supabase
    .from('map_leads')
    .insert([{
      ...lead,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating lead:', error);
    throw error;
  }

  return data;
}

export async function updateLead(id: string, updates: Partial<Lead>) {
  const { data, error } = await supabase
    .from('map_leads')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating lead:', error);
    throw error;
  }

  return data;
}

export async function findLeadByEmail(email: string) {
  const { data, error } = await supabase
    .from('map_leads')
    .select('*')
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
    console.error('Error finding lead:', error);
    throw error;
  }

  return data;
}

export async function associateLeadWithMap(leadId: string, mapId: string) {
  return updateLead(leadId, { map_id: mapId });
}

export async function associateLeadWithFeedback(leadId: string, feedbackId: string) {
  return updateLead(leadId, { feedback_id: feedbackId });
}

export async function trackLeadInteraction(email: string, interactionType: string, metadata: Record<string, any> = {}) {
  const lead = await findLeadByEmail(email);
  
  if (lead) {
    const updatedMetadata = {
      ...lead.metadata,
      interactions: [
        ...(lead.metadata?.interactions || []),
        {
          type: interactionType,
          timestamp: new Date().toISOString(),
          ...metadata
        }
      ]
    };

    return updateLead(lead.id!, { metadata: updatedMetadata });
  }
}
