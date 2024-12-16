-- First, drop dependent policies
DROP POLICY IF EXISTS "Authenticated users can insert their own maps" ON maps;
DROP POLICY IF EXISTS "Enable update for map creators" ON maps;
DROP POLICY IF EXISTS "Enable read access for all users" ON maps;
DROP POLICY IF EXISTS "Enable delete for map creators" ON maps;

-- Drop existing indexes that we'll no longer need
DROP INDEX IF EXISTS idx_maps_user_id;

-- Now we can safely modify the maps table
ALTER TABLE maps 
  DROP COLUMN IF EXISTS user_id,
  ALTER COLUMN members SET DEFAULT '[]'::jsonb,
  ALTER COLUMN settings SET DEFAULT '{
    "style": {
      "id": "standard",
      "markerStyle": "pins",
      "popupStyle": {
        "background": "#FFFFFF",
        "text": "#1D3640",
        "border": "#E2E8F0",
        "shadow": "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
      }
    },
    "features": {
      "enableClustering": false,
      "enableFullscreen": true,
      "enableSharing": true,
      "enableSearch": false
    },
    "customization": {
      "markerColor": "#E9B893",
      "clusterColor": "#F99D7C",
      "fontFamily": "Inter"
    }
  }'::jsonb;

-- Optimize map_feedback table
-- Add status tracking for feedback
ALTER TABLE map_feedback
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending',
  ADD CONSTRAINT map_feedback_status_check 
    CHECK (status IN ('pending', 'reviewed', 'contacted', 'archived'));

-- Add index for feedback management
CREATE INDEX IF NOT EXISTS idx_map_feedback_status ON map_feedback(status);
CREATE INDEX IF NOT EXISTS idx_map_feedback_rating_created ON map_feedback(satisfaction_rating, created_at);

-- Optimize map_leads table
ALTER TABLE map_leads
  ALTER COLUMN status SET DEFAULT 'pending',
  DROP CONSTRAINT IF EXISTS map_leads_status_check,
  ADD CONSTRAINT map_leads_status_check 
    CHECK (status IN ('pending', 'contacted', 'converted', 'rejected'));

-- Create optimized indexes for MVP
CREATE INDEX IF NOT EXISTS idx_maps_created_at ON maps(created_at);
CREATE INDEX IF NOT EXISTS idx_map_leads_status_created ON map_leads(status, created_at);

-- Update RLS policies for MVP (anonymous access with admin oversight)

-- Maps policies
CREATE POLICY "Enable anonymous read" ON maps
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "Enable anonymous insert" ON maps
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Enable anonymous update" ON maps
  FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

-- Map feedback policies
CREATE POLICY "Enable anonymous feedback insert" ON map_feedback
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Enable anonymous feedback read" ON map_feedback
  FOR SELECT TO anon
  USING (true);

-- Map leads policies
CREATE POLICY "Enable anonymous leads insert" ON map_leads
  FOR INSERT TO anon
  WITH CHECK (true);

-- Admin-only policies
CREATE POLICY "Enable admin read all" ON map_leads
  FOR SELECT TO authenticated
  USING (current_setting('request.jwt.claims', true)::json->>'email' = 'admin@libralab.ai');

CREATE POLICY "Enable admin update all" ON map_leads
  FOR UPDATE TO authenticated
  USING (current_setting('request.jwt.claims', true)::json->>'email' = 'admin@libralab.ai')
  WITH CHECK (current_setting('request.jwt.claims', true)::json->>'email' = 'admin@libralab.ai');

-- Ensure proper grants
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
