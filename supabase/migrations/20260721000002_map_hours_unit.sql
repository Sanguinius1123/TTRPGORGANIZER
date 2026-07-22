-- Switch root map to hours and rescale distance_scale from 200 to 20
-- so edge labels show "3 hours" instead of "0.3 days"
-- (8-hour adventuring day → cover 2-4 nodes per day depending on terrain/roads)
UPDATE map_configs
  SET travel_unit = 'hours', distance_scale = 20
  WHERE location_id IS NULL;
