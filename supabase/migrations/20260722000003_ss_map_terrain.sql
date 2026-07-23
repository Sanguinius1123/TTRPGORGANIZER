-- S&S map: mountain range expansion + foothills + caves + deep forest + marsh + eastern frontier
-- 2026-07-22
-- UUID prefix: ee000001-5573-4000-8000-000000000XXX

INSERT INTO locations
  (id, name, type, terrain, path_modifiers, map_x, map_y, visible, waypoint, campaign_id)
VALUES

-- ═══ MOUNTAIN RANGE — West Ridge ═════════════════════════════════════════════
-- Arcs from dd001 (878,235) west, extending the northern wall toward the forest

  ('ee000001-5573-4000-8000-000000000001', null, null, 'Mountain', ARRAY[]::text[], 800, 215, false, true, '00000000-5573-4000-8000-000000000001'),
  ('ee000001-5573-4000-8000-000000000002', null, null, 'Mountain', ARRAY[]::text[], 718, 204, false, true, '00000000-5573-4000-8000-000000000001'),
  ('ee000001-5573-4000-8000-000000000003', null, null, 'Mountain', ARRAY[]::text[], 634, 236, false, true, '00000000-5573-4000-8000-000000000001'),
  -- High spur branching north from the ridge; connects down to Mountain Waystation area
  ('ee000001-5573-4000-8000-000000000004', null, null, 'Mountain', ARRAY[]::text[], 758, 144, false, true, '00000000-5573-4000-8000-000000000001'),
  -- Cave complex accessible from the high spur
  ('ee000001-5573-4000-8000-000000000005', 'Cave System', 'Wilderness', 'Underground', ARRAY[]::text[], 688, 162, false, false, '00000000-5573-4000-8000-000000000001'),

-- ═══ MOUNTAIN RANGE — East Ridge ═════════════════════════════════════════════
-- From Abandoned Mine (1055,185) arcing east, forming a barrier north of the marsh

  ('ee000001-5573-4000-8000-000000000006', null, null, 'Mountain', ARRAY[]::text[], 1148, 162, false, true, '00000000-5573-4000-8000-000000000001'),
  ('ee000001-5573-4000-8000-000000000007', null, null, 'Mountain', ARRAY[]::text[], 1255, 142, false, true, '00000000-5573-4000-8000-000000000001'),
  ('ee000001-5573-4000-8000-000000000008', null, null, 'Mountain', ARRAY[]::text[], 1382, 165, false, true, '00000000-5573-4000-8000-000000000001'),
  ('ee000001-5573-4000-8000-000000000009', null, null, 'Mountain', ARRAY[]::text[], 1490, 212, false, true, '00000000-5573-4000-8000-000000000001'),
  ('ee000001-5573-4000-8000-000000000010', null, null, 'Mountain', ARRAY[]::text[], 1558, 285, false, true, '00000000-5573-4000-8000-000000000001'),
  -- Ruined structure on the east ridge crest; visible from the march below
  ('ee000001-5573-4000-8000-000000000011', 'Peak Ruins', 'Ruin', 'Mountain', ARRAY[]::text[], 1318, 128, false, false, '00000000-5573-4000-8000-000000000001'),

-- ═══ FOOTHILLS ════════════════════════════════════════════════════════════════

  -- Western foothills: descent from mountains into the old-growth forest
  ('ee000001-5573-4000-8000-000000000012', null, null, 'Plains', ARRAY[]::text[], 578, 318, false, true, '00000000-5573-4000-8000-000000000001'),
  ('ee000001-5573-4000-8000-000000000013', null, null, 'Plains', ARRAY[]::text[], 498, 392, false, true, '00000000-5573-4000-8000-000000000001'),
  -- Eastern foothills: south face of the east ridge descending toward the march
  ('ee000001-5573-4000-8000-000000000014', null, null, 'Plains', ARRAY[]::text[], 1545, 352, false, true, '00000000-5573-4000-8000-000000000001'),
  ('ee000001-5573-4000-8000-000000000015', null, null, 'Plains', ARRAY[]::text[], 1615, 430, false, true, '00000000-5573-4000-8000-000000000001'),

-- ═══ DEEP FOREST — West ══════════════════════════════════════════════════════
-- Pushing further west into old-growth beyond the current forest waypoints

  ('ee000001-5573-4000-8000-000000000016', null, null, 'Forest', ARRAY[]::text[], 448, 748, false, true, '00000000-5573-4000-8000-000000000001'),
  ('ee000001-5573-4000-8000-000000000017', null, null, 'Forest', ARRAY[]::text[], 360, 728, false, true, '00000000-5573-4000-8000-000000000001'),
  ('ee000001-5573-4000-8000-000000000018', null, null, 'Forest', ARRAY[]::text[], 302, 815, false, true, '00000000-5573-4000-8000-000000000001'),
  -- Ancient standing stones deep in the old-growth; purpose long forgotten
  ('ee000001-5573-4000-8000-000000000019', 'Standing Stones', 'POI', 'Forest', ARRAY[]::text[], 328, 680, false, false, '00000000-5573-4000-8000-000000000001'),
  -- Hillside cave entrance at the base of the wooded hills
  ('ee000001-5573-4000-8000-000000000020', 'Hillside Cave', 'Wilderness', 'Underground', ARRAY[]::text[], 375, 892, false, false, '00000000-5573-4000-8000-000000000001'),

-- ═══ RIVER CAVE ══════════════════════════════════════════════════════════════
  -- River undercuts a limestone bluff; cave mouth accessible from the bank
  ('ee000001-5573-4000-8000-000000000021', 'River Cave', 'Wilderness', 'Underground', ARRAY[]::text[], 855, 1075, false, false, '00000000-5573-4000-8000-000000000001'),

-- ═══ MARSH EXPANSION ═════════════════════════════════════════════════════════
-- Deeper into the wetlands east of Marsh Hamlet; connected but not mapped by most

  ('ee000001-5573-4000-8000-000000000022', null, null, 'Swamp / Wetland', ARRAY[]::text[], 1808, 520, false, true, '00000000-5573-4000-8000-000000000001'),
  ('ee000001-5573-4000-8000-000000000023', null, null, 'Swamp / Wetland', ARRAY[]::text[], 1775, 638, false, true, '00000000-5573-4000-8000-000000000001'),
  ('ee000001-5573-4000-8000-000000000024', null, null, 'Swamp / Wetland', ARRAY[]::text[], 1818, 740, false, true, '00000000-5573-4000-8000-000000000001'),
  -- Half-submerged burial mound; stones visible at low water
  ('ee000001-5573-4000-8000-000000000025', 'Drowned Barrow', 'Ruin', 'Swamp / Wetland', ARRAY[]::text[], 1848, 625, false, false, '00000000-5573-4000-8000-000000000001'),

-- ═══ EASTERN FRONTIER — Plains + Forest ═════════════════════════════════════
-- Open country south of the March Outpost; mostly unmapped beyond the road

  ('ee000001-5573-4000-8000-000000000026', null, null, 'Plains', ARRAY[]::text[], 1452, 1068, false, true, '00000000-5573-4000-8000-000000000001'),
  ('ee000001-5573-4000-8000-000000000027', null, null, 'Plains', ARRAY[]::text[], 1562, 1195, false, true, '00000000-5573-4000-8000-000000000001'),
  ('ee000001-5573-4000-8000-000000000028', null, null, 'Plains', ARRAY[]::text[], 1615, 1360, false, true, '00000000-5573-4000-8000-000000000001'),
  -- Junction of two old roads; the inn here collapsed long ago
  ('ee000001-5573-4000-8000-000000000029', 'Overgrown Crossroads', 'Ruin', 'Plains', ARRAY[]::text[], 1495, 1275, false, false, '00000000-5573-4000-8000-000000000001'),
  -- Forest creeping down the eastern flank from the mountain/marsh zone
  ('ee000001-5573-4000-8000-000000000030', null, null, 'Forest', ARRAY[]::text[], 1658, 1062, false, true, '00000000-5573-4000-8000-000000000001'),
  ('ee000001-5573-4000-8000-000000000031', null, null, 'Forest', ARRAY[]::text[], 1718, 1175, false, true, '00000000-5573-4000-8000-000000000001');


-- ═══ CONNECTIONS ════════════════════════════════════════════════════════════

INSERT INTO location_connections
  (from_location_id, to_location_id, bidirectional, travel_time_manual)
VALUES

  -- West mountain ridge chain
  ('dd000001-5573-4000-8000-000000000001', 'ee000001-5573-4000-8000-000000000001', true, false),
  ('ee000001-5573-4000-8000-000000000001', 'ee000001-5573-4000-8000-000000000002', true, false),
  ('ee000001-5573-4000-8000-000000000002', 'ee000001-5573-4000-8000-000000000003', true, false),
  -- High spur: Waystation → ee004 → rejoins ridge at ee002
  ('dd000001-5573-4000-8000-000000000002', 'ee000001-5573-4000-8000-000000000004', true, false),
  ('ee000001-5573-4000-8000-000000000004', 'ee000001-5573-4000-8000-000000000002', true, false),
  ('ee000001-5573-4000-8000-000000000004', 'ee000001-5573-4000-8000-000000000005', true, false),

  -- East mountain ridge chain
  ('dd000001-5573-4000-8000-000000000005', 'ee000001-5573-4000-8000-000000000006', true, false),
  ('ee000001-5573-4000-8000-000000000006', 'ee000001-5573-4000-8000-000000000007', true, false),
  ('ee000001-5573-4000-8000-000000000007', 'ee000001-5573-4000-8000-000000000011', true, false),
  ('ee000001-5573-4000-8000-000000000007', 'ee000001-5573-4000-8000-000000000008', true, false),
  ('ee000001-5573-4000-8000-000000000008', 'ee000001-5573-4000-8000-000000000009', true, false),
  ('ee000001-5573-4000-8000-000000000009', 'ee000001-5573-4000-8000-000000000010', true, false),
  ('ee000001-5573-4000-8000-000000000010', 'ee000001-5573-4000-8000-000000000014', true, false),

  -- Western foothills: mountains down into forest
  ('ee000001-5573-4000-8000-000000000003', 'ee000001-5573-4000-8000-000000000012', true, false),
  ('ee000001-5573-4000-8000-000000000012', 'ee000001-5573-4000-8000-000000000013', true, false),
  ('ee000001-5573-4000-8000-000000000013', '7ccab676-7b2b-488f-bbcd-bb0c74c3cfac', true, false),

  -- Eastern foothills: mountains down to Northmarch road
  ('ee000001-5573-4000-8000-000000000014', 'ee000001-5573-4000-8000-000000000015', true, false),
  ('ee000001-5573-4000-8000-000000000015', 'cc000001-5573-4000-8000-000000000002', true, false),

  -- Deep west forest: from existing mid-forest WP deeper in
  ('316bc244-5ccb-4529-b3e9-f667d4f4b071', 'ee000001-5573-4000-8000-000000000016', true, false),
  ('ee000001-5573-4000-8000-000000000016', 'ee000001-5573-4000-8000-000000000017', true, false),
  ('ee000001-5573-4000-8000-000000000017', 'ee000001-5573-4000-8000-000000000019', true, false),
  ('ee000001-5573-4000-8000-000000000017', 'ee000001-5573-4000-8000-000000000018', true, false),
  ('ee000001-5573-4000-8000-000000000018', 'ee000001-5573-4000-8000-000000000020', true, false),
  ('ee000001-5573-4000-8000-000000000018', '018f82f8-da05-455f-8c11-e8b0b2a544ac', true, false),

  -- River cave: accessible from the river bank north of Home Base
  ('aa000001-5573-4000-8000-000000000006', 'ee000001-5573-4000-8000-000000000021', true, false),

  -- Marsh expansion
  ('dd000001-5573-4000-8000-000000000011', 'ee000001-5573-4000-8000-000000000022', true, false),
  ('ee000001-5573-4000-8000-000000000022', 'ee000001-5573-4000-8000-000000000025', true, false),
  ('ee000001-5573-4000-8000-000000000025', 'ee000001-5573-4000-8000-000000000023', true, false),
  ('ee000001-5573-4000-8000-000000000023', 'cc000001-5573-4000-8000-000000000005', true, false),
  ('ee000001-5573-4000-8000-000000000023', 'ee000001-5573-4000-8000-000000000024', true, false),
  ('ee000001-5573-4000-8000-000000000024', '33ba22b8-e5cb-4a27-aa23-369d2b111f0b', true, false),

  -- Eastern frontier plains
  ('aa000001-5573-4000-8000-000000000003', 'ee000001-5573-4000-8000-000000000026', true, false),
  ('ee000001-5573-4000-8000-000000000026', 'ee000001-5573-4000-8000-000000000029', true, false),
  ('ee000001-5573-4000-8000-000000000029', 'ee000001-5573-4000-8000-000000000027', true, false),
  ('ee000001-5573-4000-8000-000000000027', 'ee000001-5573-4000-8000-000000000028', true, false),

  -- Eastern frontier forest (fringe from Ruined Keep southward)
  ('dd000001-5573-4000-8000-000000000006', 'ee000001-5573-4000-8000-000000000030', true, false),
  ('ee000001-5573-4000-8000-000000000030', '48369a27-0585-4400-a35d-f4e9d0cbe782', true, false),
  ('ee000001-5573-4000-8000-000000000030', 'ee000001-5573-4000-8000-000000000031', true, false),
  ('ee000001-5573-4000-8000-000000000031', 'ee000001-5573-4000-8000-000000000028', true, false);
