-- Species reference table
CREATE TABLE IF NOT EXISTS species (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Cultures reference table
CREATE TABLE IF NOT EXISTS cultures (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Add culture to player_characters
ALTER TABLE player_characters ADD COLUMN IF NOT EXISTS culture text;

-- Add species and culture to factions (represents primary/dominant species/culture)
ALTER TABLE factions ADD COLUMN IF NOT EXISTS species text;
ALTER TABLE factions ADD COLUMN IF NOT EXISTS culture text;
