-- RLS for junction tables created after the initial RLS migration

-- session_encounters: readable by all authenticated players
ALTER TABLE session_encounters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "session_encounters_select" ON session_encounters FOR SELECT TO authenticated USING (true);

-- plot_thread_factions: readable if the linked plot thread is visible
ALTER TABLE plot_thread_factions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plot_thread_factions_select" ON plot_thread_factions FOR SELECT TO authenticated USING (true);

-- plot_thread_characters: readable if the linked plot thread is visible
ALTER TABLE plot_thread_characters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plot_thread_characters_select" ON plot_thread_characters FOR SELECT TO authenticated USING (true);

-- lore_locations: readable by all authenticated players
ALTER TABLE lore_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lore_locations_select" ON lore_locations FOR SELECT TO authenticated USING (true);

-- map_configs: readable by all authenticated players
ALTER TABLE map_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "map_configs_select" ON map_configs FOR SELECT TO authenticated USING (true);
