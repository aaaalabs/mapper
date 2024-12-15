-- Drop existing table and policies
DROP TABLE IF EXISTS map_user_roles CASCADE;

-- Create user roles table
CREATE TABLE IF NOT EXISTS map_user_roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'user',
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE map_user_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow admin to read user_roles"
    ON map_user_roles
    FOR SELECT
    TO authenticated
    USING (auth.jwt() ->> 'email' = 'admin@libralab.ai');

CREATE POLICY "Allow admin to insert user_roles"
    ON map_user_roles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.jwt() ->> 'email' = 'admin@libralab.ai');

CREATE POLICY "Allow admin to update user_roles"
    ON map_user_roles
    FOR UPDATE
    TO authenticated
    USING (auth.jwt() ->> 'email' = 'admin@libralab.ai');

CREATE POLICY "Allow admin to delete user_roles"
    ON map_user_roles
    FOR DELETE
    TO authenticated
    USING (auth.jwt() ->> 'email' = 'admin@libralab.ai');
