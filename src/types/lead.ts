import { Database } from './supabase';

export type LeadType = 'beta_waitlist' | 'data_extraction' | 'feedback';
export type LeadStatus = 'pending' | 'contacted' | 'converted' | 'rejected';

export interface Lead {
  id: string;
  created_at: string;
  updated_at: string;
  email: string;
  name: string;
  community_link?: string | null;
  lead_type: LeadType;
  status: LeadStatus;
  event_data?: Record<string, any> | null;
  map_id?: string | null;
  feedback_id?: string | null;
  session_id?: string | null;
}

export interface LeadInsert extends Omit<Lead, 'id' | 'created_at'> {
  email: string;
  name: string;
  lead_type: LeadType;
  status: LeadStatus;
  community_link?: string | null;
  event_data?: Record<string, any> | null;
  map_id?: string | null;
  feedback_id?: string | null;
  session_id?: string | null;
  updated_at: string;
}

export interface LeadUpdate extends Partial<Omit<Lead, 'id' | 'created_at'>> {
  event_data?: Record<string, any> | null;
  updated_at: string;
}

export type MapLead = Database['public']['Tables']['map_leads']['Row'];
export type MapLeadInsert = Database['public']['Tables']['map_leads']['Insert'];
export type MapLeadUpdate = Database['public']['Tables']['map_leads']['Update'];
