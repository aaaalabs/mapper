-- Ensure proper permissions first
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;

-- First, drop tables that are unnecessary for MVP
DROP TABLE IF EXISTS map_user_sessions CASCADE;
DROP TABLE IF EXISTS map_user_journey_flow CASCADE;
DROP TABLE IF EXISTS map_profile_link_clicks CASCADE;
DROP TABLE IF EXISTS map_features CASCADE;

-- Consolidate analytics tracking
-- Add feature tracking to main analytics events table
ALTER TABLE map_analytics_events
  ADD COLUMN IF NOT EXISTS feature_name TEXT,
  ADD COLUMN IF NOT EXISTS feature_metadata JSONB DEFAULT '{}'::jsonb;

-- Create index for feature analytics
CREATE INDEX IF NOT EXISTS idx_analytics_feature_name 
  ON map_analytics_events(feature_name, timestamp DESC)
  WHERE feature_name IS NOT NULL;

-- Create view for feature usage analytics
CREATE OR REPLACE VIEW public.feature_usage_analytics AS
SELECT
  feature_name,
  DATE_TRUNC('day', timestamp) as day,
  COUNT(*) as total_uses,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(CASE WHEN (metadata->>'success')::boolean = true THEN 1 END)::float / COUNT(*)::float as success_rate
FROM map_analytics_events
WHERE feature_name IS NOT NULL
GROUP BY feature_name, DATE_TRUNC('day', timestamp);

-- Create view for user journey analytics
CREATE OR REPLACE VIEW public.user_journey_analytics AS
SELECT
  event_name,
  DATE_TRUNC('day', timestamp) as day,
  COUNT(*) as total_events,
  COUNT(DISTINCT session_id) as unique_sessions,
  AVG((metadata->>'duration_ms')::integer) as avg_duration_ms
FROM map_analytics_events
GROUP BY event_name, DATE_TRUNC('day', timestamp);

-- Set ownership and permissions for views
ALTER VIEW public.feature_usage_analytics OWNER TO postgres;
ALTER VIEW public.user_journey_analytics OWNER TO postgres;

-- Grant permissions on views
GRANT SELECT ON public.feature_usage_analytics TO authenticated;
GRANT SELECT ON public.user_journey_analytics TO authenticated;

-- Function to track feature usage (replaces separate feature events table)
CREATE OR REPLACE FUNCTION public.track_feature_usage(
  p_feature_name TEXT,
  p_session_id TEXT,
  p_success BOOLEAN DEFAULT true,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO map_analytics_events (
    event_name,
    feature_name,
    session_id,
    metadata,
    feature_metadata
  ) VALUES (
    'feature_' || p_feature_name,
    p_feature_name,
    p_session_id,
    jsonb_build_object('success', p_success),
    p_metadata
  )
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.track_feature_usage TO authenticated, anon;

-- Ensure proper permissions are maintained
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT, INSERT ON map_analytics_events TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
