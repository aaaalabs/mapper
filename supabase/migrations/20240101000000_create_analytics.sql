-- Create map analytics events table
CREATE TABLE map_analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_name TEXT NOT NULL,
  event_data JSONB,
  session_id TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for querying by event name
CREATE INDEX idx_map_analytics_event_name ON map_analytics_events(event_name);

-- Create index for querying by session
CREATE INDEX idx_map_analytics_session ON map_analytics_events(session_id);

-- Create index for timestamp queries
CREATE INDEX idx_map_analytics_timestamp ON map_analytics_events(timestamp);

-- Enable Row Level Security
ALTER TABLE map_analytics_events ENABLE ROW LEVEL SECURITY;

-- Create policy to allow inserts from authenticated service role
CREATE POLICY "Enable insert for service role" ON map_analytics_events
  FOR INSERT TO service_role
  WITH CHECK (true);

-- Create policy to allow read access for service role
CREATE POLICY "Enable read for service role" ON map_analytics_events
  FOR SELECT TO service_role
  USING (true); 