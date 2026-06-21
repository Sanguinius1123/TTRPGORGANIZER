-- Species: add optional origin location
ALTER TABLE species
  ADD COLUMN origin_location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

-- Culture locations: cultures can exist in multiple locations
CREATE TABLE culture_locations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  culture_id  UUID NOT NULL REFERENCES cultures(id)  ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Session player notes: players can annotate sessions with their own notes
-- pc_id is nullable so a note can be left by a player without a linked PC
CREATE TABLE session_notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  pc_id       UUID REFERENCES player_characters(id) ON DELETE SET NULL,
  author_name TEXT,
  notes_text  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
