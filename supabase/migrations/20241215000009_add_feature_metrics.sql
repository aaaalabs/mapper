-- Create map_features table
CREATE TABLE IF NOT EXISTS map_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feature_name VARCHAR NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create map_feature_metrics table
CREATE TABLE IF NOT EXISTS map_feature_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feature_id UUID NOT NULL REFERENCES map_features(id),
    date DATE NOT NULL,
    total_uses INTEGER NOT NULL DEFAULT 0,
    unique_users INTEGER NOT NULL DEFAULT 0,
    avg_duration FLOAT,
    success_rate FLOAT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(feature_id, date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_map_feature_metrics_date ON map_feature_metrics(date DESC);
CREATE INDEX IF NOT EXISTS idx_map_feature_metrics_feature_id ON map_feature_metrics(feature_id);

-- Enable RLS
ALTER TABLE map_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_feature_metrics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow admins to view features" ON map_features;
    DROP POLICY IF EXISTS "Allow admins to view feature metrics" ON map_feature_metrics;

    -- Create new policies
    CREATE POLICY "Allow admins to view features"
        ON map_features
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

    CREATE POLICY "Allow admins to view feature metrics"
        ON map_feature_metrics
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

-- Drop and recreate function to update feature metrics
DROP FUNCTION IF EXISTS update_map_feature_metrics() CASCADE;

CREATE FUNCTION update_map_feature_metrics()
RETURNS TRIGGER AS $$
DECLARE
    v_date DATE;
BEGIN
    -- Ensure map_feature_events table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'map_feature_events') THEN
        RAISE EXCEPTION 'Table map_feature_events does not exist';
    END IF;

    v_date := DATE(NEW.timestamp);
    
    INSERT INTO map_feature_metrics (feature_id, date, total_uses, unique_users, avg_duration, success_rate)
    VALUES (
        NEW.feature_id,
        v_date,
        1,
        1,
        CASE WHEN NEW.duration IS NOT NULL THEN NEW.duration::FLOAT ELSE NULL END,
        CASE WHEN NEW.success IS NOT NULL THEN NEW.success::INTEGER ELSE 1 END
    )
    ON CONFLICT (feature_id, date)
    DO UPDATE SET
        total_uses = map_feature_metrics.total_uses + 1,
        unique_users = (
            SELECT COUNT(DISTINCT user_id)
            FROM map_feature_events
            WHERE feature_id = NEW.feature_id
            AND DATE(timestamp) = v_date
        ),
        avg_duration = CASE
            WHEN NEW.duration IS NOT NULL THEN
                (map_feature_metrics.avg_duration * map_feature_metrics.total_uses + NEW.duration::FLOAT) / (map_feature_metrics.total_uses + 1)
            ELSE map_feature_metrics.avg_duration
        END,
        success_rate = (
            SELECT COALESCE(AVG(success::INTEGER), 1)::FLOAT
            FROM map_feature_events
            WHERE feature_id = NEW.feature_id
            AND DATE(timestamp) = v_date
        );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update metrics on new events
DO $$
BEGIN
    -- Only create trigger if map_feature_events table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'map_feature_events') THEN
        CREATE TRIGGER update_map_feature_metrics_on_event
            AFTER INSERT ON map_feature_events
            FOR EACH ROW
            EXECUTE FUNCTION update_map_feature_metrics();
    END IF;
END $$;
