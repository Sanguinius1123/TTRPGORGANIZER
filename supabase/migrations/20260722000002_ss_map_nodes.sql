-- S&S map: strip Road tags from river nodes, add scatter of new locations
-- 2026-07-22

-- ═══ Strip Road from any River / Lake node in the campaign ═════════════════
-- Rivers don't have roads — boat travel is its own modifier (Dock on settlements)

UPDATE locations
SET path_modifiers = array_remove(path_modifiers, 'Road')
WHERE terrain = 'River / Lake'
  AND 'Road' = ANY(path_modifiers)
  AND campaign_id = '00000000-5573-4000-8000-000000000001';

-- ═══ NEW LOCATIONS ══════════════════════════════════════════════════════════
-- UUIDs use prefix dd000001-5573-4000-8000-0000000000XX

INSERT INTO locations
  (id, name, type, terrain, path_modifiers, map_x, map_y, visible, waypoint, campaign_id)
VALUES

  -- ─── Far North ───────────────────────────────────────────────────────────

  -- Mountain Pass waypoint: above the northernmost river node (cd125b4e at 911,351)
  -- The river narrows to a gorge here; travellers on foot use the pass
  ('dd000001-5573-4000-8000-000000000001',
   null, null, 'Mountain', ARRAY[]::text[],
   878, 235, false, true,
   '00000000-5573-4000-8000-000000000001'),

  -- Mountain Waystation: a rough shelter used by traders crossing the pass
  ('dd000001-5573-4000-8000-000000000002',
   'Mountain Waystation', 'Settlement', 'Mountain', ARRAY['Trail / Path'],
   822, 148, false, false,
   '00000000-5573-4000-8000-000000000001'),

  -- ─── North / NW ──────────────────────────────────────────────────────────

  -- Forest Shrine: off the river near River Confluence, deep in the old-growth
  ('dd000001-5573-4000-8000-000000000003',
   'Forest Shrine', 'POI', 'Forest', ARRAY[]::text[],
   808, 555, false, false,
   '00000000-5573-4000-8000-000000000001'),

  -- ─── West road / hill country ────────────────────────────────────────────

  -- Overgrown Watchtower: a crumbling lookout in the wooded hills, N of the west road
  ('dd000001-5573-4000-8000-000000000004',
   'Overgrown Watchtower', 'Ruin', 'Plains', ARRAY[]::text[],
   542, 892, false, false,
   '00000000-5573-4000-8000-000000000001'),

  -- Abandoned Mine: in the rocky hills between the dark forest and the west road
  ('dd000001-5573-4000-8000-000000000005',
   'Abandoned Mine', 'Ruin', 'Mountain', ARRAY[]::text[],
   488, 875, false, false,
   '00000000-5573-4000-8000-000000000001'),

  -- ─── East / March ────────────────────────────────────────────────────────

  -- Ruined Keep: a fallen border stronghold east of the March Outpost, reclaimed by weeds
  ('dd000001-5573-4000-8000-000000000006',
   'Ruined Keep', 'Ruin', 'Plains', ARRAY[]::text[],
   1558, 942, false, false,
   '00000000-5573-4000-8000-000000000001'),

  -- ─── River crossing ──────────────────────────────────────────────────────

  -- River Crossing: a shallow ford/bridge waypoint connecting the south road
  -- (east side) to the river spine (west side)
  ('dd000001-5573-4000-8000-000000000007',
   null, null, 'River / Lake', ARRAY['Bridge'],
   1000, 1372, false, true,
   '00000000-5573-4000-8000-000000000001'),

  -- ─── South / Coastal ─────────────────────────────────────────────────────

  -- Sunken Ruins: partially submerged old-world structures visible from the river
  ('dd000001-5573-4000-8000-000000000008',
   'Sunken Ruins', 'Ruin', 'River / Lake', ARRAY[]::text[],
   902, 1498, false, false,
   '00000000-5573-4000-8000-000000000001'),

  -- Fishing Village: small settlement west of Coastal City along the coast
  ('dd000001-5573-4000-8000-000000000009',
   'Fishing Village', 'Settlement', 'Coastal', ARRAY['Dock'],
   805, 1942, false, false,
   '00000000-5573-4000-8000-000000000001'),

  -- ─── Inland sea coast hints ───────────────────────────────────────────────

  -- Coastal Waypoint W: west of Coastal City, marks the start of the sea coast
  ('dd000001-5573-4000-8000-000000000010',
   null, null, 'Coastal', ARRAY[]::text[],
   862, 1930, false, true,
   '00000000-5573-4000-8000-000000000001'),

  -- Marsh Hamlet: a small community of trappers and herbalists living on the marsh edge
  ('dd000001-5573-4000-8000-000000000011',
   'Marsh Hamlet', 'Settlement', 'Swamp / Wetland', ARRAY[]::text[],
   1722, 448, false, false,
   '00000000-5573-4000-8000-000000000001');

-- ═══ CONNECTIONS ════════════════════════════════════════════════════════════

INSERT INTO location_connections
  (from_location_id, to_location_id, bidirectional, travel_time_manual)
VALUES

  -- Mountain pass chain (from northernmost river node upward)
  ('cd125b4e-f19e-46a3-8a4b-2a694e988e66', 'dd000001-5573-4000-8000-000000000001', true, false),
  ('dd000001-5573-4000-8000-000000000001', 'dd000001-5573-4000-8000-000000000002', true, false),

  -- Forest Shrine: short detour from the river near River Confluence
  ('aa000001-5573-4000-8000-000000000008', 'dd000001-5573-4000-8000-000000000003', true, false),

  -- Overgrown Watchtower: side branch off west road W3 (648, 932)
  ('bb000001-5573-4000-8000-000000000013', 'dd000001-5573-4000-8000-000000000004', true, false),

  -- Abandoned Mine: off the rough forest section W4 (536, 958)
  ('bb000001-5573-4000-8000-000000000014', 'dd000001-5573-4000-8000-000000000005', true, false),

  -- Ruined Keep: side branch off NE road WP1 (1555, 842)
  ('cc000001-5573-4000-8000-000000000009', 'dd000001-5573-4000-8000-000000000006', true, false),

  -- River Crossing: connects south road S3 (1112,1358) to river S2 (879,1388)
  ('bb000001-5573-4000-8000-000000000003', 'dd000001-5573-4000-8000-000000000007', true, false),
  ('dd000001-5573-4000-8000-000000000007', 'aa000001-5573-4000-8000-000000000009', true, false),

  -- Sunken Ruins: accessible from river between S2 and S3
  ('aa000001-5573-4000-8000-000000000009', 'dd000001-5573-4000-8000-000000000008', true, false),
  ('dd000001-5573-4000-8000-000000000008', 'c89bda65-199e-4413-a5e5-ad5f2d92bf4b', true, false),

  -- Fishing Village: coastal WP west → Fishing Village
  ('dd000001-5573-4000-8000-000000000010', 'dd000001-5573-4000-8000-000000000009', true, false),
  -- Coastal WP west connects to Coastal City (163ce671 is close to city)
  ('bb000001-5573-4000-8000-000000000008', 'dd000001-5573-4000-8000-000000000010', true, false),

  -- Marsh Hamlet: beyond Marsh Fringe into the wetlands
  ('cc000001-5573-4000-8000-000000000005', 'dd000001-5573-4000-8000-000000000011', true, false);
