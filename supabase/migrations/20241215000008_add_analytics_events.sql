-- Drop existing tables and their policies
DROP TABLE IF EXISTS map_analytics_events CASCADE;
DROP TABLE IF EXISTS map_feature_events CASCADE;
DROP TABLE IF EXISTS map_analytics_conversion_funnel CASCADE;
DROP TABLE IF EXISTS map_profile_link_clicks CASCADE;

-- Create analytics events table
CREATE TABLE IF NOT EXISTS map_analytics_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_name TEXT NOT NULL,
    session_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    timestamp TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create feature events table
CREATE TABLE IF NOT EXISTS map_feature_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    feature_id UUID NOT NULL,
    event_type TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    timestamp TIMESTAMPTZ DEFAULT now(),
    duration_ms INTEGER,
    success BOOLEAN,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'
);

-- Create conversion funnel table
CREATE TABLE IF NOT EXISTS map_analytics_conversion_funnel (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    day DATE NOT NULL,
    event_name TEXT NOT NULL,
    count INTEGER DEFAULT 0,
    UNIQUE(day, event_name)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON map_analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feature_events_timestamp ON map_feature_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_conversion_funnel_day ON map_analytics_conversion_funnel(day DESC);

-- Enable RLS
ALTER TABLE map_analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_feature_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_analytics_conversion_funnel ENABLE ROW LEVEL SECURITY;

-- Create policies for analytics_events
CREATE POLICY "Allow admin to read analytics_events"
    ON map_analytics_events
    FOR SELECT
    TO authenticated
    USING (auth.jwt() ->> 'email' = 'admin@libralab.ai');

CREATE POLICY "Allow admin to insert analytics_events"
    ON map_analytics_events
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.jwt() ->> 'email' = 'admin@libralab.ai');

CREATE POLICY "Allow admin to update analytics_events"
    ON map_analytics_events
    FOR UPDATE
    TO authenticated
    USING (auth.jwt() ->> 'email' = 'admin@libralab.ai');

CREATE POLICY "Allow admin to delete analytics_events"
    ON map_analytics_events
    FOR DELETE
    TO authenticated
    USING (auth.jwt() ->> 'email' = 'admin@libralab.ai');

-- Create policies for feature_events
CREATE POLICY "Admin can do everything on features"
ON map_feature_events FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM map_user_roles
        WHERE user_id = auth.uid()
        AND email = 'admin@libralab.ai'
    )
);

-- Create policies for conversion funnel
CREATE POLICY "Admin can do everything on funnel"
ON map_analytics_conversion_funnel FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM map_user_roles
        WHERE user_id = auth.uid()
        AND email = 'admin@libralab.ai'
    )
);

-- Create profile link clicks table
CREATE TABLE IF NOT EXISTS map_profile_link_clicks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    link_type VARCHAR NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for link clicks
CREATE INDEX IF NOT EXISTS idx_profile_link_clicks_created_at ON map_profile_link_clicks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_link_clicks_link_type ON map_profile_link_clicks(link_type);
CREATE INDEX IF NOT EXISTS idx_profile_link_clicks_user_id ON map_profile_link_clicks(user_id);

-- Enable RLS
ALTER TABLE map_profile_link_clicks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow authenticated users to insert link clicks" ON map_profile_link_clicks;
    DROP POLICY IF EXISTS "Allow admins to view link clicks" ON map_profile_link_clicks;

    -- Create new policies
    CREATE POLICY "Allow authenticated users to insert link clicks"
        ON map_profile_link_clicks
        FOR INSERT
        TO authenticated
        WITH CHECK (true);

    CREATE POLICY "Allow admins to view link clicks"
        ON map_profile_link_clicks
        FOR SELECT
        TO authenticated
        USING (
            EXISTS (
                SELECT 1
                FROM map_user_roles admin_check
                WHERE admin_check.user_id = auth.uid()
                AND admin_check.role = 'admin'
            )
        );
END $$;
