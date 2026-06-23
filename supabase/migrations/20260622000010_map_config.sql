-- Per-map-level config (travel unit, distance scale, map scale)
CREATE TABLE IF NOT EXISTS map_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES locations(id) ON DELETE CASCADE,
  map_scale text,           -- 'galaxy' | 'system' | 'body' | 'place'
  travel_unit text,
  distance_scale float NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- At most one root config (location_id IS NULL) and one per location
CREATE UNIQUE INDEX map_configs_location_unique ON map_configs (location_id) WHERE location_id IS NOT NULL;
CREATE UNIQUE INDEX map_configs_root_unique ON map_configs ((1)) WHERE location_id IS NULL;

-- Whether a location has a navigable sub-map
ALTER TABLE locations ADD COLUMN IF NOT EXISTS has_submap boolean NOT NULL DEFAULT false;
