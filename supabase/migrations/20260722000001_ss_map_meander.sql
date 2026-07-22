-- S&S map overhaul: natural meander + major settlements + off-road nodes
-- 2026-07-22
--
-- 1. Reposition all seeded road/river nodes so routes curve rather than
--    run dead cardinal. Home Base stays at (998, 999).
-- 2. Add 3 new major settlements:
--      River Confluence  (N,  river junction north of home base)
--      Northmarch        (NE, frontier post before the swamp)
--      Eastern Coast Town(SE, trading port east along inland sea coast)
-- 3. Add cross-path trail linking east road → south road (first web link)
-- 4. Add off-road terrain nodes: Forest Ruin, Marsh Fringe, Abandoned Village

-- ═══ RIVER: north branch (flows from NW mountains) ════════════════════════
-- River comes in from the NW, not dead-north

UPDATE locations SET map_x=905, map_y=750
  WHERE id='aa000001-5573-4000-8000-000000000006';  -- River N1

UPDATE locations SET map_x=845, map_y=520
  WHERE id='aa000001-5573-4000-8000-000000000008';  -- River N2 (further upstream)

UPDATE locations SET map_x=682, map_y=435
  WHERE id='aa000001-5573-4000-8000-000000000010';  -- NW tributary (dark forest)

-- ═══ RIVER: south branch (meanders west through plains) ════════════════════

UPDATE locations SET map_x=930, map_y=1220
  WHERE id='aa000001-5573-4000-8000-000000000007';  -- River S1 (drifts W of road)

UPDATE locations SET map_x=872, map_y=1390
  WHERE id='aa000001-5573-4000-8000-000000000009';  -- River S2 (bends further W)

UPDATE locations SET map_x=905, map_y=1568
  WHERE id='c89bda65-199e-4413-a5e5-ad5f2d92bf4b';  -- River S3 (swings back E toward sea)

-- ═══ COASTAL CITY + nearby coast ═══════════════════════════════════════════
-- Push the city further south so the inland sea has room

UPDATE locations SET map_x=1058, map_y=1875
  WHERE id='bb000001-5573-4000-8000-000000000008';  -- Coastal City

UPDATE locations SET map_x=955,  map_y=1898
  WHERE id='163ce671-f4c7-4665-9997-cbcc88422e0d';  -- coastal WP west

UPDATE locations SET map_x=1188, map_y=1882
  WHERE id='dd832425-3d74-4c5c-8780-674fa68bc33e';  -- coastal WP east

-- ═══ SOUTH ROAD ════════════════════════════════════════════════════════════
-- Road runs east of the river (visual separation), curves gently east then back

UPDATE locations SET map_x=1062, map_y=1115
  WHERE id='bb000001-5573-4000-8000-000000000001';  -- S1

UPDATE locations SET map_x=1088, map_y=1238
  WHERE id='bb000001-5573-4000-8000-000000000002';  -- S2

UPDATE locations SET map_x=1112, map_y=1358
  WHERE id='bb000001-5573-4000-8000-000000000003';  -- S3

UPDATE locations SET map_x=1098, map_y=1462
  WHERE id='bb000001-5573-4000-8000-000000000004';  -- S4

UPDATE locations SET map_x=1080, map_y=1572
  WHERE id='bb000001-5573-4000-8000-000000000005';  -- S5

UPDATE locations SET map_x=1068, map_y=1678
  WHERE id='bb000001-5573-4000-8000-000000000006';  -- S6

UPDATE locations SET map_x=1062, map_y=1778
  WHERE id='bb000001-5573-4000-8000-000000000007';  -- S7 (approaches coastal city)

-- ═══ WEST ROAD ═════════════════════════════════════════════════════════════
-- Road arcs NW (skirts a low boggy area), through wooded hills, then out W

UPDATE locations SET map_x=878,  map_y=975
  WHERE id='bb000001-5573-4000-8000-000000000011';  -- W1

UPDATE locations SET map_x=762,  map_y=948
  WHERE id='bb000001-5573-4000-8000-000000000012';  -- W2

UPDATE locations SET map_x=648,  map_y=932
  WHERE id='bb000001-5573-4000-8000-000000000013';  -- W3 (entering wooded hills)

UPDATE locations SET map_x=536,  map_y=958
  WHERE id='bb000001-5573-4000-8000-000000000014';  -- W4 (dense forest, rough — no Road)

UPDATE locations SET map_x=432,  map_y=978
  WHERE id='bb000001-5573-4000-8000-000000000015';  -- W5 (road re-emerges)

UPDATE locations SET map_x=330,  map_y=995
  WHERE id='bb000001-5573-4000-8000-000000000016';  -- W6 (plains open up)

UPDATE locations SET map_x=238,  map_y=1005
  WHERE id='bb000001-5573-4000-8000-000000000017';  -- W7

UPDATE locations SET map_x=145,  map_y=1012
  WHERE id='bb000001-5573-4000-8000-000000000018';  -- Western Settlement

-- ═══ EAST ROAD ═════════════════════════════════════════════════════════════
-- Road angles NNE (the March sits on higher ground north-east of town)

UPDATE locations SET map_x=1128, map_y=978
  WHERE id='aa000001-5573-4000-8000-000000000004';  -- E WP1

UPDATE locations SET map_x=1252, map_y=955
  WHERE id='aa000001-5573-4000-8000-000000000002';  -- Eastern Farmsteads

UPDATE locations SET map_x=1368, map_y=930
  WHERE id='aa000001-5573-4000-8000-000000000005';  -- E WP2

UPDATE locations SET map_x=1488, map_y=905
  WHERE id='aa000001-5573-4000-8000-000000000003';  -- March Outpost

-- ═══════════════════════════════════════════════════════════════════════════
-- NEW NODES
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO locations
  (id, name, type, terrain, path_modifiers, map_x, map_y, visible, waypoint, campaign_id)
VALUES

  -- ─── Major Settlements ─────────────────────────────────────────────────

  -- River Confluence: settlement where a western stream meets the main river.
  -- Sits between the two northern river nodes; river-access only (no road in yet).
  ('cc000001-5573-4000-8000-000000000001',
   'River Confluence', 'Settlement', 'Urban', ARRAY['Dock'],
   788, 672, false, false,
   '00000000-5573-4000-8000-000000000001'),

  -- Northmarch: last real settlement before the NE swamp. Frontier trading post.
  ('cc000001-5573-4000-8000-000000000002',
   'Northmarch', 'Settlement', 'Plains', ARRAY['Road'],
   1622, 678, false, false,
   '00000000-5573-4000-8000-000000000001'),

  -- Eastern Coast Town: trading port east along the inland sea coast.
  ('cc000001-5573-4000-8000-000000000003',
   'Eastern Coast Town', 'Settlement', 'Coastal', ARRAY['Road', 'Dock'],
   1382, 1968, false, false,
   '00000000-5573-4000-8000-000000000001'),

  -- ─── Waypoints: NE road from March Outpost to Northmarch ───────────────

  ('cc000001-5573-4000-8000-000000000009',
   null, null, 'Plains', ARRAY['Road'],
   1555, 842, false, true,
   '00000000-5573-4000-8000-000000000001'),

  ('cc000001-5573-4000-8000-000000000010',
   null, null, 'Plains', ARRAY['Road'],
   1598, 768, false, true,
   '00000000-5573-4000-8000-000000000001'),

  -- ─── Waypoints: coastal road east from Coastal City ────────────────────

  ('cc000001-5573-4000-8000-000000000011',
   null, null, 'Coastal', ARRAY['Road'],
   1188, 1912, false, true,
   '00000000-5573-4000-8000-000000000001'),

  ('cc000001-5573-4000-8000-000000000012',
   null, null, 'Coastal', ARRAY['Road'],
   1295, 1942, false, true,
   '00000000-5573-4000-8000-000000000001'),

  -- ─── Cross-path: east road → south road (first diagonal web link) ──────
  -- Former trade road through the plains east of the river, now an overgrown trail

  ('cc000001-5573-4000-8000-000000000007',
   null, null, 'Plains', ARRAY['Trail / Path'],
   1272, 1148, false, true,
   '00000000-5573-4000-8000-000000000001'),

  ('cc000001-5573-4000-8000-000000000008',
   null, null, 'Plains', ARRAY['Trail / Path'],
   1268, 1358, false, true,
   '00000000-5573-4000-8000-000000000001'),

  -- ─── Off-road terrain nodes ────────────────────────────────────────────

  -- Forest Ruin: deep in the NW dark forest, off the tributary. Hard to reach.
  ('cc000001-5573-4000-8000-000000000004',
   'Forest Ruin', 'Ruin', 'Forest', ARRAY[]::text[],
   578, 388, false, false,
   '00000000-5573-4000-8000-000000000001'),

  -- Forest WP leading from the tributary toward the ruin
  ('cc000001-5573-4000-8000-000000000013',
   null, null, 'Forest', ARRAY[]::text[],
   630, 408, false, true,
   '00000000-5573-4000-8000-000000000001'),

  -- Marsh Fringe: entrance to the NE swamplands. Beyond Northmarch = danger.
  ('cc000001-5573-4000-8000-000000000005',
   'Marsh Fringe', 'Wilderness', 'Swamp / Wetland', ARRAY[]::text[],
   1692, 568, false, false,
   '00000000-5573-4000-8000-000000000001'),

  -- Abandoned Village: pre-March settlement, raided and left empty.
  -- Sits west of the river, south of home base — an off-road detour from the river path.
  ('cc000001-5573-4000-8000-000000000006',
   'Abandoned Village', 'Ruin', 'Plains', ARRAY[]::text[],
   820, 1238, false, false,
   '00000000-5573-4000-8000-000000000001');

-- ═══ CONNECTIONS: new nodes ════════════════════════════════════════════════

INSERT INTO location_connections
  (from_location_id, to_location_id, bidirectional, travel_time_manual)
VALUES

  -- River Confluence sits between the two northern river nodes
  ('cc000001-5573-4000-8000-000000000001', 'aa000001-5573-4000-8000-000000000006', true, false),
  ('cc000001-5573-4000-8000-000000000001', 'aa000001-5573-4000-8000-000000000008', true, false),

  -- NE road: March Outpost → WP1 → WP2 → Northmarch → Marsh Fringe
  ('aa000001-5573-4000-8000-000000000003', 'cc000001-5573-4000-8000-000000000009', true, false),
  ('cc000001-5573-4000-8000-000000000009', 'cc000001-5573-4000-8000-000000000010', true, false),
  ('cc000001-5573-4000-8000-000000000010', 'cc000001-5573-4000-8000-000000000002', true, false),
  ('cc000001-5573-4000-8000-000000000002', 'cc000001-5573-4000-8000-000000000005', true, false),

  -- Coastal road east: Coastal City → E1 → E2 → Eastern Coast Town
  ('bb000001-5573-4000-8000-000000000008', 'cc000001-5573-4000-8000-000000000011', true, false),
  ('cc000001-5573-4000-8000-000000000011', 'cc000001-5573-4000-8000-000000000012', true, false),
  ('cc000001-5573-4000-8000-000000000012', 'cc000001-5573-4000-8000-000000000003', true, false),

  -- Cross-path: Eastern Farmsteads → Cross WP1 → Cross WP2 → South Road S3 node
  ('aa000001-5573-4000-8000-000000000002', 'cc000001-5573-4000-8000-000000000007', true, false),
  ('cc000001-5573-4000-8000-000000000007', 'cc000001-5573-4000-8000-000000000008', true, false),
  ('cc000001-5573-4000-8000-000000000008', 'bb000001-5573-4000-8000-000000000003', true, false),

  -- Forest Ruin: river tributary WP (aa010) → forest WP → Forest Ruin
  ('aa000001-5573-4000-8000-000000000010', 'cc000001-5573-4000-8000-000000000013', true, false),
  ('cc000001-5573-4000-8000-000000000013', 'cc000001-5573-4000-8000-000000000004', true, false),

  -- Abandoned Village: short off-road detour from river S1 node
  ('aa000001-5573-4000-8000-000000000007', 'cc000001-5573-4000-8000-000000000006', true, false);
