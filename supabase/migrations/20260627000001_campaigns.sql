-- Create campaigns table
CREATE TABLE campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed the Test Campaign with a fixed UUID for the backfill
INSERT INTO campaigns (id, name, description)
VALUES ('00000000-cafe-4000-8000-000000000001', 'Test Campaign', 'Initial test data');

-- Add campaign_id to all 12 root entity tables (nullable first for backfill)
ALTER TABLE factions        ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES campaigns(id);
ALTER TABLE locations       ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES campaigns(id);
ALTER TABLE npcs            ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES campaigns(id);
ALTER TABLE player_characters ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES campaigns(id);
ALTER TABLE species         ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES campaigns(id);
ALTER TABLE cultures        ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES campaigns(id);
ALTER TABLE items           ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES campaigns(id);
ALTER TABLE shops           ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES campaigns(id);
ALTER TABLE sessions        ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES campaigns(id);
ALTER TABLE encounters      ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES campaigns(id);
ALTER TABLE lore_entries    ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES campaigns(id);
ALTER TABLE plot_threads    ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES campaigns(id);

-- Backfill all existing rows to Test Campaign
UPDATE factions        SET campaign_id = '00000000-cafe-4000-8000-000000000001' WHERE campaign_id IS NULL;
UPDATE locations       SET campaign_id = '00000000-cafe-4000-8000-000000000001' WHERE campaign_id IS NULL;
UPDATE npcs            SET campaign_id = '00000000-cafe-4000-8000-000000000001' WHERE campaign_id IS NULL;
UPDATE player_characters SET campaign_id = '00000000-cafe-4000-8000-000000000001' WHERE campaign_id IS NULL;
UPDATE species         SET campaign_id = '00000000-cafe-4000-8000-000000000001' WHERE campaign_id IS NULL;
UPDATE cultures        SET campaign_id = '00000000-cafe-4000-8000-000000000001' WHERE campaign_id IS NULL;
UPDATE items           SET campaign_id = '00000000-cafe-4000-8000-000000000001' WHERE campaign_id IS NULL;
UPDATE shops           SET campaign_id = '00000000-cafe-4000-8000-000000000001' WHERE campaign_id IS NULL;
UPDATE sessions        SET campaign_id = '00000000-cafe-4000-8000-000000000001' WHERE campaign_id IS NULL;
UPDATE encounters      SET campaign_id = '00000000-cafe-4000-8000-000000000001' WHERE campaign_id IS NULL;
UPDATE lore_entries    SET campaign_id = '00000000-cafe-4000-8000-000000000001' WHERE campaign_id IS NULL;
UPDATE plot_threads    SET campaign_id = '00000000-cafe-4000-8000-000000000001' WHERE campaign_id IS NULL;

-- Set NOT NULL
ALTER TABLE factions        ALTER COLUMN campaign_id SET NOT NULL;
ALTER TABLE locations       ALTER COLUMN campaign_id SET NOT NULL;
ALTER TABLE npcs            ALTER COLUMN campaign_id SET NOT NULL;
ALTER TABLE player_characters ALTER COLUMN campaign_id SET NOT NULL;
ALTER TABLE species         ALTER COLUMN campaign_id SET NOT NULL;
ALTER TABLE cultures        ALTER COLUMN campaign_id SET NOT NULL;
ALTER TABLE items           ALTER COLUMN campaign_id SET NOT NULL;
ALTER TABLE shops           ALTER COLUMN campaign_id SET NOT NULL;
ALTER TABLE sessions        ALTER COLUMN campaign_id SET NOT NULL;
ALTER TABLE encounters      ALTER COLUMN campaign_id SET NOT NULL;
ALTER TABLE lore_entries    ALTER COLUMN campaign_id SET NOT NULL;
ALTER TABLE plot_threads    ALTER COLUMN campaign_id SET NOT NULL;

-- Indexes for filtering
CREATE INDEX ON factions        (campaign_id);
CREATE INDEX ON locations       (campaign_id);
CREATE INDEX ON npcs            (campaign_id);
CREATE INDEX ON player_characters (campaign_id);
CREATE INDEX ON species         (campaign_id);
CREATE INDEX ON cultures        (campaign_id);
CREATE INDEX ON items           (campaign_id);
CREATE INDEX ON shops           (campaign_id);
CREATE INDEX ON sessions        (campaign_id);
CREATE INDEX ON encounters      (campaign_id);
CREATE INDEX ON lore_entries    (campaign_id);
CREATE INDEX ON plot_threads    (campaign_id);
