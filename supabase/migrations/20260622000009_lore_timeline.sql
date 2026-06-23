ALTER TABLE lore_entries ADD COLUMN IF NOT EXISTS major_event boolean NOT NULL DEFAULT false;
ALTER TABLE lore_entries ADD COLUMN IF NOT EXISTS event_timestamp text;
