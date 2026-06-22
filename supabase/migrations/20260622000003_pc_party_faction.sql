ALTER TABLE player_characters
  ADD COLUMN party_faction_id uuid REFERENCES factions(id) ON DELETE SET NULL;
