-- TTRPG Organizer schema
-- Run via Supabase CLI: supabase db execute --file supabase/migration.sql

create extension if not exists "uuid-ossp";

-- ============================================================
-- FACTIONS (defined early so NPCs can reference them)
-- ============================================================

create table factions (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  parent_faction_id uuid references factions(id) on delete set null,
  disposition  text,
  goal         text,
  description  text,
  image_url    text,
  visible      boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- LOCATIONS
-- ============================================================

create table locations (
  id                 uuid primary key default uuid_generate_v4(),
  name               text not null,
  type               text,
  status             text,
  area               text,   -- relative position within parent ("near the harbor", "outer ring")
  description        text,
  parent_location_id uuid references locations(id) on delete set null,
  image_url          text,
  visible            boolean not null default false,
  created_at         timestamptz not null default now()
);

create table location_connections (
  id               uuid primary key default uuid_generate_v4(),
  from_location_id uuid not null references locations(id) on delete cascade,
  to_location_id   uuid not null references locations(id) on delete cascade,
  travel_time      text,   -- "3 days by road", "2hr shuttle"
  travel_cost      text,   -- "5 gold", "50 credits"
  bidirectional    boolean not null default true,
  notes            text,
  created_at       timestamptz not null default now(),
  unique(from_location_id, to_location_id)
);

-- ============================================================
-- PLAYER CHARACTERS
-- ============================================================

create table player_characters (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  player_name text,
  species     text,
  background  text,
  notes       text,
  image_url   text,
  visible     boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- NPCs
-- ============================================================

create table npcs (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  species     text,
  profession  text,
  culture     text,
  background  text,
  disposition text,
  notes       text,
  image_url   text,
  visible     boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Per-fact visibility: some facts about an NPC are known to players, others secret
create table npc_facts (
  id        uuid primary key default uuid_generate_v4(),
  npc_id    uuid not null references npcs(id) on delete cascade,
  fact_text text not null,
  revealed  boolean not null default false,
  created_at timestamptz not null default now()
);

-- NPC faction membership (one NPC can belong to multiple factions)
create table npc_factions (
  id         uuid primary key default uuid_generate_v4(),
  npc_id     uuid not null references npcs(id) on delete cascade,
  faction_id uuid not null references factions(id) on delete cascade,
  role       text,   -- "council member", "sleeper agent"
  created_at timestamptz not null default now(),
  unique(npc_id, faction_id)
);

-- NPC location ties (home, former home, visited and left a mark)
create table npc_locations (
  id                uuid primary key default uuid_generate_v4(),
  npc_id            uuid not null references npcs(id) on delete cascade,
  location_id       uuid not null references locations(id) on delete cascade,
  relationship_type text not null, -- "home", "former_home", "visited"
  notes             text,
  created_at        timestamptz not null default now()
);

-- Directional character relationships (A→B is not the same as B→A)
create table character_relationships (
  id                uuid primary key default uuid_generate_v4(),
  from_npc_id       uuid references npcs(id) on delete cascade,
  from_pc_id        uuid references player_characters(id) on delete cascade,
  to_npc_id         uuid references npcs(id) on delete cascade,
  to_pc_id          uuid references player_characters(id) on delete cascade,
  relationship_type text not null,  -- "rival", "secretly works for", "sibling", etc.
  notes             text,
  created_at        timestamptz not null default now(),
  -- exactly one character on each side
  constraint from_character_set check (
    (from_npc_id is not null)::int + (from_pc_id is not null)::int = 1
  ),
  constraint to_character_set check (
    (to_npc_id is not null)::int + (to_pc_id is not null)::int = 1
  )
);

-- ============================================================
-- ITEMS, SHOPS, INVENTORY
-- ============================================================

create table items (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  description text,
  base_price  integer,
  item_type   text,
  created_at  timestamptz not null default now()
);

create table shops (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  location_id uuid not null references locations(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create table shop_inventory (
  id             uuid primary key default uuid_generate_v4(),
  shop_id        uuid not null references shops(id) on delete cascade,
  item_id        uuid not null references items(id) on delete cascade,
  price_override integer,
  available      boolean not null default true,
  created_at     timestamptz not null default now(),
  unique(shop_id, item_id)
);

-- ============================================================
-- SESSIONS
-- ============================================================

create table sessions (
  id             uuid primary key default uuid_generate_v4(),
  session_number integer not null unique,
  title          text,
  summary        text,
  loose_threads  text,
  created_at     timestamptz not null default now()
);

-- ============================================================
-- ENCOUNTERS
-- ============================================================

create table encounters (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  location_id uuid references locations(id) on delete set null,
  session_id  uuid references sessions(id) on delete set null,
  status      text not null default 'prep',  -- prep / active / archived
  summary     text,
  notes       text,
  created_at  timestamptz not null default now()
);

-- Participants: named NPCs are linked by FK; unnamed combatants use label only
create table encounter_participants (
  id          uuid primary key default uuid_generate_v4(),
  encounter_id uuid not null references encounters(id) on delete cascade,
  npc_id      uuid references npcs(id) on delete set null,
  label       text not null,   -- "12 city guards", or NPC name if linked
  count       integer not null default 1,
  role        text,            -- "enemy", "ally", "neutral", "boss"
  notes       text,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- LORE
-- ============================================================

create table lore_entries (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  category    text,
  description text,
  visible     boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- PLOT THREADS
-- ============================================================

create table plot_threads (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  type        text not null,    -- "thread", "hook", "objective"
  description text,
  status      text not null default 'active',  -- "active", "completed", "abandoned"
  notes       text,
  parent_id   uuid references plot_threads(id) on delete set null,
  visible     boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- The GM app uses the service role key and bypasses RLS entirely.
-- The player portal uses the anon key; RLS filters to visible rows only.
-- ============================================================

alter table factions           enable row level security;
alter table locations          enable row level security;
alter table location_connections enable row level security;
alter table player_characters  enable row level security;
alter table npcs               enable row level security;
alter table npc_facts          enable row level security;
alter table npc_factions       enable row level security;
alter table npc_locations      enable row level security;
alter table character_relationships enable row level security;
alter table items              enable row level security;
alter table shops              enable row level security;
alter table shop_inventory     enable row level security;
alter table sessions           enable row level security;
alter table encounters         enable row level security;
alter table encounter_participants enable row level security;
alter table lore_entries       enable row level security;
alter table plot_threads       enable row level security;

-- Locations: anon can read visible locations and their contents
create policy "anon read visible locations"
  on locations for select to anon using (visible = true);

create policy "anon read connections between visible locations"
  on location_connections for select to anon using (
    exists (select 1 from locations a where a.id = from_location_id and a.visible = true)
    and exists (select 1 from locations b where b.id = to_location_id and b.visible = true)
  );

create policy "anon read shops at visible locations"
  on shops for select to anon using (
    exists (select 1 from locations l where l.id = location_id and l.visible = true)
  );

create policy "anon read available inventory"
  on shop_inventory for select to anon using (available = true);

create policy "anon read items"
  on items for select to anon using (true);

-- NPCs: anon can read visible NPCs and their revealed facts
create policy "anon read visible npcs"
  on npcs for select to anon using (visible = true);

create policy "anon read revealed npc facts"
  on npc_facts for select to anon using (
    revealed = true
    and exists (select 1 from npcs n where n.id = npc_id and n.visible = true)
  );

create policy "anon read npc faction links for visible npcs"
  on npc_factions for select to anon using (
    exists (select 1 from npcs n where n.id = npc_id and n.visible = true)
  );

-- Factions: anon can read visible factions
create policy "anon read visible factions"
  on factions for select to anon using (visible = true);

-- Player characters: anon can read visible PCs
create policy "anon read visible player characters"
  on player_characters for select to anon using (visible = true);

-- Lore: anon can read visible entries
create policy "anon read visible lore"
  on lore_entries for select to anon using (visible = true);

-- Plot threads: anon can read visible threads
create policy "anon read visible plot threads"
  on plot_threads for select to anon using (visible = true);

-- Sessions, encounters, character_relationships, npc_locations: GM only, no anon policy
