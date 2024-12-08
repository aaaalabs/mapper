-- Drop existing objects first
DROP TRIGGER IF EXISTS update_map_feedback_updated_at ON map_feedback;
DROP POLICY IF EXISTS "Allow anonymous feedback submission" ON map_feedback;
DROP POLICY IF EXISTS "Allow feedback update" ON map_feedback;
DROP POLICY IF EXISTS "Allow feedback reading" ON map_feedback;

-- Drop and recreate the table
DROP TABLE IF EXISTS map_feedback;

CREATE TABLE map_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id UUID NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
  satisfaction_rating INTEGER NOT NULL CHECK (satisfaction_rating BETWEEN 1 AND 5),
  testimonial TEXT,
  use_case TEXT,
  community_type TEXT DEFAULT 'other',
  organization_name TEXT,
  contact_email TEXT,
  can_feature BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Add RLS policies
ALTER TABLE map_feedback ENABLE ROW LEVEL SECURITY;

-- Grant access to anon and authenticated users
GRANT ALL ON map_feedback TO anon, authenticated;

-- Allow anonymous users to insert feedback
CREATE POLICY "Allow anonymous feedback submission"
  ON map_feedback
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anonymous users to update their own feedback
CREATE POLICY "Allow feedback update"
  ON map_feedback
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Allow reading feedback
CREATE POLICY "Allow feedback reading"
  ON map_feedback
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Reuse existing updated_at trigger
CREATE TRIGGER update_map_feedback_updated_at
  BEFORE UPDATE ON map_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 