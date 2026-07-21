-- Create Sword & Sorcery campaign
INSERT INTO campaigns (id, name, description)
VALUES (
  '00000000-5573-4000-8000-000000000001',
  'Sword & Sorcery',
  'A gritty world of ancient ruins, brutal politics, and dark gods. Names TBD.'
);

-- Root map config: body scale, travel unit = days, distance scale = 200
-- (200px ≈ 1 day of travel through plain terrain with no path modifiers)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM map_configs WHERE location_id IS NULL) THEN
    UPDATE map_configs
      SET map_scale = 'body', travel_unit = 'days', distance_scale = 200
      WHERE location_id IS NULL;
  ELSE
    INSERT INTO map_configs (location_id, map_scale, travel_unit, distance_scale)
    VALUES (NULL, 'body', 'days', 200);
  END IF;
END $$;

-- Home base cluster nodes
-- Named nodes: Town, Farmsteads, Outpost
-- Waypoints: road spine, river spine, NW tributary
-- Visibility: near-hub nodes visible to players; far/unexplored nodes hidden (GM only)

INSERT INTO locations
  (id, name, type, terrain, path_modifiers, map_x, map_y, visible, waypoint, campaign_id)
VALUES
  -- Named: Home base town (placeholder name — rename via UI)
  ('aa000001-5573-4000-8000-000000000001',
   'Home Base', 'Settlement', 'Urban', ARRAY['Road'],
   1000, 1000, true, false,
   '00000000-5573-4000-8000-000000000001'),

  -- Named: Eastern Farmsteads (between town and March edge)
  ('aa000001-5573-4000-8000-000000000002',
   'Eastern Farmsteads', 'Settlement', 'Plains', ARRAY['Road'],
   1220, 1000, true, false,
   '00000000-5573-4000-8000-000000000001'),

  -- Named: March Outpost / small fort at the March edge (~half day east)
  ('aa000001-5573-4000-8000-000000000003',
   'March Outpost', 'Fortification', 'Plains', ARRAY['Road'],
   1420, 1000, true, false,
   '00000000-5573-4000-8000-000000000001'),

  -- Waypoint: road between Town and Farmsteads
  ('aa000001-5573-4000-8000-000000000004',
   null, null, 'Plains', ARRAY['Road'],
   1110, 1000, true, true,
   '00000000-5573-4000-8000-000000000001'),

  -- Waypoint: road between Farmsteads and Outpost
  ('aa000001-5573-4000-8000-000000000005',
   null, null, 'Plains', ARRAY['Road'],
   1320, 1000, true, true,
   '00000000-5573-4000-8000-000000000001'),

  -- Waypoint: river just north of town (players know the river goes north)
  ('aa000001-5573-4000-8000-000000000006',
   null, null, 'River / Lake', '{}',
   985, 770, true, true,
   '00000000-5573-4000-8000-000000000001'),

  -- Waypoint: river just south of town (players know the river goes south to the port)
  ('aa000001-5573-4000-8000-000000000007',
   null, null, 'River / Lake', '{}',
   1010, 1230, true, true,
   '00000000-5573-4000-8000-000000000001'),

  -- Waypoint: river far north — upriver toward mountains (GM only, undiscovered)
  ('aa000001-5573-4000-8000-000000000008',
   null, null, 'River / Lake', '{}',
   965, 520, false, true,
   '00000000-5573-4000-8000-000000000001'),

  -- Waypoint: river far south — approaching coast and port town (GM only, undiscovered)
  ('aa000001-5573-4000-8000-000000000009',
   null, null, 'River / Lake', '{}',
   1025, 1480, false, true,
   '00000000-5573-4000-8000-000000000001'),

  -- Waypoint: NW tributary source — where a forest stream feeds the main river upriver
  -- (flows SE from dark forest; joins main river near River WP N Far)
  ('aa000001-5573-4000-8000-000000000010',
   null, null, 'Forest', '{}',
   770, 490, false, true,
   '00000000-5573-4000-8000-000000000001');

-- Connections
-- Road chain: Town → (WP) → Farmsteads → (WP) → Outpost
INSERT INTO location_connections
  (from_location_id, to_location_id, bidirectional, travel_time_manual)
VALUES
  ('aa000001-5573-4000-8000-000000000001', 'aa000001-5573-4000-8000-000000000004', true, false),
  ('aa000001-5573-4000-8000-000000000004', 'aa000001-5573-4000-8000-000000000002', true, false),
  ('aa000001-5573-4000-8000-000000000002', 'aa000001-5573-4000-8000-000000000005', true, false),
  ('aa000001-5573-4000-8000-000000000005', 'aa000001-5573-4000-8000-000000000003', true, false),

  -- River spine: north chain
  ('aa000001-5573-4000-8000-000000000001', 'aa000001-5573-4000-8000-000000000006', true, false),
  ('aa000001-5573-4000-8000-000000000006', 'aa000001-5573-4000-8000-000000000008', true, false),

  -- River spine: south chain
  ('aa000001-5573-4000-8000-000000000001', 'aa000001-5573-4000-8000-000000000007', true, false),
  ('aa000001-5573-4000-8000-000000000007', 'aa000001-5573-4000-8000-000000000009', true, false),

  -- NW tributary joins main river at the far-north waypoint
  ('aa000001-5573-4000-8000-000000000008', 'aa000001-5573-4000-8000-000000000010', true, false);
