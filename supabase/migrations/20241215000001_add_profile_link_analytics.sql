-- Create a view to aggregate profile link clicks per map
CREATE OR REPLACE VIEW map_profile_link_clicks AS
WITH link_clicks AS (
  SELECT 
    (event_data->>'map_id')::UUID as map_id,
    event_data->>'link_type' as link_type,
    COUNT(*) as click_count,
    MIN(timestamp) as first_click,
    MAX(timestamp) as last_click
  FROM map_analytics_events
  WHERE event_name = 'profile_link_clicked'
  GROUP BY (event_data->>'map_id')::UUID, event_data->>'link_type'
)
SELECT
  m.id as map_id,
  m.name as map_name,
  COALESCE(website.click_count, 0) as website_clicks,
  COALESCE(linkedin.click_count, 0) as linkedin_clicks,
  COALESCE(website.first_click, NULL) as first_website_click,
  COALESCE(website.last_click, NULL) as last_website_click,
  COALESCE(linkedin.first_click, NULL) as first_linkedin_click,
  COALESCE(linkedin.last_click, NULL) as last_linkedin_click
FROM maps m
LEFT JOIN link_clicks website ON m.id = website.map_id AND website.link_type = 'website'
LEFT JOIN link_clicks linkedin ON m.id = linkedin.map_id AND linkedin.link_type = 'linkedin';

-- Grant access to the view
GRANT SELECT ON map_profile_link_clicks TO anon;
GRANT SELECT ON map_profile_link_clicks TO service_role;
