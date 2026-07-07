-- The "Service role full access" policy had no TO clause, so it matched ALL
-- authenticated users and let them see hidden rolls (RLS policies are OR'd).
-- The service role bypasses RLS automatically — no policy needed.
DROP POLICY IF EXISTS "Service role full access" ON dice_rolls;
