-- Waypoints on the locations table
ALTER TABLE locations ALTER COLUMN name DROP NOT NULL;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS waypoint BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS terrain TEXT;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS path_modifiers TEXT[] NOT NULL DEFAULT '{}';

-- Map type rules — one row per parent location type; NULL parent_type = root map
CREATE TABLE IF NOT EXISTS map_type_rules (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_type    TEXT UNIQUE,
  child_types    TEXT[] NOT NULL DEFAULT '{}',
  color          TEXT NOT NULL DEFAULT '#64748b',
  travel_unit    TEXT NOT NULL DEFAULT 'units',
  distance_scale NUMERIC NOT NULL DEFAULT 100,
  created_at     timestamptz DEFAULT now()
);

-- Connection travel time: manual flag
ALTER TABLE location_connections ADD COLUMN IF NOT EXISTS travel_time_manual BOOLEAN NOT NULL DEFAULT FALSE;
