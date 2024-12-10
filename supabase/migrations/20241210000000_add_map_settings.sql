-- Add settings column to maps table with a default value
ALTER TABLE maps ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{
  "style": {
    "id": "standard",
    "markerStyle": "pins",
    "popupStyle": {
      "background": "#FFFFFF",
      "text": "#1D3640",
      "border": "#E2E8F0",
      "shadow": "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
    }
  },
  "features": {
    "enableClustering": false,
    "enableFullscreen": true,
    "enableSharing": true,
    "enableSearch": false
  },
  "customization": {
    "markerColor": "#E9B893",
    "clusterColor": "#F99D7C",
    "fontFamily": "Inter"
  }
}';

-- Create an index for faster queries on settings
CREATE INDEX IF NOT EXISTS idx_maps_settings ON maps USING GIN (settings);

-- Update existing rows with default settings if they are null
UPDATE maps 
SET settings = '{
  "style": {
    "id": "standard",
    "markerStyle": "pins",
    "popupStyle": {
      "background": "#FFFFFF",
      "text": "#1D3640",
      "border": "#E2E8F0",
      "shadow": "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
    }
  },
  "features": {
    "enableClustering": false,
    "enableFullscreen": true,
    "enableSharing": true,
    "enableSearch": false
  },
  "customization": {
    "markerColor": "#E9B893",
    "clusterColor": "#F99D7C",
    "fontFamily": "Inter"
  }
}'::jsonb
WHERE settings IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN maps.settings IS 'JSON object containing map style and feature settings';

-- Create a function to validate settings JSON
CREATE OR REPLACE FUNCTION validate_map_settings()
RETURNS trigger AS $$
BEGIN
  -- Ensure required top-level keys exist
  IF NOT (NEW.settings ? 'style' AND 
          NEW.settings ? 'features' AND 
          NEW.settings ? 'customization') THEN
    RAISE EXCEPTION 'Invalid settings structure: missing required top-level keys';
  END IF;

  -- Ensure required style keys exist
  IF NOT (NEW.settings->'style' ? 'id' AND 
          NEW.settings->'style' ? 'markerStyle' AND 
          NEW.settings->'style' ? 'popupStyle') THEN
    RAISE EXCEPTION 'Invalid style settings: missing required keys';
  END IF;

  -- Validate markerStyle enum
  IF NOT (NEW.settings->'style'->>'markerStyle' IN ('pins', 'photos', 'custom')) THEN
    RAISE EXCEPTION 'Invalid markerStyle: must be pins, photos, or custom';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate settings before insert or update
DROP TRIGGER IF EXISTS validate_map_settings_trigger ON maps;
CREATE TRIGGER validate_map_settings_trigger
  BEFORE INSERT OR UPDATE ON maps
  FOR EACH ROW
  EXECUTE FUNCTION validate_map_settings();
