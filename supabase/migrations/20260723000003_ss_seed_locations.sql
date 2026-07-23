-- S&S: seed unplaced locations for manual map layout
-- All have NULL map_x/map_y so they appear in the unplaced sidebar
-- 2026-07-23

INSERT INTO locations
  (id, name, type, terrain, path_modifiers, map_x, map_y, visible, waypoint, campaign_id)
VALUES

-- ═══ SETTLEMENTS ═════════════════════════════════════════════════════════════

  ('11000001-5573-4000-8000-000000000001',
   'Starting Hub', 'Settlement', 'Urban', ARRAY['Road','Dock'],
   NULL, NULL, true, false, '00000000-5573-4000-8000-000000000001'),

  ('11000001-5573-4000-8000-000000000002',
   'Coastal Town', 'Settlement', 'Coastal', ARRAY['Road','Dock'],
   NULL, NULL, false, false, '00000000-5573-4000-8000-000000000001'),

-- ═══ DISCOVERABLE LOCATIONS ══════════════════════════════════════════════════

  ('11000001-5573-4000-8000-000000000003',
   'Ancient Ruins', 'Ruin', 'Plains', ARRAY[]::text[],
   NULL, NULL, false, false, '00000000-5573-4000-8000-000000000001'),

  ('11000001-5573-4000-8000-000000000004',
   'Forest Cave', 'Wilderness', 'Underground', ARRAY[]::text[],
   NULL, NULL, false, false, '00000000-5573-4000-8000-000000000001'),

  ('11000001-5573-4000-8000-000000000005',
   'Abandoned Watchtower', 'Ruin', 'Hills', ARRAY[]::text[],
   NULL, NULL, false, false, '00000000-5573-4000-8000-000000000001'),

  ('11000001-5573-4000-8000-000000000006',
   'Sunken Temple', 'Ruin', 'River / Lake', ARRAY[]::text[],
   NULL, NULL, false, false, '00000000-5573-4000-8000-000000000001'),

  ('11000001-5573-4000-8000-000000000007',
   'Hidden Shrine', 'POI', 'Forest', ARRAY[]::text[],
   NULL, NULL, false, false, '00000000-5573-4000-8000-000000000001'),

  ('11000001-5573-4000-8000-000000000008',
   'Old Mine Shaft', 'Ruin', 'Mountain', ARRAY[]::text[],
   NULL, NULL, false, false, '00000000-5573-4000-8000-000000000001'),

  ('11000001-5573-4000-8000-000000000009',
   'Sea Cave', 'Wilderness', 'Coastal', ARRAY[]::text[],
   NULL, NULL, false, false, '00000000-5573-4000-8000-000000000001'),

  ('11000001-5573-4000-8000-000000000010',
   'Crumbled Keep', 'Ruin', 'Plains', ARRAY[]::text[],
   NULL, NULL, false, false, '00000000-5573-4000-8000-000000000001'),

  ('11000001-5573-4000-8000-000000000011',
   'Standing Stones', 'POI', 'Plains', ARRAY[]::text[],
   NULL, NULL, false, false, '00000000-5573-4000-8000-000000000001'),

  ('11000001-5573-4000-8000-000000000012',
   'Smuggler''s Cove', 'Wilderness', 'Coastal', ARRAY[]::text[],
   NULL, NULL, false, false, '00000000-5573-4000-8000-000000000001'),

  ('11000001-5573-4000-8000-000000000013',
   'Overgrown Barrow', 'Ruin', 'Hills', ARRAY[]::text[],
   NULL, NULL, false, false, '00000000-5573-4000-8000-000000000001'),

  ('11000001-5573-4000-8000-000000000014',
   'Collapsed Bridge', 'Ruin', 'River / Lake', ARRAY[]::text[],
   NULL, NULL, false, false, '00000000-5573-4000-8000-000000000001');
