# TTRPG Organizer — Claude context

## Working style with Claude

**Use agents for self-contained tasks.** When a task is well-defined, doesn't need back-and-forth feedback, and spans many files (e.g. a full styling pass, a systematic search-and-replace, a broad refactor), delegate it to a sub-agent via the Agent tool with `isolation: "worktree"`. This keeps the main conversation free for things that need active decisions and adjustments. Good candidates: full dark-mode passes, linting sweeps, adding a consistent pattern across many pages, build verification loops.

**Keep the main conversation for interactive work**: new features with unclear scope, UX decisions, anything where the user needs to review options before proceeding, debugging sessions.

## What this project is

A **setting-agnostic** TTRPG campaign management tool. The GM needs structured, queryable data (not prose files) to manage NPCs, locations, factions, items, shops, encounters, sessions, lore, and plot threads. A separate read-only player portal shows only what the GM has explicitly revealed.

**Important:** This tool must remain setting-agnostic. Do not introduce setting-specific naming, terminology, or structure (e.g. "origin world", "Draw Steel" mechanics). It should work equally well for sci-fi, fantasy, dystopian, or any other genre.

## Repo structure

```
TTRPGorganizer/
  apps/
    gm/          # Next.js — private GM app, full read/write (BUILT)
    player/      # Next.js — player portal, runs on port 3001 (BUILT)
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

## Player portal (@supabase/ssr type gotcha)

`apps/player` uses `@supabase/ssr` for cookie-based session management. The `createServerClient` and `createBrowserClient` functions from `@supabase/ssr` have a third `Schema` generic that doesn't satisfy `GenericSchema` with hand-written Database types, causing all query `.data` to resolve as `never`.

**Fix:** Do NOT pass `<Database>` generic to `@supabase/ssr` functions in the player portal. All clients are created without the generic (defaults to `any`). Cast all query results explicitly — the same pattern as the GM app.

```typescript
// apps/player/src/lib/supabase/server.ts and client.ts
// ✓ correct — no generic
return createServerClient(url, key, { cookies: ... })

// ✗ wrong — causes never on all query results
return createServerClient<Database>(url, key, { cookies: ... })
```

## Database schema (live in Supabase)

All migrations applied. All tables exist.

```
-- Core entities
factions            (id, name, parent_faction_id FK self, disposition, goal, description, image_url, visible, species text, culture text, created_at)
locations           (id, name, type, descriptor, status, area, description, parent_location_id FK self, image_url, visible, created_at)
location_connections(id, from_location_id FK, to_location_id FK, travel_time, travel_cost, bidirectional, notes, created_at)
species             (id, name, description, origin_location_id FK nullable, created_at)
cultures            (id, name, description, created_at)
player_characters   (id, name, player_name, species text, culture text, background, notes, image_url, visible, current_location_id FK nullable, created_at)
npcs                (id, name, species text, profession, culture text, background, disposition, notes, image_url, visible, current_location_id FK nullable, created_at)
items               (id, name, description, base_price, item_type, created_at)
shops               (id, name, location_id FK, created_at)
shop_inventory      (id, shop_id FK, item_id FK, price_override, available, created_at)
sessions            (id, session_number, title, summary, loose_threads, faction_id FK nullable, created_at)
encounters          (id, title, location_id FK, session_id FK, status, summary, notes, created_at)
encounter_participants(id, encounter_id FK, npc_id FK nullable, label, count, role, notes, dr, created_at)
lore_entries        (id, title, category, descriptor, description, visible, created_at)
plot_threads        (id, title, type, description, status, notes, parent_id FK self, visible, created_at)

-- Junction / relationship tables
npc_facts           (id, npc_id FK, fact_text, revealed, created_at)
npc_factions        (id, npc_id FK, faction_id FK, role, created_at)
npc_locations       (id, npc_id FK, location_id FK, relationship_type, notes, created_at)
pc_factions         (id, pc_id FK, faction_id FK, role, created_at)
faction_relationships(id, from_faction_id FK, to_faction_id FK, relationship_type, notes, created_at)
  -- directional: A→B ≠ B→A; unique per direction
faction_locations   (id, faction_id FK, location_id FK, notes, created_at)
culture_locations   (id, culture_id FK, location_id FK, notes, created_at)
character_relationships(id, from_npc_id FK, from_pc_id FK, to_npc_id FK, to_pc_id FK, relationship_type, notes, created_at)
  -- directional: A→B ≠ B→A (one NPC may not know the other exists)
session_plot_threads(id, session_id FK, plot_thread_id FK, created_at)
session_notes       (id, session_id FK, pc_id FK nullable, author_name, notes_text, created_at)
```

**Visibility model:** `visible` boolean on most tables (GM toggles to expose to players). `revealed` boolean on `npc_facts` (per-fact granularity — some facts about an NPC are public, others secret). No session-number-based reveal tracking.

## What has been built — GM app

The GM app (`apps/gm`) is fully built and the TypeScript build passes clean.

### Pages
All 11 entity types have three pages each:

| Entity | List | Detail/Edit | New |
|--------|------|-------------|-----|
| Locations | `/locations` | `/locations/[id]` | `/locations/new` |
| NPCs | `/npcs` | `/npcs/[id]` | `/npcs/new` |
| Player Characters | `/player-characters` | `/player-characters/[id]` | `/player-characters/new` |
| Factions | `/factions` | `/factions/[id]` | `/factions/new` |
| Species | `/species` | `/species/[id]` | `/species/new` |
| Cultures | `/cultures` | `/cultures/[id]` | `/cultures/new` |
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

### New columns
- `items.location_id FK locations(id)` — where the item currently is (nullable)

### New tables
- `lore_locations (id, lore_id FK, location_id FK, notes, created_at)` — lore entries tied to one or more locations

### "Unknown" convention
`NULL` means unknown/nowhere for all location FKs. Never create a fake "Unknown" location row. UI displays `NULL` as "Unknown" or "Nomadic" depending on context.

## Player portal — what's built

`apps/player` is a full Next.js 16 app running on port 3001.

### Auth flow
- Players self-register at `/register` with email + password + **access code** (validated against `settings.registration_code`)
- On registration, a `profiles` row is created linking `auth.users.id` → `profiles.id`
- GM assigns a `player_characters` row to a player by setting `player_characters.profile_id` from the GM Settings page
- Session managed via `@supabase/ssr` cookies; middleware at `src/middleware.ts` enforces auth on all routes except `/login` and `/register`

### Pages
| Page | Route | Notes |
|------|-------|-------|
| My Character | `/` | Character sheet + editable fields + party sidebar; multi-PC switcher via `?pc=` param |
| PC detail (other) | `/player-characters/[id]` | Read-only sheet for another player's PC; redirects to `/` if it's your own |
| Sessions list | `/sessions` | Summary preview strips mention tokens |
| Session detail | `/sessions/[id]` | GM summary + loose threads + player notes; one note per PC per session (upsert) |
| Locations list | `/locations` | visible only, filter bar |
| Location detail | `/locations/[id]` | sub-locations + shop inventory |
| NPCs list | `/npcs` | visible only, filter bar |
| NPC detail | `/npcs/[id]` | revealed facts only; mentions rendered |
| Factions list | `/factions` | visible only, filter bar |
| Faction detail | `/factions/[id]` | visible NPC members; mentions rendered |
| Lore | `/lore` | tabbed: Lore / Species / Cultures, category chip filters |
| Lore detail | `/lore/[id]`, `/species/[id]`, `/cultures/[id]` | mentions rendered |
| (redirect) | `/character` | → `/` |

### Key design decisions
- Home page (`/`) is the character sheet, not a dashboard
- Multi-PC support: one profile can be assigned to multiple `player_characters`; `?pc=<id>` param switches between them
- `party_faction_id` FK on `player_characters` → `factions(id)` — GM sets per PC on the PC detail page; player portal uses it to populate the party sidebar
- Session notes: one note per PC per session (upsert); GM can edit/delete any note for moderation; players can edit their own
- Note display: "PC Name — Player Name" format
- Players can see all visible PCs but can only edit their own; `/player-characters/[id]` is read-only for others
- `private_notes` on `player_characters` is only rendered on `/` (your own sheet) — not shown on other players' views
- RLS enforces all visibility and write permissions at the database level

### @mention rendering (player portal)
Mentions in the format `[[type:id|name]]` are rendered in all detail pages using:
- `apps/player/src/lib/mentions.tsx` — `renderMentions(text, visibleIds)`, `stripMentions(text)`, `extractMentions(texts)`
- `apps/player/src/lib/mentionVisibility.ts` — `buildVisibleMentionSet(supabase, texts)` — batch-queries visibility via RLS and returns a `Set<string>` of visible IDs

**Visible mentions** render as colored clickable links (color varies by entity type). **Hidden mentions** (entity not visible to players) render as a randomly chosen glitch effect (block chars, alphanumeric noise, `REDACTED` badge, or symbol noise), with 3 surrounding non-space characters also scrambled to simulate "corruption bleed". The glitch style is picked server-side on each page load.

List-page summaries (e.g. sessions list) use `stripMentions` — no visibility queries needed for a preview.

### @mention / rich text — Tiptap upgrade (future)
- Replace MentionTextarea with Tiptap rich-text editor
- `@` triggers autocomplete searching across all entity types by name
- Mentions stored by entity ID internally so renames don't break links

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

1. **Apply remaining planned schema additions**
   - `items.location_id FK locations(id)` — nullable, where the item currently is
   - `lore_locations (id, lore_id FK, location_id FK, notes, created_at)` — lore entries tied to locations
2. **Item category + descriptor** — add category dropdown and Descriptor field to Items. Suggested types: weapon, armour, consumable, tool, currency, relic, document, vehicle, misc. Confirm list with user before implementing.
3. **Future features** (roughly in priority order):
   - **Live spellcheck** — add `spellCheck` attribute to all `textarea`/`input` fields (browser-native, free). Add to MentionTextarea and all edit forms in both apps.
   - **Shop inventory management UI** — schema exists (`shop_inventory`), no GM UI yet for adding/editing items in a shop
   - **History timeline page** — scrollable timeline for `lore_entries` where `category = 'History'`. Needs schema: `ALTER TABLE lore_entries ADD COLUMN major_event BOOLEAN DEFAULT FALSE; ALTER TABLE lore_entries ADD COLUMN event_timestamp TEXT;`. UI: anchored at "current time", scroll up = past, scroll down = future.
   - **Map image overlay** — pin positions (`x, y` on `locations`); don't add columns until building this
   - **NPC portrait / image upload** — needs Supabase Storage setup
   - **@mention Tiptap upgrade** — replace MentionTextarea with Tiptap rich-text editor
