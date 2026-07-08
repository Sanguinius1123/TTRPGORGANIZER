ALTER TABLE npcs ADD COLUMN IF NOT EXISTS gm_notes text;
ALTER TABLE factions ADD COLUMN IF NOT EXISTS gm_notes text;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS gm_notes text;
ALTER TABLE lore_entries ADD COLUMN IF NOT EXISTS gm_notes text;
ALTER TABLE plot_threads ADD COLUMN IF NOT EXISTS gm_notes text;
ALTER TABLE species ADD COLUMN IF NOT EXISTS gm_notes text;
ALTER TABLE cultures ADD COLUMN IF NOT EXISTS gm_notes text;
ALTER TABLE player_characters ADD COLUMN IF NOT EXISTS gm_notes text;
