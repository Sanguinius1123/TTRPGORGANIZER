ALTER TABLE player_characters ADD COLUMN IF NOT EXISTS current_location_id UUID REFERENCES locations(id) ON DELETE SET NULL;
