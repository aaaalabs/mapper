-- Drop views that are no longer needed
DROP VIEW IF EXISTS user_journey_analytics CASCADE;
DROP VIEW IF EXISTS feature_usage_analytics CASCADE;

-- Create new simplified views for the frontend
CREATE OR REPLACE VIEW map_analytics_summary AS
SELECT
  DATE_TRUNC('day', timestamp) as day,
  event_name,
  COUNT(*) as total_events,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(CASE WHEN error_type IS NOT NULL THEN 1 END) as error_count,
  AVG(CASE 
    WHEN performance_data->>'loadTime' IS NOT NULL 
    THEN (performance_data->>'loadTime')::float 
  END) as avg_load_time
FROM map_analytics_events
GROUP BY DATE_TRUNC('day', timestamp), event_name;

-- Create view for feature analytics
CREATE OR REPLACE VIEW map_feature_summary AS
SELECT
  DATE_TRUNC('day', timestamp) as day,
  feature_name,
  COUNT(*) as total_uses,
  COUNT(DISTINCT session_id) as unique_users,
  COUNT(CASE WHEN error_type IS NOT NULL THEN 1 END) as error_count
FROM map_analytics_events
WHERE feature_name IS NOT NULL
GROUP BY DATE_TRUNC('day', timestamp), feature_name;

-- Grant access to new views
GRANT SELECT ON map_analytics_summary TO authenticated;
GRANT SELECT ON map_feature_summary TO authenticated;
