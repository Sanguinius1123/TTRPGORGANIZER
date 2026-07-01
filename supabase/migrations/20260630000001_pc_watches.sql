CREATE TABLE pc_watches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pc_id uuid NOT NULL REFERENCES player_characters(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('npc', 'faction', 'location', 'lore')),
  entity_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(pc_id, entity_type, entity_id)
);

ALTER TABLE pc_watches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players manage own watches" ON pc_watches
  FOR ALL USING (
    pc_id IN (SELECT id FROM player_characters WHERE profile_id = auth.uid())
  );
