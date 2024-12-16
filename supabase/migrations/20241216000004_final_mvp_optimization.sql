-- Drop non-essential views
DROP VIEW IF EXISTS map_analytics_conversion_funnel CASCADE;
DROP VIEW IF EXISTS map_feedback_metrics CASCADE;
DROP VIEW IF EXISTS map_error_analytics CASCADE;
DROP VIEW IF EXISTS map_feedback_pain_points CASCADE;
DROP VIEW IF EXISTS map_potential_testimonials CASCADE;
DROP VIEW IF EXISTS map_feedback_by_use_case CASCADE;

-- Drop non-essential tables
DROP TABLE IF EXISTS map_system_health_metrics CASCADE;
DROP TABLE IF EXISTS map_performance_metrics CASCADE;
DROP TABLE IF EXISTS map_feature_metrics CASCADE;
DROP TABLE IF EXISTS map_feature_events CASCADE;
DROP TABLE IF EXISTS map_error_events CASCADE;

-- Ensure map_feedback has required columns
ALTER TABLE map_feedback
  ADD COLUMN IF NOT EXISTS use_case TEXT,
  ADD COLUMN IF NOT EXISTS satisfaction_rating INTEGER,
  ADD COLUMN IF NOT EXISTS session_id TEXT;

-- Consolidate analytics events
ALTER TABLE map_analytics_events
  ADD COLUMN IF NOT EXISTS error_type TEXT,
  ADD COLUMN IF NOT EXISTS error_message TEXT,
  ADD COLUMN IF NOT EXISTS performance_data JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS feature_name TEXT;

-- Create optimized views for admin dashboard
CREATE OR REPLACE VIEW public.map_analytics_conversion_funnel AS
SELECT 
  DATE_TRUNC('day', timestamp) as day,
  event_name,
  COUNT(*) as total_events,
  COUNT(DISTINCT session_id) as unique_sessions
FROM map_analytics_events
GROUP BY DATE_TRUNC('day', timestamp), event_name;

CREATE OR REPLACE VIEW public.map_feedback_metrics AS
SELECT
  DATE_TRUNC('day', created_at) as day,
  COUNT(*) as total_feedback,
  AVG(satisfaction_rating) as avg_rating
FROM map_feedback
GROUP BY DATE_TRUNC('day', created_at);

CREATE OR REPLACE VIEW public.map_error_analytics AS
SELECT
  error_type,
  DATE_TRUNC('day', timestamp) as day,
  COUNT(*) as error_count,
  COUNT(DISTINCT session_id) as affected_sessions,
  mode() WITHIN GROUP (ORDER BY error_message) as most_common_error
FROM map_analytics_events
WHERE error_type IS NOT NULL
GROUP BY error_type, DATE_TRUNC('day', timestamp);

-- Create helper function for analytics
CREATE OR REPLACE FUNCTION public.track_event(
  p_event_name TEXT,
  p_session_id TEXT,
  p_metadata JSONB DEFAULT NULL,
  p_error_type TEXT DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_performance_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO map_analytics_events (
    event_name,
    session_id,
    metadata,
    error_type,
    error_message,
    performance_data
  ) VALUES (
    p_event_name,
    p_session_id,
    COALESCE(p_metadata, '{}'::jsonb),
    p_error_type,
    p_error_message,
    p_performance_data
  )
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE map_analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_feedback ENABLE ROW LEVEL SECURITY;

-- Grant minimal permissions
GRANT EXECUTE ON FUNCTION public.track_event TO anon;
GRANT INSERT ON map_analytics_events TO anon;
GRANT INSERT ON map_feedback TO anon;

-- Admin-only access to analytics views
CREATE POLICY "Admin read access" ON map_analytics_events
  FOR SELECT TO authenticated
  USING (current_setting('request.jwt.claims', true)::json->>'email' = 'admin@libralab.ai');

CREATE POLICY "Admin read access" ON map_feedback
  FOR SELECT TO authenticated
  USING (current_setting('request.jwt.claims', true)::json->>'email' = 'admin@libralab.ai');

-- Anonymous insert policies
CREATE POLICY "Anonymous insert" ON map_analytics_events
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous feedback" ON map_feedback
  FOR INSERT TO anon
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_analytics_session_timestamp 
  ON map_analytics_events(session_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_error_type 
  ON map_analytics_events(error_type, timestamp DESC) 
  WHERE error_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_feedback_session 
  ON map_feedback(session_id, created_at DESC);

-- Add data retention to prevent unbounded growth
CREATE OR REPLACE FUNCTION public.cleanup_old_analytics()
RETURNS void AS $$
BEGIN
  -- Keep analytics events for 90 days
  DELETE FROM map_analytics_events 
  WHERE timestamp < NOW() - INTERVAL '90 days';
    
  -- Keep feedback for 180 days
  DELETE FROM map_feedback
  WHERE created_at < NOW() - INTERVAL '180 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
