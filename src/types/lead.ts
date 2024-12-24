import type { Database } from './supabase';

// Lead types must match database constraints
export type LeadType = 'beta_waitlist' | 'data_extraction' | 'feedback';
export type LeadStatus = 'pending' | 'contacted' | 'converted' | 'rejected';

// Base interface matching database schema
export interface Lead {
  id: string;
  created_at: string;
  updated_at: string;
  email: string;
  name: string;
  community_link?: string | null;
  lead_type: LeadType;
  status: LeadStatus;
  map_id?: string | null;
  feedback_id?: string | null;
  notes?: string | null;
  metadata?: Record<string, any> | null;
  last_contacted_at?: string | null;
  next_followup_at?: string | null;
  source?: string | null;
  event_data?: Record<string, any> | null;
  session_id?: string | null;
}

export interface LeadInsert extends Omit<Lead, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LeadUpdate extends Partial<Omit<Lead, 'id' | 'created_at'>> {
  updated_at?: string;
}

// For backward compatibility
export type MapLead = Lead;
export type MapLeadInsert = LeadInsert;
export type MapLeadUpdate = LeadUpdate;
