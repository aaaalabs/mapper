-- Conversion Funnel View
CREATE OR REPLACE VIEW map_analytics_conversion_funnel AS
WITH funnel_stages AS (
  SELECT
    date_trunc('day', timestamp) as day,
    COUNT(DISTINCT session_id) FILTER (WHERE event_name = 'map_creation_started') as started,
    COUNT(DISTINCT session_id) FILTER (WHERE event_name = 'map_creation_completed') as completed,
    COUNT(DISTINCT session_id) FILTER (WHERE event_name = 'map_sharing_completed') as shared,
    COUNT(DISTINCT session_id) FILTER (WHERE event_name = 'map_download_completed') as downloaded
  FROM map_analytics_events
  GROUP BY date_trunc('day', timestamp)
)
SELECT 
  day,
  started,
  completed,
  shared,
  downloaded,
  ROUND((completed::numeric / NULLIF(started, 0)) * 100, 2) as completion_rate,
  ROUND((shared::numeric / NULLIF(completed, 0)) * 100, 2) as share_rate,
  ROUND((downloaded::numeric / NULLIF(completed, 0)) * 100, 2) as download_rate
FROM funnel_stages
ORDER BY day DESC;

-- Feature Interest View
CREATE OR REPLACE VIEW map_analytics_feature_engagement AS
WITH feature_times AS (
  SELECT
    session_id,
    event_data->>'feature' as feature_name,
    timestamp,
    LEAD(timestamp) OVER (PARTITION BY session_id ORDER BY timestamp) as next_timestamp
  FROM map_analytics_events
  WHERE event_name IN ('feature_hover', 'feature_click')
    AND event_data->>'feature' IS NOT NULL
)
SELECT
  ft.feature_name,
  COUNT(*) FILTER (WHERE e.event_name = 'feature_hover') as hover_count,
  COUNT(*) FILTER (WHERE e.event_name = 'feature_click') as click_count,
  COUNT(DISTINCT ft.session_id) as unique_users,
  ROUND(AVG(
    CASE 
      WHEN ft.next_timestamp IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (ft.next_timestamp - ft.timestamp))
      ELSE 0 
    END
  )::numeric, 2) as avg_time_spent_seconds
FROM feature_times ft
LEFT JOIN map_analytics_events e ON 
  e.session_id = ft.session_id 
  AND e.event_data->>'feature' = ft.feature_name
WHERE e.event_name IN ('feature_hover', 'feature_click')
GROUP BY ft.feature_name
ORDER BY click_count DESC;

-- Error Analysis View
CREATE OR REPLACE VIEW map_analytics_error_tracking AS
SELECT
  date_trunc('hour', timestamp) as hour,
  (event_data->'error'->>'name') as error_name,
  (event_data->'error'->>'message') as error_message,
  COUNT(*) as error_count,
  COUNT(DISTINCT session_id) as affected_users,
  array_agg(DISTINCT event_data->>'recovery_method') FILTER (
    WHERE event_name = 'error_recovery_attempt'
  ) as recovery_methods
FROM map_analytics_events
WHERE event_name IN ('uncaught_error', 'error_recovery_attempt')
GROUP BY 
  date_trunc('hour', timestamp),
  (event_data->'error'->>'name'),
  (event_data->'error'->>'message')
ORDER BY hour DESC;

-- User Journey Analysis
CREATE OR REPLACE VIEW map_analytics_user_journey AS
WITH journey_steps AS (
  SELECT
    session_id,
    array_agg(event_name ORDER BY timestamp) as event_sequence,
    count(*) as total_events,
    min(timestamp) as session_start,
    max(timestamp) as session_end,
    extract(epoch from (max(timestamp) - min(timestamp))) as session_duration_seconds
  FROM map_analytics_events
  GROUP BY session_id
)
SELECT
  count(*) as total_sessions,
  avg(total_events) as avg_events_per_session,
  avg(session_duration_seconds)::integer as avg_session_duration_seconds,
  percentile_cont(0.5) WITHIN GROUP (ORDER BY session_duration_seconds) as median_session_duration_seconds,
  mode() WITHIN GROUP (ORDER BY event_sequence[1]) as most_common_first_action,
  mode() WITHIN GROUP (ORDER BY event_sequence[array_length(event_sequence, 1)]) as most_common_last_action
FROM journey_steps
WHERE session_duration_seconds > 0
GROUP BY date_trunc('day', session_start);

-- Landing Page Engagement
CREATE OR REPLACE VIEW map_analytics_landing_page_engagement AS
SELECT
  date_trunc('hour', timestamp) as hour,
  COUNT(DISTINCT session_id) FILTER (WHERE event_name = 'demo_map_interaction') as demo_interactions,
  COUNT(DISTINCT session_id) FILTER (WHERE event_name = 'cta_click') as cta_clicks,
  COUNT(DISTINCT session_id) FILTER (WHERE event_data->>'depth' = '25') as reached_25_percent,
  COUNT(DISTINCT session_id) FILTER (WHERE event_data->>'depth' = '50') as reached_50_percent,
  COUNT(DISTINCT session_id) FILTER (WHERE event_data->>'depth' = '75') as reached_75_percent,
  ROUND(
    (COUNT(DISTINCT session_id) FILTER (WHERE event_name = 'cta_click')::numeric / 
    NULLIF(COUNT(DISTINCT session_id), 0) * 100
  ), 2) as cta_click_rate
FROM map_analytics_events
GROUP BY date_trunc('hour', timestamp)
ORDER BY hour DESC;

-- Add feedback analytics views
CREATE OR REPLACE VIEW map_feedback_metrics AS
SELECT
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as total_feedback,
  AVG(satisfaction_rating) as avg_rating,
  COUNT(CASE WHEN satisfaction_rating >= 4 THEN 1 END) as positive_ratings,
  COUNT(CASE WHEN satisfaction_rating < 4 THEN 1 END) as negative_ratings,
  COUNT(CASE WHEN can_feature = true THEN 1 END) as potential_testimonials,
  COUNT(CASE WHEN testimonial IS NOT NULL THEN 1 END) as detailed_feedback
FROM map_feedback
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

CREATE OR REPLACE VIEW map_feedback_by_use_case AS
SELECT
  use_case,
  COUNT(*) as count,
  AVG(satisfaction_rating) as avg_rating,
  COUNT(CASE WHEN can_feature = true THEN 1 END) as potential_testimonials
FROM map_feedback
WHERE use_case IS NOT NULL
GROUP BY use_case
ORDER BY count DESC;

CREATE OR REPLACE VIEW map_feedback_pain_points AS
SELECT
  use_case,
  testimonial,
  satisfaction_rating,
  created_at
FROM map_feedback
WHERE satisfaction_rating < 4
  AND testimonial IS NOT NULL
ORDER BY created_at DESC;

CREATE OR REPLACE VIEW map_potential_testimonials AS
SELECT
  testimonial,
  satisfaction_rating,
  use_case,
  organization_name,
  created_at
FROM map_feedback
WHERE can_feature = true
  AND testimonial IS NOT NULL
  AND satisfaction_rating >= 4
ORDER BY created_at DESC; 