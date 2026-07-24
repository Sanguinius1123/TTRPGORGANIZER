-- Add Eastern Watchtower and Village as unplaced locations
INSERT INTO locations
  (id, name, type, terrain, path_modifiers, map_x, map_y, visible, waypoint, campaign_id)
VALUES
  ('11000001-5573-4000-8000-000000000015',
   'Eastern Watchtower', 'Fortification', 'Hills', ARRAY[]::text[],
   NULL, NULL, false, false, '00000000-5573-4000-8000-000000000001'),

  ('11000001-5573-4000-8000-000000000016',
   'Village', 'Settlement', 'Plains', ARRAY[]::text[],
   NULL, NULL, false, false, '00000000-5573-4000-8000-000000000001');
