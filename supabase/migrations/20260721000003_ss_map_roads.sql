-- Expand S&S home-base map: south road to coastal city, west road to distant settlement
-- All new nodes use the S&S campaign: 00000000-5573-4000-8000-000000000001
-- distance_scale=20, travel_unit=hours — 100px road node ≈ 3 hours, 8-hour day ≈ 2-3 nodes
--
-- SOUTH ROAD: follows the river south to the coastal city at river mouth (~3 days / 24 hrs)
-- Road nodes slightly east of the river spine; terrain=Plains+Road so river waypoints stay distinct
-- Nodes visible near hub; undiscovered nodes hidden until reached
--
-- WEST ROAD: winds through rolling hills, forested patches, open plains (~3 days / 24 hrs)
-- Dangerous road — ambush territory. The road exists; the safety does not.
-- Terrain varies: Plains → Forest → Plains to show the winding route

INSERT INTO locations
  (id, name, type, terrain, path_modifiers, map_x, map_y, visible, waypoint, campaign_id)
VALUES

  -- ─── SOUTH ROAD ──────────────────────────────────────────────────────────────

  -- WP S1: just south of town, river-adjacent road (visible — players know the road heads south)
  ('bb000001-5573-4000-8000-000000000001',
   null, null, 'Plains', ARRAY['Road'],
   1042, 1095, true, true,
   '00000000-5573-4000-8000-000000000001'),

  -- WP S2
  ('bb000001-5573-4000-8000-000000000002',
   null, null, 'Plains', ARRAY['Road'],
   1044, 1195, true, true,
   '00000000-5573-4000-8000-000000000001'),

  -- WP S3 (visible — players likely know the road heads south a day or two)
  ('bb000001-5573-4000-8000-000000000003',
   null, null, 'Plains', ARRAY['Road'],
   1046, 1295, true, true,
   '00000000-5573-4000-8000-000000000001'),

  -- WP S4 (hidden from here south — undiscovered territory)
  ('bb000001-5573-4000-8000-000000000004',
   null, null, 'Plains', ARRAY['Road'],
   1048, 1395, false, true,
   '00000000-5573-4000-8000-000000000001'),

  -- WP S5
  ('bb000001-5573-4000-8000-000000000005',
   null, null, 'Coastal', ARRAY['Road'],
   1050, 1495, false, true,
   '00000000-5573-4000-8000-000000000001'),

  -- WP S6
  ('bb000001-5573-4000-8000-000000000006',
   null, null, 'Coastal', ARRAY['Road'],
   1052, 1595, false, true,
   '00000000-5573-4000-8000-000000000001'),

  -- WP S7 (approaching the coast)
  ('bb000001-5573-4000-8000-000000000007',
   null, null, 'Coastal', ARRAY['Road'],
   1054, 1695, false, true,
   '00000000-5573-4000-8000-000000000001'),

  -- Coastal City: at the river mouth. Known as a destination even if unvisited.
  ('bb000001-5573-4000-8000-000000000008',
   'Coastal City', 'Settlement', 'Coastal', ARRAY['Road'],
   1056, 1795, true, false,
   '00000000-5573-4000-8000-000000000001'),

  -- ─── WEST ROAD ───────────────────────────────────────────────────────────────
  -- Road winds northwest through varying terrain. Visible for a couple nodes (it's a known road);
  -- hidden beyond that — the danger starts where people stop talking about it.

  -- WP W1: just west of town (visible — the road west is known)
  ('bb000001-5573-4000-8000-000000000011',
   null, null, 'Plains', ARRAY['Road'],
   892, 1000, true, true,
   '00000000-5573-4000-8000-000000000001'),

  -- WP W2: still near town, rolling open plains
  ('bb000001-5573-4000-8000-000000000012',
   null, null, 'Plains', ARRAY['Road'],
   786, 985, true, true,
   '00000000-5573-4000-8000-000000000001'),

  -- WP W3: entering hillier, more wooded country (hidden — beyond safe knowledge)
  ('bb000001-5573-4000-8000-000000000013',
   null, null, 'Plains', ARRAY['Road'],
   682, 975, false, true,
   '00000000-5573-4000-8000-000000000001'),

  -- WP W4: forested section — where the ambushes happen
  ('bb000001-5573-4000-8000-000000000014',
   null, null, 'Forest', ARRAY['Road'],
   580, 962, false, true,
   '00000000-5573-4000-8000-000000000001'),

  -- WP W5: deeper forest
  ('bb000001-5573-4000-8000-000000000015',
   null, null, 'Forest', ARRAY['Road'],
   480, 967, false, true,
   '00000000-5573-4000-8000-000000000001'),

  -- WP W6: road emerges into open plains/hills again
  ('bb000001-5573-4000-8000-000000000016',
   null, null, 'Plains', ARRAY['Road'],
   385, 980, false, true,
   '00000000-5573-4000-8000-000000000001'),

  -- WP W7: final stretch before the settlement
  ('bb000001-5573-4000-8000-000000000017',
   null, null, 'Plains', ARRAY['Road'],
   290, 998, false, true,
   '00000000-5573-4000-8000-000000000001'),

  -- Western Settlement: known to exist but nobody talks much about the road to get there
  ('bb000001-5573-4000-8000-000000000018',
   'Western Settlement', 'Settlement', 'Plains', ARRAY['Road'],
   195, 1010, true, false,
   '00000000-5573-4000-8000-000000000001');

-- ─── CONNECTIONS ─────────────────────────────────────────────────────────────

INSERT INTO location_connections
  (from_location_id, to_location_id, bidirectional, travel_time_manual)
VALUES
  -- South road chain: Home Base → S1 → S2 → ... → Coastal City
  ('aa000001-5573-4000-8000-000000000001', 'bb000001-5573-4000-8000-000000000001', true, false),
  ('bb000001-5573-4000-8000-000000000001', 'bb000001-5573-4000-8000-000000000002', true, false),
  ('bb000001-5573-4000-8000-000000000002', 'bb000001-5573-4000-8000-000000000003', true, false),
  ('bb000001-5573-4000-8000-000000000003', 'bb000001-5573-4000-8000-000000000004', true, false),
  ('bb000001-5573-4000-8000-000000000004', 'bb000001-5573-4000-8000-000000000005', true, false),
  ('bb000001-5573-4000-8000-000000000005', 'bb000001-5573-4000-8000-000000000006', true, false),
  ('bb000001-5573-4000-8000-000000000006', 'bb000001-5573-4000-8000-000000000007', true, false),
  ('bb000001-5573-4000-8000-000000000007', 'bb000001-5573-4000-8000-000000000008', true, false),

  -- West road chain: Home Base → W1 → W2 → ... → Western Settlement
  ('aa000001-5573-4000-8000-000000000001', 'bb000001-5573-4000-8000-000000000011', true, false),
  ('bb000001-5573-4000-8000-000000000011', 'bb000001-5573-4000-8000-000000000012', true, false),
  ('bb000001-5573-4000-8000-000000000012', 'bb000001-5573-4000-8000-000000000013', true, false),
  ('bb000001-5573-4000-8000-000000000013', 'bb000001-5573-4000-8000-000000000014', true, false),
  ('bb000001-5573-4000-8000-000000000014', 'bb000001-5573-4000-8000-000000000015', true, false),
  ('bb000001-5573-4000-8000-000000000015', 'bb000001-5573-4000-8000-000000000016', true, false),
  ('bb000001-5573-4000-8000-000000000016', 'bb000001-5573-4000-8000-000000000017', true, false),
  ('bb000001-5573-4000-8000-000000000017', 'bb000001-5573-4000-8000-000000000018', true, false);
