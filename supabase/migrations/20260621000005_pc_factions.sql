CREATE TABLE pc_factions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pc_id       UUID NOT NULL REFERENCES player_characters(id) ON DELETE CASCADE,
  faction_id  UUID NOT NULL REFERENCES factions(id)          ON DELETE CASCADE,
  role        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
