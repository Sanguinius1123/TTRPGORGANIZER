-- NPC primary/known location
ALTER TABLE npcs ADD COLUMN IF NOT EXISTS current_location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

-- Faction-to-faction relationships (directional: A→B relationship type may differ from B→A)
CREATE TABLE IF NOT EXISTS faction_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_faction_id UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
  to_faction_id   UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL DEFAULT 'neutral',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Locations where a faction exists / operates (one faction → many locations)
CREATE TABLE IF NOT EXISTS faction_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faction_id  UUID NOT NULL REFERENCES factions(id)  ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
