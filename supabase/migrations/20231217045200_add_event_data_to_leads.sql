-- Add event_data column to map_leads table
ALTER TABLE public.map_leads
  ADD COLUMN IF NOT EXISTS event_data JSONB;
