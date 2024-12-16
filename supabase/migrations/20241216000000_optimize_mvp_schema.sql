-- Optimize maps table for MVP
ALTER TABLE maps 
  DROP COLUMN IF EXISTS user_id;

-- Simplify maps RLS policies
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON maps;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON maps;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON maps;

-- Ensure we only have necessary indexes
DROP INDEX IF EXISTS idx_maps_user_id;

-- Optimize analytics tables
ALTER TABLE map_analytics_events
  DROP COLUMN IF EXISTS user_id;

-- Add composite index for better analytics performance
CREATE INDEX IF NOT EXISTS idx_analytics_session_timestamp 
  ON map_analytics_events(session_id, timestamp);

-- Optimize leads table indexes
CREATE INDEX IF NOT EXISTS idx_leads_created_at 
  ON map_leads(created_at);

-- Add admin role check function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    current_setting('request.jwt.claims', true)::json->>'email' = 'admin@libralab.ai'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies for admin access to analytics
CREATE POLICY "Enable admin read analytics" ON map_analytics_events
  FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "Enable admin read leads" ON map_leads
  FOR SELECT TO authenticated
  USING (is_admin());

-- Ensure proper grants
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
