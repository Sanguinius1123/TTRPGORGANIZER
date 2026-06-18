# TTRPG Organizer — Claude context

## What this project is

A campaign management tool for a Draw Steel TTRPG campaign called **The Convergence** — a dystopian setting where multiple worlds collided and merged. The GM needs structured, queryable data (not prose files) to manage NPCs, locations, factions, items, shops, and session notes. A separate read-only player portal shows only what the GM has explicitly revealed.

## Repo structure

```
TTRPGorganizer/
  apps/
    gm/          # Next.js — private GM app, full read/write
    player/      # Next.js — public player portal, read-only (not yet created)
  packages/
    db/          # Supabase client + generated TypeScript types (currently empty)
  CLAUDE.md
  package.json   # pnpm workspace root
  pnpm-workspace.yaml
```

Package manager: **pnpm** with workspaces. Run `pnpm --filter gm dev` to start the GM app.

## Tech stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | Next.js (App Router) | Both apps |
| Styling | Tailwind CSS v4 | Already in gm app |
| Language | TypeScript | Strict |
| Database | Supabase (Postgres) | User already has a project |
| Auth | Supabase Auth | Single GM account only |
| Deployment | Vercel | Player portal; GM app can stay local |
| Package manager | pnpm | Workspaces |

## Database schema

All tables live in Supabase (Postgres). Schema not yet created — write migrations when ready.

```sql
npcs          (id, name, origin_world, role, disposition, notes)
npc_facts     (id, npc_id FK, fact_text, revealed boolean)
locations     (id, name, type, status, origin_world_notes, description)
              -- leave room for optional x, y columns later (map pin positions)
factions      (id, name, disposition, goal, description)
items         (id, name, description, base_price, item_type)
shops         (id, name, location_id FK)
shop_inventory(id, shop_id FK, item_id FK, price_override, available boolean)
sessions      (id, session_number, title, summary, loose_threads)
lore_entries  (id, title, category, description)
```

**Visibility model:** simple boolean toggle. `revealed` on `npc_facts` (per-fact granularity — some facts about an NPC are public, others are secret). `visible` on other tables as needed. The GM toggles these manually from the GM app. No session-number-based reveal tracking for now.

## Key design decisions and why

**Supabase over SQLite-in-repo:** The player portal is deployed online. Both the GM's local dev environment and the live deployed site need concurrent read/write access. SQLite in a git repo can't support that (no concurrent writers, no persistent writable disk on most deploy targets).

**Relational DB over flat Markdown files / wiki:** NPCs need per-fact visibility toggling (not whole-file). Locations have shops; shops have items; the same item can have different price/availability per location — that's inherently relational. The user tried World Anvil and Obsidian; purely manual organization was unwieldy. The value Claude adds is structured search and retrieval ("what NPCs know about X", "what's been revealed to players so far"), which requires queryable tables.

**Two separate apps (gm + player), same Supabase project:** Clear separation of concerns. The GM app has service-role access and full CRUD. The player portal uses the anon key and reads only rows where `visible = true` / `revealed = true`. Both share the `packages/db` client.

**Per-fact NPC visibility (npc_facts table) over whole-NPC visibility:** A single NPC might have some facts known to players and others that are secret. A `visible` boolean on the `npcs` row would force all-or-nothing. The `npc_facts` junction table solves this.

**`shop_inventory` junction table over embedding items in shops:** The same item (e.g., a longsword) can appear in multiple shops at different prices and availability. A junction table with `price_override` and `available` lets the same `items` row be reused across locations without duplication.

**Map as node graph first, image map later:** Start with a simple list/node display of locations. The user plans to overlay a real map image and add pin positions later. The schema leaves room for optional `x, y` columns on `locations` — don't add them until the image map feature is being built.

**No polish until structure works:** Player portal should be functional first. NPC portraits, background art, etc. come after the data layer is solid.

## What to build first (agreed approach)

First end-to-end slice: **locations + shops + shop_inventory** wired up GM-side (create/edit locations and shops) and player-side (read-only view of locations and their current shop inventory). This validates the full pattern — Supabase schema, `packages/db` client, GM CRUD UI, player read-only view — before building out NPCs, factions, etc.
