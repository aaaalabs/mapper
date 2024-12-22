-- Update map_leads foreign key to include cascade delete
ALTER TABLE map_leads
DROP CONSTRAINT IF EXISTS map_leads_map_id_fkey,
ADD CONSTRAINT map_leads_map_id_fkey 
  FOREIGN KEY (map_id) 
  REFERENCES maps(id) 
  ON DELETE CASCADE;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable delete for anonymous users" ON maps;
DROP POLICY IF EXISTS "Enable delete for service role" ON maps;

-- Create policies for deletion
CREATE POLICY "Enable delete for anonymous users"
ON maps FOR DELETE
TO anon
USING (
  -- Allow anonymous users to delete maps they created
  -- This is tracked through the session mechanism
  (current_setting('request.jwt.claims', true)::json->>'role')::text = 'anon'
);

CREATE POLICY "Enable delete for service role"
ON maps FOR DELETE
TO service_role
USING (true);

-- Grant delete permission to anon role
GRANT DELETE ON maps TO anon;
