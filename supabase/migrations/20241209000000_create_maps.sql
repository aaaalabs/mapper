-- Create maps table
CREATE TABLE IF NOT EXISTS maps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  members JSONB NOT NULL,
  center NUMERIC[] NOT NULL,
  zoom NUMERIC NOT NULL,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_maps_user_id ON maps(user_id);
CREATE INDEX IF NOT EXISTS idx_maps_created_at ON maps(created_at);

-- Enable Row Level Security
ALTER TABLE maps ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert for anonymous users" ON maps;
DROP POLICY IF EXISTS "Enable read for anonymous users" ON maps;
DROP POLICY IF EXISTS "Enable update for anonymous users" ON maps;
DROP POLICY IF EXISTS "Enable insert for service role" ON maps;
DROP POLICY IF EXISTS "Enable read for service role" ON maps;
DROP POLICY IF EXISTS "Enable update for service role" ON maps;

-- Grant necessary permissions to roles
GRANT ALL ON maps TO anon;
GRANT ALL ON maps TO authenticated;
GRANT ALL ON maps TO service_role;

-- Create policy to allow inserts from anonymous users
CREATE POLICY "Enable insert for anonymous users" ON maps
  FOR INSERT TO anon
  WITH CHECK (true);

-- Create policy to allow read access for anonymous users
CREATE POLICY "Enable read for anonymous users" ON maps
  FOR SELECT TO anon
  USING (true);

-- Create policy to allow updates from anonymous users
CREATE POLICY "Enable update for anonymous users" ON maps
  FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

-- Create policy to allow inserts from authenticated service role
CREATE POLICY "Enable insert for service role" ON maps
  FOR INSERT TO service_role
  WITH CHECK (true);

-- Create policy to allow read access for service role
CREATE POLICY "Enable read for service role" ON maps
  FOR SELECT TO service_role
  USING (true);

-- Create policy to allow updates from service role
CREATE POLICY "Enable update for service role" ON maps
  FOR UPDATE TO service_role
  USING (true)
  WITH CHECK (true);

-- Add comments
COMMENT ON TABLE maps IS 'Stores community maps created by users';
COMMENT ON COLUMN maps.id IS 'Unique identifier for the map';
COMMENT ON COLUMN maps.name IS 'Name of the map';
COMMENT ON COLUMN maps.members IS 'JSON array of community members with their locations';
COMMENT ON COLUMN maps.center IS 'Center coordinates of the map [latitude, longitude]';
COMMENT ON COLUMN maps.zoom IS 'Zoom level of the map';
COMMENT ON COLUMN maps.user_id IS 'Optional user ID for authenticated users';
COMMENT ON COLUMN maps.created_at IS 'Timestamp when the map was created';
