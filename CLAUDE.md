# TTRPG Organizer — Claude context

## What this project is

A **setting-agnostic** TTRPG campaign management tool. The GM needs structured, queryable data (not prose files) to manage NPCs, locations, factions, items, shops, encounters, sessions, lore, and plot threads. A separate read-only player portal shows only what the GM has explicitly revealed.

**Important:** This tool must remain setting-agnostic. Do not introduce setting-specific naming, terminology, or structure (e.g. "origin world", "Draw Steel" mechanics). It should work equally well for sci-fi, fantasy, dystopian, or any other genre.

## Repo structure

```
TTRPGorganizer/
  apps/
    gm/          # Next.js — private GM app, full read/write (BUILT)
    player/      # Next.js — public player portal, read-only (NOT YET CREATED)
  packages/
    db/          # Supabase client + TypeScript types
      src/
        types.ts    # Hand-written Database interface + named type exports
        server.ts   # createServerClient() — service role, for Server Components/Actions
        browser.ts  # createBrowserClient() — anon key, for player portal
        index.ts    # re-exports all of the above
  CLAUDE.md
  package.json   # pnpm workspace root
  pnpm-workspace.yaml
```

Package manager: **pnpm** with workspaces. Run `pnpm --filter gm dev` to start the GM app.

## Supabase CLI access

The Supabase CLI is available and connected to the live project. Always apply migrations by running:

```
npx supabase db push
```

Do not ask the user to run migrations manually — run them directly.

## Tech stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | Next.js 16 (App Router) | Both apps |
| Styling | Tailwind CSS v4 | `@import "tailwindcss"` syntax, no config file |
| Language | TypeScript | Strict |
| Database | Supabase (Postgres) | Live project connected |
| Auth | Supabase Auth | Single GM account — login page at `/login` |
| Deployment | Vercel | Player portal; GM app runs locally |
| Package manager | pnpm | Workspaces |

## Database schema (live in Supabase)

Migration has been applied. All tables exist.

```
factions            (id, name, parent_faction_id FK self, disposition, goal, description, image_url, visible, created_at)
locations           (id, name, type, descriptor, status, area, description, parent_location_id FK self, image_url, visible, created_at)
location_connections(id, from_location_id FK, to_location_id FK, travel_time, travel_cost, bidirectional, notes, created_at)
player_characters   (id, name, player_name, species, background, notes, image_url, visible, created_at)
npcs                (id, name, species, profession, culture, background, disposition, notes, image_url, visible, created_at)
npc_facts           (id, npc_id FK, fact_text, revealed, created_at)
npc_factions        (id, npc_id FK, faction_id FK, role, created_at)
npc_locations       (id, npc_id FK, location_id FK, relationship_type, notes, created_at)
character_relationships(id, from_npc_id FK, from_pc_id FK, to_npc_id FK, to_pc_id FK, relationship_type, notes, created_at)
  -- directional: A→B ≠ B→A (one NPC may not know the other exists)
items               (id, name, description, base_price, item_type, created_at)
shops               (id, name, location_id FK, created_at)
shop_inventory      (id, shop_id FK, item_id FK, price_override, available, created_at)
sessions            (id, session_number, title, summary, loose_threads, created_at)
encounters          (id, title, location_id FK, session_id FK, status, summary, notes, created_at)
encounter_participants(id, encounter_id FK, npc_id FK nullable, label, count, role, notes, created_at)
lore_entries        (id, title, category, descriptor, description, visible, created_at)
plot_threads        (id, title, type, description, status, notes, parent_id FK self, visible, created_at)
```

**Visibility model:** `visible` boolean on most tables (GM toggles to expose to players). `revealed` boolean on `npc_facts` (per-fact granularity — some facts about an NPC are public, others secret). No session-number-based reveal tracking.

## What has been built — GM app

The GM app (`apps/gm`) is fully built and the TypeScript build passes clean.

### Pages
All 9 entity types have three pages each:

| Entity | List | Detail/Edit | New |
|--------|------|-------------|-----|
| Locations | `/locations` | `/locations/[id]` | `/locations/new` |
| NPCs | `/npcs` | `/npcs/[id]` | `/npcs/new` |
| Player Characters | `/player-characters` | `/player-characters/[id]` | `/player-characters/new` |
| Factions | `/factions` | `/factions/[id]` | `/factions/new` |
| Items | `/items` | `/items/[id]` | `/items/new` |
| Sessions | `/sessions` | `/sessions/[id]` | `/sessions/new` |
| Encounters | `/encounters` | `/encounters/[id]` | `/encounters/new` |
| Lore | `/lore` | `/lore/[id]` | `/lore/new` |
| Plot Threads | `/plot-threads` | `/plot-threads/[id]` | `/plot-threads/new` |

### Key features per detail page
- **Locations**: edit form, visibility toggle, parent location selector, sub-locations table, shops list
- **NPCs**: edit form, visibility toggle, facts section with per-fact `revealed` checkbox, faction membership chips
- **Factions**: edit form, visibility toggle, parent faction selector, sub-factions table, NPC members table
- **Encounters**: edit form, status selector, linked location/session, participant table with Add Participant form
- **Sessions**: edit form, linked encounters list
- **Plot Threads**: edit form, visibility toggle, parent thread selector, child threads table

### Server Actions (`apps/gm/src/lib/actions/`)
One file per entity. Each implements: `create*`, `update*`, `delete*`, `toggle*Visibility` (where applicable). Encounters also have `addParticipant`, `deleteParticipant`. NPCs also have `addNpcFact`, `updateNpcFact`, `deleteNpcFact`, `addNpcFaction`, `removeNpcFaction`.

### Auth
Login page at `/login` with Supabase email/password. Middleware at `src/middleware.ts` redirects unauthenticated users to `/login`.

## Key design decisions and why

**Supabase over SQLite-in-repo:** The player portal is deployed online and needs concurrent read/write access with the GM's local environment. SQLite in a repo can't support this.

**Relational DB over flat Markdown files / wiki:** NPCs need per-fact visibility toggling. Locations have shops; shops have items; the same item can have different prices per location — inherently relational.

**Two separate apps (gm + player), same Supabase project:** The GM app uses the service-role key (full CRUD). The player portal uses the anon key (reads only `visible = true` / `revealed = true` rows). Both share `packages/db`.

**Per-fact NPC visibility (`npc_facts` table):** A `visible` boolean on the `npcs` row would be all-or-nothing. The junction table allows individual facts to be revealed independently.

**Directional `character_relationships`:** A→B is not the same as B→A. One NPC may be plotting against another who doesn't even know they exist.

**`encounter_participants` has a `label` field, not FK-only:** Most encounter participants are not worth tracking as full NPCs. `label` is a free-text description; `npc_id` is an optional FK for linking named NPCs.

**Map as node graph first, image map later:** Locations are a list/hierarchy now. Schema leaves room for optional `x, y` columns later for map pin positions — don't add until building that feature.

## Critical TypeScript gotchas — hand-written Database types

Our `packages/db/src/types.ts` uses a hand-written `Database` interface (not Supabase CLI codegen). This causes several Supabase JS inference issues. The established patterns to avoid them:

### 1. Database interface must include all GenericSchema keys
```typescript
interface Database {
  public: {
    Tables: { /* ... */ }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
```

### 2. Every table must have `Relationships: []`
Without it, `supabase.from('table')` returns `PostgrestQueryBuilder<Database, never, ...>` and everything types as `never`.
```typescript
factions: {
  Row: { /* ... */ }
  Insert: Partial<Omit<Row, 'id' | 'created_at'>>
  Update: Partial<Omit<Row, 'id' | 'created_at'>>
  Relationships: []
}
```

### 3. `Insert` must be `Partial<Omit<Row, 'id' | 'created_at'>>`
Using bare `Omit<Row, ...>` makes all fields required in insert payloads, including nullable fields like `image_url`. Wrapping in `Partial<>` matches Supabase codegen behaviour.

### 4. Query result casting patterns

**Single entity fetch** (`.single()` + `notFound()`):
```typescript
const { data: raw } = await supabase.from('factions').select('*').eq('id', id).single()
if (!raw) notFound()
const faction = raw as Faction   // cast AFTER the null check
```

**List fetch**:
```typescript
const { data: rawItems } = await supabase.from('items').select('*').order('name')
const items = (rawItems ?? []) as Item[]
```

**Partial select** (`select('id, name')`):
```typescript
const { data: rawData } = await supabase.from('factions').select('id, name').order('name')
const factions = (rawData ?? []) as Array<{ id: string; name: string }>
```

**Never use join aliases** (`select('*, alias:fk(field)')`): These cause the result type to collapse to `never` with hand-written types. Fetch related entities in separate queries instead, then build a lookup map:
```typescript
const npcById = Object.fromEntries(npcs.map(n => [n.id, n]))
```

**Promise.all with selects**: Index into results array and cast explicitly — don't use destructuring when any query might type as `never`:
```typescript
const results = await Promise.all([
  supabase.from('locations').select('id, name').order('name'),
  supabase.from('sessions').select('id, session_number').order('session_number'),
])
const locations = (results[0].data ?? []) as Array<{ id: string; name: string }>
const sessions  = (results[1].data ?? []) as Array<{ id: string; session_number: number }>
```

## Planned schema additions (not yet migrated)

These changes are designed but not yet applied to the database or wired into the UI:

### New columns
- `items.location_id FK locations(id)` — where the item currently is (nullable)
- `npcs.current_location_id FK locations(id)` — where the NPC is expected to be found (nullable)
- `npcs.origin_location_id FK locations(id)` — where the NPC came from (nullable)
- `player_characters.origin_location_id FK locations(id)` — where the PC came from (nullable)

### New tables
- `pc_factions (id, pc_id FK, faction_id FK, role, created_at)` — PCs can belong to multiple factions (mirrors `npc_factions`)
- `lore_locations (id, lore_id FK, location_id FK, notes, created_at)` — lore entries can be tied to one or more locations

### "Unknown" convention
`NULL` means unknown/nowhere for all location FKs. Never create a fake "Unknown" location row. UI displays `NULL` as "Unknown" or "Nomadic" depending on context.

### @mention / rich text (large feature, do separately)
- Replace textarea fields with Tiptap rich-text editor
- `@` triggers autocomplete searching across all entity types by name
- Mentions stored by entity ID internally so renames don't break links
- Rendered as clickable links navigating to the entity's detail page

### Player portal distance calculator (after portal is built)
- When party's current location is known, show travel distance/cost to other visible locations
- Uses `location_connections` graph with Dijkstra shortest-path traversal
- Requires a way to track party's current location — needs design (candidate: `party_location_id` on a global settings table)

## Categorised dropdown lists (implemented)

These entity types now have a fixed dropdown for their primary category field, plus a free-text **Descriptor** field for additional detail (e.g. "Ocean World", "Year 1247 AE", "Undead"):

- **Locations** — 22 types: Sector, Star System, Star / Singularity, World, Space Station, Wilderness, Ruin, Settlement, District, Fortification, Residence, Commerce, Tavern / Inn, Place of Worship, Government, Prison, Guild / Organization, Workshop, Research / Laboratory, Medical / Healthcare, Entertainment, Transport Hub
- **Lore & Knowledge** — 12 categories: History, Myth & Legend, Religion & Faith, Magic / Technology, Culture & Society, Politics & Law, Cosmology, Bestiary, Languages & Scripts, Artifacts & Relics, Geography & Astronomy, Economy & Trade

**Items** — needs the same treatment. Add a category dropdown (types TBD — think weapon, armour, consumable, tool, currency, relic, document, vehicle, misc) plus a Descriptor field. Design the list before implementing.

## Next steps

1. **Build the player portal** (`apps/player`) — this is the next major feature. Details:
   - New Next.js app using `createBrowserClient()` from `packages/db`
   - Reads only `visible = true` rows (locations, NPCs, factions, lore, plot threads) and only `revealed = true` npc_facts
   - **Login / user accounts**: Players need their own accounts to log in to the web portal. Use Supabase Auth. Each player account is linked to a `player_characters` row so the app knows who they are. Design needed: a `profiles` table or a `auth_user_id` column on `player_characters`.
   - **Player-editable fields**: Some things players should be able to edit themselves (e.g. session notes, their own PC's notes/background). Most content is GM-only. Define the boundary carefully before building.
   - Pages needed: locations list, location detail (shops/inventory), NPC list (visible NPCs + revealed facts only), lore list, their own PC sheet
   - Deploy to Vercel — set env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
2. **Apply remaining planned schema additions** — see "Planned schema additions" section below.
3. **Future features**:
   - **Item category list** — add dropdown + descriptor to Items (see note above)
   - **Live spellcheck** — investigate browser-native `spellCheck` attribute on textarea/input elements (free, no library needed). If richer highlighting is needed, consider a lightweight library. Add to all MentionTextarea and text input fields.
   - **History timeline page** — scrollable timeline UI for `lore_entries` where `category = 'History'`. Requires schema additions: `ALTER TABLE lore_entries ADD COLUMN major_event BOOLEAN DEFAULT FALSE; ALTER TABLE lore_entries ADD COLUMN event_timestamp TEXT;`. When `major_event = true` and `event_timestamp` is set, entry appears on the timeline. UI: page anchored at "current time", scroll up = past, scroll down = future.
   - Map image overlay with pin positions (`x, y` on `locations`)
   - NPC portrait / image upload
   - Shop inventory management UI (schema exists, no UI yet for `shop_inventory`)
   - @mention / rich text editor (Tiptap)
