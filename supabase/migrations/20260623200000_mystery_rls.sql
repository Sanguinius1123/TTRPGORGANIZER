-- Drop the existing locations_select policy which allowed players to read
-- mystery locations (visible = true AND mystery = true).
DROP POLICY IF EXISTS "locations_select" ON locations;

-- Recreate the policy excluding mystery locations so players cannot read
-- location details that the GM has flagged as mystery.
CREATE POLICY "locations_select" ON locations
  FOR SELECT TO authenticated
  USING (visible = true AND mystery = false);
