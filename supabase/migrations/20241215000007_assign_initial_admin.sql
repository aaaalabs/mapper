-- Assign admin role to the initial admin user
-- Get the user ID for admin@libralab.ai and set as admin
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get the user ID
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'admin@libralab.ai';

    -- If user exists, ensure they are admin
    IF v_user_id IS NOT NULL THEN
        DELETE FROM map_user_roles WHERE user_id = v_user_id;
        INSERT INTO map_user_roles (user_id, role, email)
        VALUES (v_user_id, 'admin', 'admin@libralab.ai');
    END IF;
END $$;
