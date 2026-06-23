CREATE TABLE IF NOT EXISTS lore_locations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lore_id     uuid NOT NULL REFERENCES lore_entries(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  notes       text,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(lore_id, location_id)
);
