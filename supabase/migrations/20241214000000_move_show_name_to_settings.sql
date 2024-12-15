-- Move show_name to settings.customization.showName
UPDATE maps 
SET settings = jsonb_set(
  COALESCE(settings, '{}'::jsonb),
  '{customization,showName}',
  COALESCE(
    (show_name)::text::jsonb,
    'true'::jsonb
  )
);

-- Drop show_name column
ALTER TABLE maps DROP COLUMN IF EXISTS show_name;
