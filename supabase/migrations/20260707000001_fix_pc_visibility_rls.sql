-- Players should always be able to see their own PC regardless of visible flag.
-- Without this, a GM setting visible=false on a PC locks the player out of their own character sheet.
DROP POLICY IF EXISTS "player_characters_select" ON player_characters;
CREATE POLICY "player_characters_select" ON player_characters
  FOR SELECT TO authenticated
  USING (visible = true OR profile_id = auth.uid());
