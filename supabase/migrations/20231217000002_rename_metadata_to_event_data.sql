-- Rename metadata column to event_data
ALTER TABLE public.map_analytics_events 
  RENAME COLUMN metadata TO event_data;

-- Update any views that might be using the old column name
DROP VIEW IF EXISTS map_analytics_feature_usage CASCADE;
DROP VIEW IF EXISTS map_analytics_errors CASCADE;
DROP VIEW IF EXISTS map_analytics_scroll_depth CASCADE;
DROP VIEW IF EXISTS map_analytics_profile_links CASCADE;

-- Recreate views with new column name
CREATE VIEW map_analytics_feature_usage AS
SELECT
  date_trunc('day', timestamp) as day,
  event_name,
  event_data->>'feature' as feature_name,
  COUNT(*) as total_events,
  COUNT(DISTINCT session_id) as unique_sessions
FROM public.map_analytics_events
WHERE event_name LIKE 'feature_%'
  AND event_data->>'feature' IS NOT NULL
GROUP BY 1, 2, 3
ORDER BY 1 DESC, 4 DESC;

CREATE VIEW map_analytics_errors AS
SELECT
  date_trunc('day', timestamp) as day,
  event_name,
  (event_data->'error'->>'name') as error_name,
  (event_data->'error'->>'message') as error_message,
  COUNT(*) as error_count,
  COUNT(DISTINCT session_id) as affected_sessions,
  array_agg(DISTINCT event_data->>'recovery_method') FILTER (WHERE event_data->>'recovery_method' IS NOT NULL) as recovery_methods
FROM public.map_analytics_events
WHERE event_name = 'error'
GROUP BY 1, 2, 3, 4
ORDER BY 1 DESC, 5 DESC;

CREATE VIEW map_analytics_scroll_depth AS
SELECT
  date_trunc('day', timestamp) as day,
  COUNT(DISTINCT session_id) as total_sessions,
  COUNT(DISTINCT session_id) FILTER (WHERE event_data->>'depth' = '25') as reached_25_percent,
  COUNT(DISTINCT session_id) FILTER (WHERE event_data->>'depth' = '50') as reached_50_percent,
  COUNT(DISTINCT session_id) FILTER (WHERE event_data->>'depth' = '75') as reached_75_percent
FROM public.map_analytics_events
WHERE event_name = 'scroll_depth'
GROUP BY 1
ORDER BY 1 DESC;

CREATE VIEW map_analytics_profile_links AS
SELECT
  date_trunc('day', timestamp) as day,
  (event_data->>'map_id')::UUID as map_id,
  event_data->>'link_type' as link_type,
  COUNT(*) as click_count,
  COUNT(DISTINCT session_id) as unique_visitors
FROM public.map_analytics_events
WHERE event_name = 'profile_link_click'
GROUP BY 1, (event_data->>'map_id')::UUID, event_data->>'link_type'
ORDER BY 1 DESC, 4 DESC;
