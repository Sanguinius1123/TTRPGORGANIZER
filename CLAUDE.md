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
    gm/          # Next.js — single combined app (GM + player portal), deployed to Vercel
  packages/
    db/          # Supabase client + TypeScript types
      src/
        types.ts    # Hand-written Database interface + named type exports
        server.ts   # createServerClient() — service role, for Server Components/Actions
        index.ts    # re-exports all of the above
  CLAUDE.md
  package.json   # pnpm workspace root
  pnpm-workspace.yaml
```

Package manager: **pnpm** with workspaces. Run `pnpm --filter gm dev` to start the app (port 3000).

## Combined app architecture (apps/gm)

GM and player portal are merged into a single Next.js app. Role determines what users see.

### Auth roles (`profiles` table)
- `is_admin = true` — sees Settings page, can toggle GM on other accounts. Auto-set for `macarthur1123@gmail.com` via DB trigger on registration.
- `is_gm = true` — full GM portal access
- Neither flag — player portal only (`/play/*`)

### Route structure
```
apps/gm/src/app/
  proxy.ts            ← Next.js 16 proxy (function must be named `proxy`, not `middleware`)
  login/              ← shared login; redirects GM→/ player→/play
  register/           ← player registration (access code required)
  (gm)/               ← GM route group, transparent URLs (/locations, /npcs, etc.)
    layout.tsx        ← checks is_gm via anonClient, renders Sidebar(isAdmin)
    page.tsx, locations/, npcs/, map/, lore/, ...
  play/               ← player portal; URLs are /play, /play/locations, etc.
    layout.tsx        ← checks auth via anonClient, renders PlayerNav(isGm)
    page.tsx, locations/, sessions/, map/, ...
```

### Supabase clients in apps/gm
- `src/lib/db.ts` → service role client — used by ALL GM page queries and server actions
- `src/lib/supabase/server.ts` → `createAnonClient()` — cookie-based SSR client, used ONLY for auth checks in layouts and proxy.ts
- `src/lib/supabase/client.ts` → browser client for client components (login page, player NoteForm, etc.)

### Key components
- `Sidebar` — GM nav; `isAdmin: boolean` prop; Settings only shown when isAdmin; "View as Player →" always shown; shows `CampaignSwitcher`
- `PlayerNav` — player nav; `isGm: boolean` prop; "← GM Portal" shown when isGm

## Multi-campaign support

Live — `campaigns` table + `campaign_id` FK (NOT NULL) on all 12 root entity tables: factions, locations, npcs, player_characters, species, cultures, items, shops, sessions, encounters, lore_entries, plot_threads. Junction tables are NOT campaign-scoped (they inherit scope via their parent FK).

- **GM side**: active campaign tracked via `active_campaign_id` cookie (`apps/gm/src/lib/activeCampaign.ts` → `getActiveCampaignId()`). `(gm)/layout.tsx` defaults to the first campaign (by `created_at`) if no cookie is set. `CampaignSwitcher` component + `switchCampaign`/`createCampaign` actions in `apps/gm/src/lib/actions/campaigns.ts`. Every GM list/detail query must filter `.eq('campaign_id', activeCampaignId)`.
- **Player side**: campaign is derived from the player's active PC, not a cookie choice — `apps/gm/src/lib/playCampaign.ts` → `getPlayCampaignId()` resolves via `active_pc_id` cookie (`activePC.ts`), falling back to the player's first PC alphabetically. `/play/*` pages scope queries to this campaign id.
- **New entity creation**: server actions for the 12 root tables must set `campaign_id` from the active campaign on insert (see `apps/gm/src/lib/actions/*.ts`).
- Existing data was backfilled into a seeded "Test Campaign" (`00000000-cafe-4000-8000-000000000001`) — see `supabase/migrations/20260627000001_campaigns.sql` and `CAMPAIGN-MIGRATION.md` for the full migration writeup.

## Supabase CLI access

The Supabase CLI is available and connected to the live project. Always apply migrations by running:

```
npx supabase db push
```

Do not ask the user to run migrations manually — run them directly.

## Tech stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | Next.js 16 (App Router) | apps/gm only |
| Styling | Tailwind CSS v4 | `@import "tailwindcss"` syntax, no config file |
| Language | TypeScript | Strict |
| Database | Supabase (Postgres) | Live project connected |
| Auth | Supabase Auth + `@supabase/ssr` | Role-based: is_gm / is_admin on profiles table |
| Deployment | Vercel | Single project from apps/gm |
| Package manager | pnpm | Workspaces |
| Node map | `@xyflow/react` v12 | GM map + player map |
| PNG export | `html-to-image` | GM map only |

## @supabase/ssr type gotcha

`apps/gm/src/lib/supabase/server.ts` (`createAnonClient`) and `client.ts` use `@supabase/ssr`. The `createServerClient` / `createBrowserClient` functions have a third `Schema` generic that doesn't satisfy `GenericSchema` with hand-written Database types, causing all query `.data` to resolve as `never`.

**Fix:** Do NOT pass `<Database>` generic to `@supabase/ssr` functions. All clients are created without the generic (defaults to `any`). Cast all query results explicitly.

```typescript
// ✓ correct — no generic
return createServerClient(url, key, { cookies: ... })

// ✗ wrong — causes never on all query results
return createServerClient<Database>(url, key, { cookies: ... })
```

## Database schema (live in Supabase)

All migrations applied. All tables exist.

```
campaigns           (id, name, description, created_at)
                    -- all 12 root entity tables below have campaign_id uuid NOT NULL FK -> campaigns(id), indexed
                    -- junction tables are NOT campaign-scoped (inherit scope via parent FK)

-- Core entities
factions            (id, name, parent_faction_id FK self, disposition, goal, description, image_url, visible, species text, culture text, campaign_id FK, created_at)
locations           (id, name text|null, type, descriptor, status, area, description, gm_notes text,
                     parent_location_id FK self, image_url, visible, map_x float, map_y float, waypoint bool,
                     terrain text, path_modifiers text[], has_submap bool DEFAULT false, mystery bool DEFAULT false, created_at)
                    -- name is nullable (waypoints have no name)
                    -- gm_notes: GM-only field; never queried or rendered by player portal pages
                    -- map_x/map_y: NULL = not placed on canvas
                    -- waypoint: true = anonymous routing dot, no name; shown on player map but excluded from player locations list
                    -- has_submap: true = clicking this node on the map drills into /map/[id]
                    -- mystery: true = visible on player map as "???" but excluded from player locations list and detail page
location_connections(id, from_location_id FK, to_location_id FK, travel_time, travel_cost, bidirectional,
                     notes, travel_time_manual bool DEFAULT false, created_at)
                    -- travel_time_manual: false = auto-calculated from pixel distance + terrain
species             (id, name, description, origin_location_id FK nullable, created_at)
cultures            (id, name, description, created_at)
player_characters   (id, name, player_name, species text, culture text, background, notes, image_url, visible, current_location_id FK nullable, created_at)
npcs                (id, name, species text, profession, culture text, background, disposition, notes, personality_notes text, image_url, visible, current_location_id FK nullable, created_at)
                    -- personality_notes: voice, behaviour, triggers — for character agent use
items               (id, name, description, base_price, item_type, location_id FK locations(id) nullable, created_at)
shops               (id, name, location_id FK, created_at)
shop_inventory      (id, shop_id FK, item_id FK, price_override, available, created_at)
sessions            (id, session_number, title, summary, loose_threads, faction_id FK nullable, created_at)
encounters          (id, title, location_id FK, session_id FK, status, summary, notes, created_at)
encounter_participants(id, encounter_id FK, npc_id FK nullable, label, count, role, notes, dr, created_at)
lore_entries        (id, title, category, descriptor, description, visible, major_event bool DEFAULT false, event_timestamp text, created_at)
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
lore_locations      (id, lore_id FK, location_id FK, notes, created_at)
  -- UNIQUE(lore_id, location_id); links lore entries to one or more locations

-- Map configuration tables
map_type_rules      (id, parent_type, child_types text[], color, travel_unit, distance_scale float, created_at)
  -- kept in DB but no longer used in UI; superseded by map_configs + SCALE_TYPES in mapUtils.ts
map_configs         (id, location_id FK nullable UNIQUE, map_scale text, travel_unit text, distance_scale float, created_at)
  -- one row per map level; location_id NULL = root map config
  -- map_scale: 'galaxy' | 'system' | 'body' | 'local'
  -- unique partial indexes: one root config, one per location
```

**Auth/role tables:**
```
profiles  (id FK auth.users, display_name, is_gm bool DEFAULT false, is_admin bool DEFAULT false, created_at)
settings  (key, value)  -- registration_code stored here
```
Trigger `handle_new_user()` fires on `auth.users` INSERT — creates profile, auto-sets is_gm + is_admin for `macarthur1123@gmail.com`.

**Visibility model:** `visible` boolean on most tables (GM toggles to expose to players). `revealed` boolean on `npc_facts` (per-fact granularity). `has_submap` on `locations` (per-location map drill-down). `mystery` on `locations` (shows as `???` on player map, excluded from list/detail). `gm_notes` on `locations` (GM-only text field; player portal pages use explicit column selects that omit it).

**"Unknown" convention:** `NULL` means unknown/nowhere for all location FKs. Never create a fake "Unknown" location row. UI displays `NULL` as "Unknown" or "Nomadic" depending on context.

## What has been built

`pnpm --filter gm build` passes with zero type errors.

### Pages — GM app

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
| **Map** | `/map` | `/map/[id]` (sub-map) | — |
| **Timeline** | `/lore/timeline` | — | — |

### Key features per detail page
- **Locations**: edit form, visibility toggle, mystery toggle, parent location selector, sub-locations table, shops list; name is nullable (waypoints); amber GM Notes section (gm_notes field, never shown to players)
- **NPCs**: edit form, visibility toggle, facts section with per-fact `revealed` checkbox, faction membership chips
- **Factions**: edit form, visibility toggle, parent faction selector, sub-factions table, NPC members table
- **Encounters**: edit form, status selector, linked location/session, participant table with Add Participant form
- **Sessions**: edit form, linked encounters list
- **Plot Threads**: edit form, visibility toggle, parent thread selector, child threads table
- **Items**: edit form + "Current Location" dropdown (`items.location_id`)
- **Lore**: edit form, visibility toggle, Event Timestamp + Major Event (History entries), "Linked Locations" section

### Server Actions (`apps/gm/src/lib/actions/`)
- `locations.ts` — create, update, delete, toggleVisibility, updateLocationPosition, placeLocationOnMap, removeLocationFromMap, updateLocationWaypoint, createWaypoint, toggleLocationSubmap, createMapLocation
- `connections.ts` — createLocationConnection, updateConnectionTravelTime, updateConnectionBidirectional, deleteLocationConnection
- `mapConfigs.ts` — upsertMapConfig
- `loreLocations.ts` — addLoreLocation, removeLoreLocation
- `lore.ts` — create, update, delete, toggleVisibility (includes event_timestamp, major_event)
- `items.ts` — create, update, delete (includes location_id)
- All other entities: `create*`, `update*`, `delete*`, `toggle*Visibility` (where applicable)

### Auth
Login at `/login`. `src/proxy.ts` (Next.js 16 proxy — function named `proxy`) redirects unauthenticated → `/login`, GM → `/`, player → `/play`. GM layout double-checks `is_gm`; player layout double-checks auth. Settings page requires `is_admin`.

## Node map — what's built

The map is fully implemented as a hierarchical node graph using `@xyflow/react` v12.

### Map files
- `apps/gm/src/app/(gm)/map/MapCanvas.tsx` — main canvas component (client)
- `apps/gm/src/app/(gm)/map/FloatingCircleEdge.tsx` — custom edge: straight line touching circle boundary
- `apps/gm/src/app/(gm)/map/Breadcrumb.tsx` — breadcrumb nav for sub-maps
- `apps/gm/src/app/(gm)/map/page.tsx` — root map server page
- `apps/gm/src/app/(gm)/map/[id]/page.tsx` — sub-map server page
- `apps/gm/src/lib/mapUtils.ts` — TERRAIN_MULT, PATH_MULT, TERRAIN_COLORS, TERRAIN_LIST, PATH_MODIFIER_LIST, SCALE_TYPES, calcTravelCost

### Node types
- **Named location nodes** — 48px circle, type symbol inside, name label above. Color by location type. Dashed border if `visible = false`.
- **Waypoint nodes** — 16px dot, terrain color, no label. For anonymous routing points.

### Edge behavior
- `FloatingCircleEdge` — straight line from nearest point on source circle to nearest point on target circle. No arrowheads. Label shows travel cost at midpoint.
- Travel time: auto-calculated from pixel distance ÷ distance_scale × terrain multiplier × path modifier. GM can type to override (`travel_time_manual = true`). Clearing the field recalculates.

### Map scale system
The `map_configs` table stores per-map-level config. The `map_scale` field drives which location types appear in the right-click creation menu:

| Scale | Available types |
|-------|----------------|
| `galaxy` | Sector, Star System, POI |
| `system` | World, Space Station, Star / Singularity, Planetoid, POI |
| `body` | Wilderness, Ruin, Settlement, District, Fortification, Residence, Commerce, Tavern / Inn, Place of Worship, Government, Prison, Guild / Organization, Workshop, Research / Laboratory, Medical / Healthcare, Entertainment, Transport Hub, POI |
| `local` | District, Residence, Commerce, Tavern / Inn, Place of Worship, Government, Prison, Guild / Organization, Workshop, Research / Laboratory, Medical / Healthcare, Entertainment, Transport Hub, Fortification, POI |

`local` scale: no anonymous waypoints, no submap toggles, node click always goes to detail page.

POI nodes show `descriptor` as a small subtitle below the circle.

### GM map interactions
- **Drag node** → saves position via `updateLocationPosition`
- **Right-click canvas** → creation menu: scale-appropriate type list → name input → Create. "Anonymous waypoint" option (non-local scales). "Config…" to open config panel.
- **Right-click node** → context menu: "Details" button, "Visible to Players" checkbox, "Mystery" checkbox (calls `toggleLocationMystery` — shows as `???` on player map), "Has sub-map" checkbox (calls `toggleLocationSubmap`), "Open Sub-map" button (disabled if unchecked). Hidden on local scale.
- **Left-click node** → navigates to sub-map (`/map/[id]`) if `has_submap = true`, else to `/locations/[id]`. Always `/locations/[id]` on local scale.
- **Double-click background** → navigate up one map level (or to `/map` from root)
- **Click edge** → edge panel: travel time input (auto/manual), bidirectional toggle, delete
- **Config panel** (via right-click → Config): map_scale dropdown, travel_unit, distance_scale — saved to `map_configs`
- **Unplaced sidebar** — locations with `parent_location_id` matching current map but no `map_x/y`. Click "Place" to drop on canvas.
- **Show/hide invisible** toggle — dims or hides nodes with `visible = false`
- **PNG export** button — exports current canvas view via `html-to-image`
- **New Location** button on sub-maps — links to `/locations/new?parent=[id]`

### Player portal map
- `/play/map` and `/play/map/[id]` — same visual style, read-only
- Visible locations + waypoints shown; mystery locations shown as `???` (no click-through)
- Waypoints shown on map but excluded from the player locations list and sub-locations list
- **Route planner** — "Plan Route" toggle; click nodes to build a route step by step; shows per-leg travel cost and running total; only directly connected visible nodes selectable
- Node click: same has_submap logic as GM

### Setting up a new map
1. Go to `/map` — canvas is empty
2. Right-click canvas → "Config" → set Map Scale (galaxy/system/body/local), Travel Unit, Distance Scale
3. Right-click canvas → pick a type → enter name → location is created and placed
4. Or: create locations at `/locations/new`, then use the unplaced sidebar on `/map` to drag them onto the canvas
5. To enable sub-maps: right-click a node → check "Has sub-map" → "Open Sub-map" to enter it
6. Inside the sub-map, set its own Config (scale, travel unit, distance scale)

## History Timeline

`/lore/timeline` — vertical timeline of all `lore_entries` where `category = 'History'`.
- **Major events** (`major_event = true`): large card with indigo border, title + description preview
- **Minor events**: small dot, title only
- `event_timestamp` (free text) shown as a display label (era, year, etc.) — not used for sorting; sorted by `created_at`
- "+ New Event" button links to `/lore/new?category=History`

## Categorised dropdown lists (implemented)

- **Locations** — 24 types: Sector, Star System, Star / Singularity, World, Space Station, **Planetoid**, Wilderness, Ruin, Settlement, District, Fortification, Residence, Commerce, Tavern / Inn, Place of Worship, Government, Prison, Guild / Organization, Workshop, Research / Laboratory, Medical / Healthcare, Entertainment, Transport Hub, **POI**
- **Lore & Knowledge** — 12 categories: History, Myth & Legend, Religion & Faith, Magic / Technology, Culture & Society, Politics & Law, Cosmology, Bestiary, Languages & Scripts, Artifacts & Relics, Geography & Astronomy, Economy & Trade

**Items** — needs the same treatment. Add a category dropdown (types TBD — think weapon, armour, consumable, tool, currency, relic, document, vehicle, misc) plus a Descriptor field. Confirm list with user before implementing.

## Player portal — what's built

Lives in `apps/gm/src/app/play/`. All URLs prefixed `/play/`.

### Auth flow
- Players self-register at `/register` with email + password + **access code** (validated against `settings.registration_code`)
- On registration, a `profiles` row is created (`is_gm = false`, `is_admin = false`)
- GM assigns a `player_characters` row to a player by setting `player_characters.profile_id` from the GM Settings page
- Session managed via `@supabase/ssr` cookies; `proxy.ts` enforces auth on all routes

### Pages
| Page | Route | Notes |
|------|-------|-------|
| My Character | `/play` | Character sheet + editable fields + party sidebar; multi-PC switcher persisted via `active_pc_id` cookie |
| PC detail (other) | `/play/player-characters/[id]` | Read-only sheet for another player's PC |
| Sessions list | `/play/sessions` | Summary preview strips mention tokens |
| Session detail | `/play/sessions/[id]` | GM summary + loose threads + player notes; one note per PC per session (upsert) |
| Locations list | `/play/locations` | visible + non-mystery only, filter bar |
| Location detail | `/play/locations/[id]` | sub-locations (no waypoints) + shop inventory |
| NPCs list | `/play/npcs` | visible only, filter bar |
| NPC detail | `/play/npcs/[id]` | revealed facts only; mentions rendered |
| Factions list | `/play/factions` | visible only, filter bar |
| Faction detail | `/play/factions/[id]` | visible NPC members; mentions rendered |
| Lore | `/play/lore` | tabbed: Lore / Species / Cultures, category chip filters |
| Lore detail | `/play/lore/[id]`, `/play/species/[id]`, `/play/cultures/[id]` | mentions rendered |
| Map | `/play/map`, `/play/map/[id]` | read-only node map with route planner; mystery nodes as `???` |
| (redirect) | `/play/character` | → `/play` |

### Key design decisions
- Home page (`/play`) is the character sheet, not a dashboard
- Multi-PC support: one profile can be assigned to multiple `player_characters`; `active_pc_id` cookie (`apps/gm/src/lib/activePC.ts`) tracks the selected PC across navigation, set via `PCSwitch` component
- `party_faction_id` FK on `player_characters` → `factions(id)` — GM sets per PC on the PC detail page; player portal uses it to populate the party sidebar
- Session notes: one note per PC per session (upsert); GM can edit/delete any note; players can edit their own
- `private_notes` on `player_characters` only shown on `/play` (your own sheet)
- RLS enforces all visibility and write permissions at the database level
- GMs can access `/play/*` routes using "View as Player" link in Sidebar

### @mention rendering (player portal)
Mentions in the format `[[type:id|name]]` are rendered in all detail pages using:
- `apps/gm/src/lib/mentions.tsx` — `renderMentions(text, visibleIds?)`, `stripMentions(text)`, `extractMentions(texts)`
- `apps/gm/src/lib/mentionVisibility.ts` — `buildVisibleMentionSet(supabase, texts)` — batch-queries visibility via RLS

**Visible mentions** render as colored clickable links. **Hidden mentions** render as glitch effects (block chars, noise, `REDACTED`, symbol noise) with corruption bleed into surrounding characters.

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

### 3. `Insert` must be `Partial<Omit<Row, 'id' | 'created_at'>>`
Wrapping in `Partial<>` matches Supabase codegen behaviour and allows nullable fields to be omitted.

### 4. Query result casting patterns

**Single entity fetch:**
```typescript
const { data: raw } = await supabase.from('factions').select('*').eq('id', id).single()
if (!raw) notFound()
const faction = raw as Faction
```

**List fetch:**
```typescript
const { data: rawItems } = await supabase.from('items').select('*').order('name')
const items = (rawItems ?? []) as Item[]
```

**Partial select:**
```typescript
const { data: rawData } = await supabase.from('factions').select('id, name').order('name')
const factions = (rawData ?? []) as Array<{ id: string; name: string }>
```

**Never use join aliases** (`select('*, alias:fk(field)')`): causes result type to collapse to `never`. Fetch related entities in separate queries and build lookup maps.

**Promise.all with selects** — index into results array, don't destructure:
```typescript
const results = await Promise.all([
  supabase.from('locations').select('id, name').order('name'),
  supabase.from('sessions').select('id, session_number').order('session_number'),
])
const locations = (results[0].data ?? []) as Array<{ id: string; name: string }>
const sessions  = (results[1].data ?? []) as Array<{ id: string; session_number: number }>
```

### 5. @xyflow/react v12 NodeProps
`NodeProps` does NOT have `xPos`/`yPos`. Use `positionAbsoluteX` and `positionAbsoluteY` instead.

### 6. onPaneContextMenu type
`onPaneContextMenu` expects `(event: MouseEvent | React.MouseEvent) => void` — must accept both types.

## Dice roller

Floating, minimizable dice roller widget available on all pages in both GM and player portals.

- **Files**: `apps/gm/src/components/DiceRoller.tsx`, `apps/gm/src/lib/actions/diceRolls.ts`
- **DB table**: `dice_rolls` (campaign_id, session_id nullable, rolled_by_pc_id nullable, rolled_by_name, dice_notation, individual_rolls int[], total, description, hidden bool, created_at)
- **GM mode**: uses service role; rolled_by_name = 'GM'; "Secret roll" checkbox sets `hidden=true`; GM sees all rolls including hidden (marked 🔒)
- **Player mode**: uses anon client (RLS); "Private roll (GM only)" checkbox sets `hidden=true`; players only fetch non-hidden rolls via RLS (`hidden = false` SELECT policy)
- **RLS**: service role bypasses RLS (no policy needed). Anon/authenticated users: SELECT only `hidden = false`. INSERT only if `rolled_by_pc_id` matches their own profile's PCs.
- **Recent rolls**: loaded on mount; new non-hidden rolls prepended to local state; notation/description cleared after roll

## Next steps (priority order)

1. **GM Notes on NPCs + Factions** — same pattern as `locations.gm_notes`: `gm_notes text` column, amber section in GM detail/new pages, excluded from player portal selects. NPCs especially need this for voice/behavior/triggers vs public description.
2. **Item category + descriptor** — add category dropdown (weapon, armour, consumable, tool, currency, relic, document, vehicle, misc) and Descriptor field to Items. Confirm list before implementing.
3. **Shop inventory management UI** — schema exists (`shop_inventory`), no GM UI yet for adding/editing items in a shop. Discuss design before building.
4. **Map background image** — `map_background_url` column on `map_configs` (or settings). React Flow renders it behind nodes. Workflow: place nodes → Export PNG → trace in Wonderdraft → upload art URL → nodes sit on real map.
5. **@mention Tiptap upgrade** — replace MentionTextarea with Tiptap rich-text editor; `@` triggers autocomplete across all entity types.
6. **NPC portrait / image upload** — needs Supabase Storage setup.
7. **POI-scale type list expansion** — currently uses existing location types. May want room/corridor/chamber/etc. types for dungeon/interior maps.
