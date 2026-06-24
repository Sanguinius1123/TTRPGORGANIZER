-- Allow mystery locations through RLS so they appear on the player map as "???".
-- The app already filters mystery=true out of the list/detail pages at query level.
DROP POLICY IF EXISTS "Players can view visible locations" ON locations;

CREATE POLICY "Players can view visible locations"
  ON locations FOR SELECT
  USING (visible = true OR waypoint = true);
