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

Package manager: **pnpm** with workspaces. Run `pnpm --filter gm dev` to start the GM app (port 3000). Run `pnpm --filter player dev` to start the player portal (port 3001).

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
| Node map | `@xyflow/react` v12 | Installed in both apps |
| PNG export | `html-to-image` | GM app only |

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
locations           (id, name text|null, type, descriptor, status, area, description, parent_location_id FK self,
                     image_url, visible, map_x float, map_y float, waypoint bool, terrain text,
                     path_modifiers text[], has_submap bool DEFAULT false, created_at)
                    -- name is nullable (waypoints have no name)
                    -- map_x/map_y: NULL = not placed on canvas
                    -- waypoint: true = anonymous routing dot, no name, not visible to players
                    -- has_submap: true = clicking this node on the map drills into /map/[id]
location_connections(id, from_location_id FK, to_location_id FK, travel_time, travel_cost, bidirectional,
                     notes, travel_time_manual bool DEFAULT false, created_at)
                    -- travel_time_manual: false = auto-calculated from pixel distance + terrain
species             (id, name, description, origin_location_id FK nullable, created_at)
cultures            (id, name, description, created_at)
player_characters   (id, name, player_name, species text, culture text, background, notes, image_url, visible, current_location_id FK nullable, created_at)
npcs                (id, name, species text, profession, culture text, background, disposition, notes, image_url, visible, current_location_id FK nullable, created_at)
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

**Visibility model:** `visible` boolean on most tables (GM toggles to expose to players). `revealed` boolean on `npc_facts` (per-fact granularity). `has_submap` on `locations` (per-location map drill-down).

**"Unknown" convention:** `NULL` means unknown/nowhere for all location FKs. Never create a fake "Unknown" location row. UI displays `NULL` as "Unknown" or "Nomadic" depending on context.

## What has been built — GM app

Both apps build clean (`pnpm --filter gm build` and `pnpm --filter player build` pass with zero type errors).

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
- **Locations**: edit form, visibility toggle, parent location selector, sub-locations table, shops list; name is nullable (waypoints)
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
Login page at `/login` with Supabase email/password. Middleware at `src/middleware.ts` redirects unauthenticated users to `/login`.

## Node map — what's built

The map is fully implemented as a hierarchical node graph using `@xyflow/react` v12.

### Map files
- `apps/gm/src/app/map/MapCanvas.tsx` — main canvas component (client)
- `apps/gm/src/app/map/FloatingCircleEdge.tsx` — custom edge: straight line touching circle boundary
- `apps/gm/src/app/map/Breadcrumb.tsx` — breadcrumb nav for sub-maps
- `apps/gm/src/app/map/page.tsx` — root map server page
- `apps/gm/src/app/map/[id]/page.tsx` — sub-map server page
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
- **Right-click node** → context menu: "Details" button, "Has sub-map" checkbox (calls `toggleLocationSubmap`), "Open Sub-map" button (disabled if unchecked). Hidden on local scale.
- **Left-click node** → navigates to sub-map (`/map/[id]`) if `has_submap = true`, else to `/locations/[id]`. Always `/locations/[id]` on local scale.
- **Double-click background** → navigate up one map level (or to `/map` from root)
- **Click edge** → edge panel: travel time input (auto/manual), bidirectional toggle, delete
- **Config panel** (via right-click → Config): map_scale dropdown, travel_unit, distance_scale — saved to `map_configs`
- **Unplaced sidebar** — locations with `parent_location_id` matching current map but no `map_x/y`. Click "Place" to drop on canvas.
- **Show/hide invisible** toggle — dims or hides nodes with `visible = false`
- **PNG export** button — exports current canvas view via `html-to-image`
- **New Location** button on sub-maps — links to `/locations/new?parent=[id]`

### Player portal map
- `/map` and `/map/[id]` — same visual style, read-only
- Only visible locations (`visible = true`) and connections where both endpoints are visible
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
| PC detail (other) | `/player-characters/[id]` | Read-only sheet for another player's PC |
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
| Map | `/map`, `/map/[id]` | read-only node map with route planner |
| (redirect) | `/character` | → `/` |

### Key design decisions
- Home page (`/`) is the character sheet, not a dashboard
- Multi-PC support: one profile can be assigned to multiple `player_characters`; `?pc=<id>` param switches between them
- `party_faction_id` FK on `player_characters` → `factions(id)` — GM sets per PC on the PC detail page; player portal uses it to populate the party sidebar
- Session notes: one note per PC per session (upsert); GM can edit/delete any note; players can edit their own
- `private_notes` on `player_characters` only shown on `/` (your own sheet)
- RLS enforces all visibility and write permissions at the database level

### @mention rendering (player portal)
Mentions in the format `[[type:id|name]]` are rendered in all detail pages using:
- `apps/player/src/lib/mentions.tsx` — `renderMentions(text, visibleIds)`, `stripMentions(text)`, `extractMentions(texts)`
- `apps/player/src/lib/mentionVisibility.ts` — `buildVisibleMentionSet(supabase, texts)` — batch-queries visibility via RLS

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

## Next steps (priority order)

1. **"Unknown" visibility toggle on map** — ability to mark locations as visible to players but show as "???" / unknown type. Design TBD: per-location toggle or per-map setting. Remind user when ready.
2. **Item category + descriptor** — add category dropdown (weapon, armour, consumable, tool, currency, relic, document, vehicle, misc) and Descriptor field to Items. Confirm list before implementing.
3. **Shop inventory management UI** — schema exists (`shop_inventory`), no GM UI yet for adding/editing items in a shop. Discuss design before building.
4. **Map background image** — `map_background_url` column on `map_configs` (or settings). React Flow renders it behind nodes. Workflow: place nodes → Export PNG → trace in Wonderdraft → upload art URL → nodes sit on real map.
5. **@mention Tiptap upgrade** — replace MentionTextarea with Tiptap rich-text editor; `@` triggers autocomplete across all entity types.
6. **NPC portrait / image upload** — needs Supabase Storage setup.
7. **Live spellcheck** — add `spellCheck` attribute to all textarea/input fields (browser-native).
8. **POI-scale type list expansion** — currently uses existing location types. May want room/corridor/chamber/etc. types for dungeon/interior maps.
