-- Add Dock path modifier to river-access settlements + clean up stray self-connections
--
-- "Dock" signals that a node has water access. calcTravelCost treats Dock nodes as
-- river-connected, so Dock <-> River/Lake triggers the 0.5x river travel bonus.
-- This fixes the Town -> first river waypoint hop getting the wrong terrain average.

-- Remove stray self-connections (created accidentally via UI)
DELETE FROM location_connections WHERE from_location_id = to_location_id;

-- Tag river-access settlements with Dock
UPDATE locations
SET path_modifiers = array_append(path_modifiers, 'Dock')
WHERE id IN (
  'aa000001-5573-4000-8000-000000000001',  -- Home Base (sits on the river)
  'bb000001-5573-4000-8000-000000000008'   -- Coastal City (river mouth, sea access)
);
