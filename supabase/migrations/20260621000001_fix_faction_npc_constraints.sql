-- Allow an NPC to belong to the same faction with different roles
ALTER TABLE npc_factions DROP CONSTRAINT IF EXISTS npc_factions_npc_id_faction_id_key;

-- Deduplicate faction_relationships before adding uniqueness (keep most recent per direction)
DELETE FROM faction_relationships
WHERE id NOT IN (
  SELECT DISTINCT ON (from_faction_id, to_faction_id) id
  FROM faction_relationships
  ORDER BY from_faction_id, to_faction_id, created_at DESC
);

-- One stance per direction: A→B is one relationship, B→A is a separate one
ALTER TABLE faction_relationships
  ADD CONSTRAINT faction_relationships_from_to_unique
  UNIQUE (from_faction_id, to_faction_id);
