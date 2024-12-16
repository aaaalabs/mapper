-- Drop existing foreign key constraints
ALTER TABLE map_user_sessions
  DROP CONSTRAINT IF EXISTS map_user_sessions_user_id_fkey;

ALTER TABLE map_user_journey_flow
  DROP CONSTRAINT IF EXISTS map_user_journey_flow_user_id_fkey;

-- Drop user_id columns and related indexes
ALTER TABLE map_user_sessions
  DROP COLUMN IF EXISTS user_id;

DROP INDEX IF EXISTS idx_map_user_sessions_user_id;

ALTER TABLE map_user_journey_flow
  DROP COLUMN IF EXISTS user_id;

-- Drop user authentication dependencies from feature events
ALTER TABLE map_feature_events
  DROP CONSTRAINT IF EXISTS map_feature_events_user_id_fkey,
  DROP COLUMN IF EXISTS user_id;

-- Drop unnecessary indexes
DROP INDEX IF EXISTS idx_feature_events_user_id;
DROP INDEX IF EXISTS idx_map_feature_events_user_id;

-- Add session tracking to feature events
ALTER TABLE map_feature_events
  ADD COLUMN IF NOT EXISTS session_id TEXT,
  ADD COLUMN IF NOT EXISTS client_timestamp TIMESTAMPTZ;

-- Create optimized indexes for session-based analytics
CREATE INDEX IF NOT EXISTS idx_feature_events_session 
  ON map_feature_events(session_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_feature_events_composite 
  ON map_feature_events(feature_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_map_user_sessions_composite 
  ON map_user_sessions(session_id, start_time);

CREATE INDEX IF NOT EXISTS idx_map_user_journey_composite 
  ON map_user_journey_flow(session_id, timestamp);

-- Update conversion funnel calculation
CREATE OR REPLACE FUNCTION calculate_daily_conversion_metrics()
RETURNS void AS $$
BEGIN
  -- Clear existing metrics for today
  DELETE FROM map_analytics_conversion_funnel 
  WHERE day = CURRENT_DATE;
  
  -- Insert new metrics based on sessions instead of users
  INSERT INTO map_analytics_conversion_funnel (
    day,
    event_name,
    count
  )
  SELECT 
    CURRENT_DATE as day,
    event_name,
    COUNT(DISTINCT session_id) as count
  FROM map_analytics_events
  WHERE DATE(timestamp) = CURRENT_DATE
  GROUP BY event_name;
END;
$$ LANGUAGE plpgsql;

-- Update feature metrics calculation to be session-based instead of user-based
CREATE OR REPLACE FUNCTION calculate_feature_metrics()
RETURNS void AS $$
BEGIN
  -- Clear existing metrics for today
  DELETE FROM map_feature_metrics 
  WHERE date = CURRENT_DATE;
  
  -- Insert new metrics based on sessions instead of users
  INSERT INTO map_feature_metrics (
    feature_id,
    date,
    total_uses,
    unique_users, -- now represents unique sessions
    avg_duration,
    success_rate
  )
  SELECT 
    feature_id,
    CURRENT_DATE as date,
    COUNT(*) as total_uses,
    COUNT(DISTINCT session_id) as unique_users,
    AVG(duration) as avg_duration,
    COALESCE(
      SUM(CASE WHEN event_type = 'complete' THEN 1 ELSE 0 END)::numeric / 
      NULLIF(COUNT(*), 0),
      0
    ) as success_rate
  FROM map_feature_events
  WHERE 
    DATE(timestamp) = CURRENT_DATE
  GROUP BY feature_id;
END;
$$ LANGUAGE plpgsql;

-- Update RLS policies to focus on admin access
DROP POLICY IF EXISTS "Allow authenticated users" ON map_user_sessions;
DROP POLICY IF EXISTS "Allow authenticated users" ON map_user_journey_flow;
DROP POLICY IF EXISTS "Allow authenticated users" ON map_feature_events;
DROP POLICY IF EXISTS "Allow authenticated users" ON map_analytics_events;
DROP POLICY IF EXISTS "Allow authenticated users" ON map_analytics_conversion_funnel;

-- Recreate policies for admin-only access
CREATE POLICY "Enable admin access" ON map_user_sessions
  FOR ALL TO authenticated
  USING (current_setting('request.jwt.claims', true)::json->>'email' = 'admin@libralab.ai')
  WITH CHECK (current_setting('request.jwt.claims', true)::json->>'email' = 'admin@libralab.ai');

CREATE POLICY "Enable admin access" ON map_user_journey_flow
  FOR ALL TO authenticated
  USING (current_setting('request.jwt.claims', true)::json->>'email' = 'admin@libralab.ai')
  WITH CHECK (current_setting('request.jwt.claims', true)::json->>'email' = 'admin@libralab.ai');

CREATE POLICY "Enable admin access" ON map_feature_events
  FOR ALL TO authenticated
  USING (current_setting('request.jwt.claims', true)::json->>'email' = 'admin@libralab.ai')
  WITH CHECK (current_setting('request.jwt.claims', true)::json->>'email' = 'admin@libralab.ai');

CREATE POLICY "Enable admin access" ON map_analytics_events
  FOR ALL TO authenticated
  USING (current_setting('request.jwt.claims', true)::json->>'email' = 'admin@libralab.ai')
  WITH CHECK (current_setting('request.jwt.claims', true)::json->>'email' = 'admin@libralab.ai');

CREATE POLICY "Enable admin access" ON map_analytics_conversion_funnel
  FOR ALL TO authenticated
  USING (current_setting('request.jwt.claims', true)::json->>'email' = 'admin@libralab.ai')
  WITH CHECK (current_setting('request.jwt.claims', true)::json->>'email' = 'admin@libralab.ai');

-- Allow anonymous inserts for analytics
CREATE POLICY "Enable anonymous insert" ON map_user_sessions
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Enable anonymous insert" ON map_user_journey_flow
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Enable anonymous insert" ON map_feature_events
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Enable anonymous insert" ON map_analytics_events
  FOR INSERT TO anon
  WITH CHECK (true);

-- Update view permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT ON map_user_sessions, map_user_journey_flow, map_feature_events, map_analytics_events TO anon;
