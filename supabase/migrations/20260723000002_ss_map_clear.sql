-- Clear all map locations and connections for S&S campaign
-- 2026-07-23
-- Backup: 20260723000001_ss_map_backup.sql + migrations 20260722000001-000004

DO $$
DECLARE
  cid UUID := '00000000-5573-4000-8000-000000000001';
BEGIN
  -- Connections first (FK dependency)
  DELETE FROM location_connections
  WHERE from_location_id IN (SELECT id FROM locations WHERE campaign_id = cid)
     OR to_location_id   IN (SELECT id FROM locations WHERE campaign_id = cid);

  -- Clear any junction table references
  DELETE FROM lore_locations   WHERE location_id IN (SELECT id FROM locations WHERE campaign_id = cid);
  DELETE FROM npc_locations    WHERE location_id IN (SELECT id FROM locations WHERE campaign_id = cid);
  DELETE FROM faction_locations WHERE location_id IN (SELECT id FROM locations WHERE campaign_id = cid);
  DELETE FROM culture_locations WHERE location_id IN (SELECT id FROM locations WHERE campaign_id = cid);

  -- Null out FK references on other tables
  UPDATE items              SET location_id          = NULL WHERE location_id          IN (SELECT id FROM locations WHERE campaign_id = cid);
  UPDATE encounters         SET location_id          = NULL WHERE location_id          IN (SELECT id FROM locations WHERE campaign_id = cid);
  UPDATE npcs               SET current_location_id  = NULL WHERE current_location_id  IN (SELECT id FROM locations WHERE campaign_id = cid);
  UPDATE player_characters  SET current_location_id  = NULL WHERE current_location_id  IN (SELECT id FROM locations WHERE campaign_id = cid);
  UPDATE species            SET origin_location_id   = NULL WHERE origin_location_id   IN (SELECT id FROM locations WHERE campaign_id = cid);
  -- Self-referential parent (must clear before delete)
  UPDATE locations          SET parent_location_id   = NULL WHERE campaign_id = cid;

  -- Sub-map configs (root config has location_id NULL — preserve it)
  DELETE FROM map_configs WHERE location_id IN (SELECT id FROM locations WHERE campaign_id = cid);

  -- Finally delete the locations
  DELETE FROM locations WHERE campaign_id = cid;
END $$;
