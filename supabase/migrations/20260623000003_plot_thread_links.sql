-- Link plot threads to factions and characters (PCs and NPCs)

CREATE TABLE plot_thread_factions (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  plot_thread_id uuid NOT NULL REFERENCES plot_threads(id) ON DELETE CASCADE,
  faction_id     uuid NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
  created_at     timestamptz DEFAULT now(),
  UNIQUE(plot_thread_id, faction_id)
);

CREATE TABLE plot_thread_characters (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  plot_thread_id uuid NOT NULL REFERENCES plot_threads(id) ON DELETE CASCADE,
  pc_id          uuid REFERENCES player_characters(id) ON DELETE CASCADE,
  npc_id         uuid REFERENCES npcs(id) ON DELETE CASCADE,
  created_at     timestamptz DEFAULT now(),
  CHECK (pc_id IS NOT NULL OR npc_id IS NOT NULL)
);

CREATE UNIQUE INDEX plot_thread_characters_pc_unique
  ON plot_thread_characters(plot_thread_id, pc_id) WHERE pc_id IS NOT NULL;

CREATE UNIQUE INDEX plot_thread_characters_npc_unique
  ON plot_thread_characters(plot_thread_id, npc_id) WHERE npc_id IS NOT NULL;
