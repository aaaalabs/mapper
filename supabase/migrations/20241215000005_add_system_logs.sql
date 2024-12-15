-- Drop existing table if it exists
DROP TABLE IF EXISTS map_system_logs CASCADE;

-- Create system logs table
CREATE TABLE IF NOT EXISTS map_system_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    level TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp ON map_system_logs(timestamp DESC);

-- Enable RLS
ALTER TABLE map_system_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for admin
CREATE POLICY "Allow admin to read system_logs"
ON map_system_logs
FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'email' = 'admin@libralab.ai');

CREATE POLICY "Allow admin to insert system_logs"
ON map_system_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.jwt() ->> 'email' = 'admin@libralab.ai');

CREATE POLICY "Allow admin to update system_logs"
ON map_system_logs
FOR UPDATE
TO authenticated
USING (auth.jwt() ->> 'email' = 'admin@libralab.ai');

CREATE POLICY "Allow admin to delete system_logs"
ON map_system_logs
FOR DELETE
TO authenticated
USING (auth.jwt() ->> 'email' = 'admin@libralab.ai');

-- Function to log system events
CREATE OR REPLACE FUNCTION log_system_event(
    p_level TEXT,
    p_message TEXT,
    p_metadata JSONB DEFAULT '{}',
    p_user_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    -- Check if caller is admin
    IF NOT EXISTS (
        SELECT 1 FROM map_user_roles
        WHERE user_id = auth.uid()
        AND email = 'admin@libralab.ai'
    ) THEN
        RAISE EXCEPTION 'Permission denied';
    END IF;

    INSERT INTO map_system_logs (
        level,
        message,
        metadata,
        user_id
    ) VALUES (
        p_level,
        p_message,
        p_metadata,
        p_user_id
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
