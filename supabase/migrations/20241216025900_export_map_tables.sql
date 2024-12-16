-- Create a function to get table schemas
CREATE OR REPLACE FUNCTION get_map_schemas()
RETURNS TABLE (
    schema_definition text
) AS $$
BEGIN
    -- Get table definitions
    RETURN QUERY
    SELECT 
        format(
            'CREATE TABLE %I.%I (%s);',
            table_schema,
            table_name,
            string_agg(
                format(
                    '%I %s%s%s',
                    column_name,
                    udt_name,
                    CASE 
                        WHEN character_maximum_length IS NOT NULL 
                        THEN format('(%s)', character_maximum_length)
                        ELSE ''
                    END,
                    CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END
                ),
                ', '
            )
        ) as schema_definition
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name LIKE 'map_%'
    GROUP BY table_schema, table_name;

    -- Get view definitions
    RETURN QUERY
    SELECT 
        format(
            'CREATE OR REPLACE VIEW %I.%I AS %s;',
            schemaname,
            viewname,
            definition
        ) as schema_definition
    FROM pg_views
    WHERE schemaname = 'public'
        AND (viewname LIKE 'map_%' OR viewname LIKE 'maps_%');

    -- Get foreign key constraints
    RETURN QUERY
    SELECT 
        format(
            'ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY (%s) REFERENCES %I.%I (%s);',
            tc.table_schema,
            tc.table_name,
            tc.constraint_name,
            string_agg(kcu.column_name, ', '),
            ccu.table_schema,
            ccu.table_name,
            string_agg(ccu.column_name, ', ')
        ) as schema_definition
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name LIKE 'map_%'
    GROUP BY tc.table_schema, tc.table_name, tc.constraint_name, 
             ccu.table_schema, ccu.table_name;

    -- Get indexes
    RETURN QUERY
    SELECT indexdef as schema_definition
    FROM pg_indexes
    WHERE schemaname = 'public'
        AND tablename LIKE 'map_%';
END;
$$ LANGUAGE plpgsql;

-- Execute and display results
SELECT * FROM get_map_schemas();
