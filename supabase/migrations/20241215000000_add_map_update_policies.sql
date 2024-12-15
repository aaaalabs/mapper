-- Drop existing update policies if they exist
DROP POLICY IF EXISTS "Enable update for map creators" ON maps;
DROP POLICY IF EXISTS "Enable update for service role" ON maps;

-- Create policy to allow updates from map creators (users who created the map)
CREATE POLICY "Enable update for map creators" ON maps
  FOR UPDATE TO anon
  USING (
    -- Can update if they created the map (user_id matches)
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR
    -- Or if no user_id is set (for maps created by anonymous users)
    (user_id IS NULL)
  )
  WITH CHECK (
    -- Same conditions for the new row
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR
    (user_id IS NULL)
  );

-- Create policy to allow updates from service role
CREATE POLICY "Enable update for service role" ON maps
  FOR UPDATE TO service_role
  USING (true)
  WITH CHECK (true);

-- Add comment explaining the policies
COMMENT ON TABLE maps IS 'Stores community maps created by users. Updates are allowed for map creators and service role.';
