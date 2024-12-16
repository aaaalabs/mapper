-- Export map tables and views schemas
SELECT 
    'CREATE TABLE ' || schemaname || '.' || tablename || ' (' ||
    string_agg(
        column_name || ' ' || data_type || 
        CASE 
            WHEN character_maximum_length IS NOT NULL THEN '(' || character_maximum_length || ')'
            WHEN numeric_precision IS NOT NULL THEN '(' || numeric_precision || ',' || numeric_scale || ')'
            ELSE ''
        END ||
        CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
        CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END,
        ', '
    ) || ');'
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public'
    AND table_name LIKE 'map_%'
GROUP BY 
    schemaname, tablename;

-- Export foreign keys for map tables
SELECT
    'ALTER TABLE ' || tc.table_schema || '.' || tc.table_name || 
    ' ADD CONSTRAINT ' || tc.constraint_name || 
    ' FOREIGN KEY (' || string_agg(kcu.column_name, ', ') || 
    ') REFERENCES ' || ccu.table_schema || '.' || ccu.table_name || 
    ' (' || string_agg(ccu.column_name, ', ') || ');'
FROM 
    information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE 
    tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name LIKE 'map_%'
GROUP BY 
    tc.table_schema,
    tc.table_name,
    tc.constraint_name,
    ccu.table_schema,
    ccu.table_name;

-- Export indexes for map tables
SELECT
    'CREATE INDEX ' || indexname || ' ON ' || schemaname || '.' || tablename || ' USING ' || indexdef || ';'
FROM
    pg_indexes
WHERE
    schemaname = 'public'
    AND tablename LIKE 'map_%';

-- Export views related to maps
SELECT
    'CREATE OR REPLACE VIEW ' || schemaname || '.' || viewname || ' AS ' || 
    definition
FROM
    pg_views
WHERE
    schemaname = 'public'
    AND (viewname LIKE 'map_%' OR viewname LIKE 'maps_%');
