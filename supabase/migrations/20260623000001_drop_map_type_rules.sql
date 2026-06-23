-- map_type_rules was superseded by map_configs.
-- The GM now configures distance_scale / travel_unit per map level via map_configs.
-- No code reads from this table any more.
DROP TABLE IF EXISTS map_type_rules;
