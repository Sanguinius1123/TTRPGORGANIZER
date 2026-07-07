-- Add hidden flag to dice_rolls for secret GM rolls and private player rolls
ALTER TABLE dice_rolls ADD COLUMN hidden boolean NOT NULL DEFAULT false;

-- Update RLS: players can only see non-hidden rolls
DROP POLICY IF EXISTS "Players read campaign rolls" ON dice_rolls;
CREATE POLICY "Players read campaign rolls" ON dice_rolls
  FOR SELECT USING (hidden = false);
