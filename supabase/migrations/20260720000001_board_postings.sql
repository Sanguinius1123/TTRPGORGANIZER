CREATE TABLE board_postings (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id          uuid        NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  title                text        NOT NULL,
  description          text,
  gm_notes             text,
  board_label          text,
  origin_location_id   uuid        REFERENCES locations(id) ON DELETE SET NULL,
  posted_by_npc_id     uuid        REFERENCES npcs(id) ON DELETE SET NULL,
  posted_by_faction_id uuid        REFERENCES factions(id) ON DELETE SET NULL,
  posted_by_name       text,
  status               text        NOT NULL DEFAULT 'open',
  difficulty           text        NOT NULL DEFAULT 'unknown',
  reward               text,
  deadline             text,
  visible              bool        NOT NULL DEFAULT true,
  created_by_pc_id     uuid        REFERENCES player_characters(id) ON DELETE SET NULL,
  hidden_goal          bool        NOT NULL DEFAULT false,
  party_notes          text,
  sort_order           float8      NOT NULL DEFAULT 0,
  active_section       text,
  resolution_notes     text,
  resolved_at          timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX board_postings_campaign_idx ON board_postings(campaign_id);
CREATE INDEX board_postings_status_idx   ON board_postings(campaign_id, status);

-- RLS
ALTER TABLE board_postings ENABLE ROW LEVEL SECURITY;

-- Service role (GM pages) bypasses RLS — no policy needed
-- Players: can read visible postings, or ones they created, or active/archived ones (not open-hidden ones)
CREATE POLICY "players can read board postings"
  ON board_postings FOR SELECT
  TO authenticated
  USING (
    -- visible postings that are open or active/archived (not GM-hidden open ones)
    (visible = true)
    OR
    -- player can always see postings they created
    (created_by_pc_id IN (
      SELECT id FROM player_characters WHERE profile_id = auth.uid()
    ))
  );

-- Players can insert their own postings (player-created goals)
CREATE POLICY "players can create own postings"
  ON board_postings FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by_pc_id IN (
      SELECT id FROM player_characters WHERE profile_id = auth.uid()
    )
  );

-- Players can update party_notes, sort_order, active_section, hidden_goal, status on postings they can see
-- (we keep it permissive here; app logic enforces what players can actually change)
CREATE POLICY "players can update board postings"
  ON board_postings FOR UPDATE
  TO authenticated
  USING (
    visible = true
    OR created_by_pc_id IN (
      SELECT id FROM player_characters WHERE profile_id = auth.uid()
    )
  );
