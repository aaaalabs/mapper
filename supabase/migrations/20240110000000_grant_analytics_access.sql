-- Create a role for analytics access
CREATE ROLE analytics_viewer;

-- Grant usage on the schema
GRANT USAGE ON SCHEMA public TO analytics_viewer;

-- Grant access to existing analytics tables
GRANT SELECT ON TABLE 
    map_analytics,
    map_analytics_events,
    map_feedback,
    maps
TO analytics_viewer;

-- Grant the role to authenticated users
GRANT analytics_viewer TO authenticated;

-- Ensure future tables get the same grants
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT SELECT ON TABLES TO analytics_viewer; 