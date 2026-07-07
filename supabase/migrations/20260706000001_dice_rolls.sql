CREATE TABLE dice_rolls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  session_id uuid REFERENCES sessions(id) ON DELETE SET NULL,
  rolled_by_pc_id uuid REFERENCES player_characters(id) ON DELETE SET NULL,
  rolled_by_name text NOT NULL,
  dice_notation text NOT NULL,
  individual_rolls int[] NOT NULL,
  total integer NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE dice_rolls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON dice_rolls
  USING (true) WITH CHECK (true);

CREATE POLICY "Players read campaign rolls" ON dice_rolls
  FOR SELECT USING (true);

CREATE POLICY "Players insert own rolls" ON dice_rolls
  FOR INSERT WITH CHECK (
    rolled_by_pc_id IN (
      SELECT id FROM player_characters WHERE profile_id = auth.uid()
    )
  );
