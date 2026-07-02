-- Add ON DELETE CASCADE to all campaign_id foreign keys so that
-- deleting a campaign also deletes all its child entities.

ALTER TABLE factions          DROP CONSTRAINT IF EXISTS factions_campaign_id_fkey;
ALTER TABLE factions          ADD CONSTRAINT factions_campaign_id_fkey          FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;

ALTER TABLE locations         DROP CONSTRAINT IF EXISTS locations_campaign_id_fkey;
ALTER TABLE locations         ADD CONSTRAINT locations_campaign_id_fkey         FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;

ALTER TABLE npcs              DROP CONSTRAINT IF EXISTS npcs_campaign_id_fkey;
ALTER TABLE npcs              ADD CONSTRAINT npcs_campaign_id_fkey              FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;

ALTER TABLE player_characters DROP CONSTRAINT IF EXISTS player_characters_campaign_id_fkey;
ALTER TABLE player_characters ADD CONSTRAINT player_characters_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;

ALTER TABLE species           DROP CONSTRAINT IF EXISTS species_campaign_id_fkey;
ALTER TABLE species           ADD CONSTRAINT species_campaign_id_fkey           FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;

ALTER TABLE cultures          DROP CONSTRAINT IF EXISTS cultures_campaign_id_fkey;
ALTER TABLE cultures          ADD CONSTRAINT cultures_campaign_id_fkey          FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;

ALTER TABLE items             DROP CONSTRAINT IF EXISTS items_campaign_id_fkey;
ALTER TABLE items             ADD CONSTRAINT items_campaign_id_fkey             FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;

ALTER TABLE shops             DROP CONSTRAINT IF EXISTS shops_campaign_id_fkey;
ALTER TABLE shops             ADD CONSTRAINT shops_campaign_id_fkey             FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;

ALTER TABLE sessions          DROP CONSTRAINT IF EXISTS sessions_campaign_id_fkey;
ALTER TABLE sessions          ADD CONSTRAINT sessions_campaign_id_fkey          FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;

ALTER TABLE encounters        DROP CONSTRAINT IF EXISTS encounters_campaign_id_fkey;
ALTER TABLE encounters        ADD CONSTRAINT encounters_campaign_id_fkey        FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;

ALTER TABLE lore_entries      DROP CONSTRAINT IF EXISTS lore_entries_campaign_id_fkey;
ALTER TABLE lore_entries      ADD CONSTRAINT lore_entries_campaign_id_fkey      FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;

ALTER TABLE plot_threads      DROP CONSTRAINT IF EXISTS plot_threads_campaign_id_fkey;
ALTER TABLE plot_threads      ADD CONSTRAINT plot_threads_campaign_id_fkey      FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;
