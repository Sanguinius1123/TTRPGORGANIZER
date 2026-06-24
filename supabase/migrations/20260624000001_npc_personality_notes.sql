ALTER TABLE npcs ADD COLUMN IF NOT EXISTS personality_notes text;
ALTER TABLE player_characters ADD COLUMN IF NOT EXISTS personality_notes text;
