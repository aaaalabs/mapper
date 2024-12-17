-- Add anonymous_id column if it doesn't exist
ALTER TABLE public.map_analytics_events 
  ADD COLUMN IF NOT EXISTS anonymous_id text;

-- Create index for anonymous_id lookups
CREATE INDEX IF NOT EXISTS idx_analytics_anonymous_id 
  ON public.map_analytics_events(anonymous_id, "timestamp" DESC) 
  TABLESPACE pg_default;

-- Disable RLS if not already disabled
ALTER TABLE public.map_analytics_events DISABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT, INSERT ON public.map_analytics_events TO anon;
GRANT SELECT, INSERT ON public.map_analytics_events TO authenticated;

-- Ensure sequence permissions if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.sequences 
    WHERE sequence_schema = 'public' 
    AND sequence_name = 'map_analytics_events_id_seq'
  ) THEN
    GRANT USAGE ON SEQUENCE public.map_analytics_events_id_seq TO anon;
    GRANT USAGE ON SEQUENCE public.map_analytics_events_id_seq TO authenticated;
  END IF;
END
$$;
