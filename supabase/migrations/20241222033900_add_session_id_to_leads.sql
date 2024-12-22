-- Add session_id column to map_leads
ALTER TABLE public.map_leads
ADD COLUMN IF NOT EXISTS session_id text;

-- Create index for session_id
CREATE INDEX IF NOT EXISTS map_leads_session_id_idx ON public.map_leads USING btree (session_id);

-- Update existing leads with session_ids from event_data
UPDATE public.map_leads
SET session_id = (
  CASE 
    WHEN event_data->>'session_id' IS NOT NULL THEN event_data->>'session_id'
    WHEN metadata->>'session_id' IS NOT NULL THEN metadata->>'session_id'
    ELSE NULL
  END
)
WHERE session_id IS NULL;

-- Create a function to ensure session_id is captured on lead conversion
CREATE OR REPLACE FUNCTION public.ensure_lead_session_id()
RETURNS trigger AS $$
BEGIN
  -- If session_id is not set and status is being changed to 'converted'
  IF NEW.status = 'converted' AND NEW.session_id IS NULL THEN
    -- Try to get session_id from event_data or metadata
    NEW.session_id := COALESCE(
      NEW.event_data->>'session_id',
      NEW.metadata->>'session_id'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run before insert or update
DROP TRIGGER IF EXISTS ensure_lead_session_id_trigger ON public.map_leads;
CREATE TRIGGER ensure_lead_session_id_trigger
  BEFORE INSERT OR UPDATE OF status
  ON public.map_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_lead_session_id();
