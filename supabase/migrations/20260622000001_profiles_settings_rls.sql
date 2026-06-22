-- ============================================================
-- Profiles: links a Supabase auth user to a player account
-- ============================================================
CREATE TABLE profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Link player characters to profiles (GM assigns this)
-- ============================================================
ALTER TABLE player_characters
  ADD COLUMN IF NOT EXISTS profile_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS private_notes TEXT;

-- ============================================================
-- Link session notes to profiles for authorship tracking
-- ============================================================
ALTER TABLE session_notes
  ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- ============================================================
-- Settings: GM-configurable key/value store
-- ============================================================
CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT
);

INSERT INTO settings (key, value) VALUES ('registration_code', 'letsplay')
  ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- Row Level Security
-- ============================================================

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Settings: anon can read (needed for registration code check before signup)
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_select" ON settings FOR SELECT TO anon, authenticated USING (true);

-- Locations
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "locations_select" ON locations FOR SELECT TO authenticated USING (visible = true);

-- Location connections (visible if both endpoints are visible — approximate with permissive read)
ALTER TABLE location_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "location_connections_select" ON location_connections FOR SELECT TO authenticated USING (true);

-- NPCs
ALTER TABLE npcs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "npcs_select" ON npcs FOR SELECT TO authenticated USING (visible = true);

-- NPC facts: only revealed facts
ALTER TABLE npc_facts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "npc_facts_select" ON npc_facts FOR SELECT TO authenticated USING (revealed = true);

-- NPC factions / locations (visible if parent NPC is visible — enforced at app level)
ALTER TABLE npc_factions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "npc_factions_select" ON npc_factions FOR SELECT TO authenticated USING (true);

ALTER TABLE npc_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "npc_locations_select" ON npc_locations FOR SELECT TO authenticated USING (true);

-- Factions
ALTER TABLE factions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "factions_select" ON factions FOR SELECT TO authenticated USING (visible = true);

ALTER TABLE faction_relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "faction_relationships_select" ON faction_relationships FOR SELECT TO authenticated USING (true);

ALTER TABLE faction_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "faction_locations_select" ON faction_locations FOR SELECT TO authenticated USING (true);

-- Player characters: all visible PCs readable; owner can update their own
ALTER TABLE player_characters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "player_characters_select" ON player_characters FOR SELECT TO authenticated USING (visible = true);
CREATE POLICY "player_characters_update" ON player_characters FOR UPDATE TO authenticated USING (profile_id = auth.uid());

-- PC factions
ALTER TABLE pc_factions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pc_factions_select" ON pc_factions FOR SELECT TO authenticated USING (true);

-- Species and cultures: always fully visible to players
ALTER TABLE species ENABLE ROW LEVEL SECURITY;
CREATE POLICY "species_select" ON species FOR SELECT TO authenticated USING (true);

ALTER TABLE cultures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cultures_select" ON cultures FOR SELECT TO authenticated USING (true);

ALTER TABLE culture_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "culture_locations_select" ON culture_locations FOR SELECT TO authenticated USING (true);

-- Items and shops
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "items_select" ON items FOR SELECT TO authenticated USING (true);

ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shops_select" ON shops FOR SELECT TO authenticated USING (true);

ALTER TABLE shop_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shop_inventory_select" ON shop_inventory FOR SELECT TO authenticated USING (true);

-- Lore entries
ALTER TABLE lore_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lore_entries_select" ON lore_entries FOR SELECT TO authenticated USING (visible = true);

-- Plot threads
ALTER TABLE plot_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plot_threads_select" ON plot_threads FOR SELECT TO authenticated USING (visible = true);

-- Sessions and encounters: readable by all authenticated players
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions_select" ON sessions FOR SELECT TO authenticated USING (true);

ALTER TABLE encounters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "encounters_select" ON encounters FOR SELECT TO authenticated USING (true);

ALTER TABLE encounter_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "encounter_participants_select" ON encounter_participants FOR SELECT TO authenticated USING (true);

ALTER TABLE session_plot_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "session_plot_threads_select" ON session_plot_threads FOR SELECT TO authenticated USING (true);

-- Session notes: readable by all authenticated; players can insert/update their own
ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "session_notes_select"  ON session_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "session_notes_insert"  ON session_notes FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());
CREATE POLICY "session_notes_update"  ON session_notes FOR UPDATE TO authenticated USING (profile_id = auth.uid());

-- Character relationships
ALTER TABLE character_relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "character_relationships_select" ON character_relationships FOR SELECT TO authenticated USING (true);
