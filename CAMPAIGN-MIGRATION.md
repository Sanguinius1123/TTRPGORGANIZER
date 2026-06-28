# Multi-Campaign Migration Plan

## Design decisions (confirmed)
- Species and cultures are **per-campaign** (not shared). An "Elf" in a fantasy campaign and an "Elf" in a sci-fi campaign are different entities.
- Active campaign stored in a **cookie** (`active_campaign_id`) on the GM side.
- Player portal derives campaign **from the selected PC's `campaign_id`** — no separate cookie needed.
- Campaign switcher lives on the **GM dashboard** (top-center dropdown) and in the **sidebar** (compact, always visible).
- Existing data migrates into a campaign called **"Test Campaign"** in a single migration.
- Entities can be **duplicated** into another campaign (or the same one) via a duplicate action on detail pages.

---

## 1 — Database migration

### New table
```sql
CREATE TABLE campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### Tables that get `campaign_id` (direct column)
These are the 12 root-level game entities. Junction/relationship tables inherit via FK and do NOT get a column.

| Table | Notes |
|---|---|
| `factions` | |
| `locations` | |
| `npcs` | |
| `player_characters` | drives player portal campaign context |
| `species` | per-campaign (user decision) |
| `cultures` | per-campaign (user decision) |
| `items` | |
| `shops` | |
| `sessions` | |
| `encounters` | |
| `lore_entries` | |
| `plot_threads` | |

### Tables that inherit campaign (no column added)
| Table | Inherits via |
|---|---|
| `location_connections` | `from_location_id` / `to_location_id` (both must be same campaign) |
| `map_configs` | `location_id FK` |
| `npc_facts` | `npc_id FK` |
| `npc_factions` | `npc_id FK` |
| `npc_locations` | `npc_id FK` |
| `pc_factions` | `pc_id FK` |
| `faction_relationships` | `from_faction_id FK` |
| `faction_locations` | `faction_id FK` |
| `culture_locations` | `culture_id FK` |
| `lore_locations` | `lore_id FK` |
| `session_plot_threads` | `session_id FK` |
| `session_notes` | `session_id FK` |
| `encounter_participants` | `encounter_id FK` |
| `shop_inventory` | `shop_id FK` |
| `character_relationships` | `from_npc_id` / `from_pc_id FK` |

### Tables with no campaign (global/auth)
`profiles`, `settings`

### Migration steps (single SQL file)
```sql
-- 1. Create campaigns table
CREATE TABLE campaigns ( ... );

-- 2. Seed Test Campaign
INSERT INTO campaigns (id, name) VALUES ('00000000-0000-0000-0000-000000000001', 'Test Campaign');

-- 3. Add nullable campaign_id to all 12 entity tables
ALTER TABLE factions ADD COLUMN campaign_id uuid REFERENCES campaigns(id);
-- ... repeat for all 12 ...

-- 4. Backfill all existing rows
UPDATE factions    SET campaign_id = '00000000-0000-0000-0000-000000000001';
-- ... repeat ...

-- 5. Set NOT NULL
ALTER TABLE factions ALTER COLUMN campaign_id SET NOT NULL;
-- ... repeat ...

-- 6. Add indexes for filtering performance
CREATE INDEX ON factions    (campaign_id);
CREATE INDEX ON locations   (campaign_id);
-- ... etc ...
```

---

## 2 — `packages/db/src/types.ts`

Add `campaigns` table to the `Tables` block.
Add `campaign_id: string` to the `Row` (and `Insert`) of all 12 entity tables.

---

## 3 — Campaign server actions (new file)

`apps/gm/src/lib/actions/campaigns.ts`:
- `createCampaign(name, description)` → insert + revalidate
- `getCampaigns()` → list all (used in sidebar + dashboard)
- `duplicateEntity(entityType, entityId, targetCampaignId)` → copies main row (new UUID, same data, new campaign_id) + copies relevant junction rows

---

## 4 — Active campaign cookie

`apps/gm/src/lib/activeCampaign.ts` (new utility):
- `getActiveCampaignId(cookieStore)` → reads `active_campaign_id` cookie; returns string or null
- `setActiveCampaignId(cookieStore, id)` → sets cookie

Used in:
- GM layout: read cookie, pass `campaignId` to pages via RSC props or a layout-level fetch
- Dashboard: render campaign switcher
- All new/create pages: read cookie to inject into form or action call

If cookie is missing, GM layout redirects to `/` (dashboard) to choose a campaign.

---

## 5 — GM Dashboard (`apps/gm/src/app/(gm)/page.tsx`)

Current: shows entity counts across all data.

Changes:
- Top-center: `<CampaignSwitcher>` — dropdown of all campaigns + "New Campaign" button
- All 9 count queries gain `.eq('campaign_id', activeCampaignId)`
- "New Campaign" button → inline form (name + description) → `createCampaign()` action

---

## 6 — Sidebar (`apps/gm/src/components/Sidebar.tsx`)

Add compact campaign indicator at the very top (below the app title):
- Shows current campaign name
- Click → navigates to `/` (dashboard) to switch

---

## 7 — Server actions: add `campaign_id` to creates

All create actions need `campaign_id` passed in. Pattern:
```typescript
// In new/page.tsx — pass campaign_id as hidden field or read from cookie in action
export async function createFaction(formData: FormData) {
  const campaignId = formData.get('campaign_id') as string
  const supabase = db()
  const { error } = await supabase.from('factions').insert({
    campaign_id: campaignId,
    name: ...,
    ...
  })
}
```

Actions that need updating:
`createFaction`, `createLocation`, `createWaypoint`, `createMapLocation`, `createNpc`,
`createPlayerCharacter`, `createEncounter`, `duplicateEncounter`, `createSession`,
`createPlotThread`, `createLoreEntry`, `createItem`, `createSpecies`, `createCulture`

---

## 8 — GM list pages (9 files)

Each gets `.eq('campaign_id', activeCampaignId)` on its primary table query.
The `activeCampaignId` is read from cookie in the server component.

Files:
- `(gm)/factions/page.tsx`
- `(gm)/locations/page.tsx`
- `(gm)/npcs/page.tsx`
- `(gm)/player-characters/page.tsx`
- `(gm)/encounters/page.tsx`
- `(gm)/sessions/page.tsx`
- `(gm)/plot-threads/page.tsx`
- `(gm)/lore/page.tsx`
- `(gm)/items/page.tsx`

Also: dropdown selectors on all new/detail pages (e.g. parent location picker, faction picker) must filter by same campaign.

---

## 9 — GM detail pages (12 files)

Primary entity fetch stays by ID (already unique). No campaign filter needed on the primary
fetch — but all **related entity dropdowns** (e.g. "move NPC to location" picker, "link to faction" picker)
must filter by `campaign_id` to avoid cross-campaign data leaking into selectors.

Species/cultures dropdowns on NPC/PC pages must also filter by campaign.

---

## 10 — GM new/create pages (11 files)

Add `<input type="hidden" name="campaign_id" value={activeCampaignId} />` to each form.
All entity-picker dropdowns (parent location, faction, etc.) filter by campaign.

Files:
- `(gm)/factions/new/page.tsx`
- `(gm)/locations/new/page.tsx`
- `(gm)/npcs/new/page.tsx`
- `(gm)/player-characters/new/page.tsx`
- `(gm)/encounters/new/page.tsx`
- `(gm)/sessions/new/page.tsx`
- `(gm)/plot-threads/new/page.tsx`
- `(gm)/lore/new/page.tsx`
- `(gm)/items/new/page.tsx`
- `(gm)/species/new/page.tsx`
- `(gm)/cultures/new/page.tsx`

---

## 11 — Map pages

`(gm)/map/page.tsx` and `(gm)/map/[id]/page.tsx`:
- Add `.eq('campaign_id', activeCampaignId)` to locations query
- Connections and map_configs inherit — no change there
- `createWaypoint`, `createMapLocation` actions get campaign_id from page context

---

## 12 — Duplicate entity feature

On each entity detail page, add a "Duplicate" button (dropdown if multiple campaigns exist):
- Calls `duplicateEntity(type, id, targetCampaignId)`
- Action copies: main row (new UUID, `campaign_id = target`) + copies junction rows where campaign is implied by this entity (e.g. npc_facts, npc_factions for an NPC)
- After duplication, navigates to the new entity's detail page

---

## 13 — Player portal pages (17 files under `play/`)

### How campaign derives
1. Selected PC ID comes from `?pc=` search param (or `active_pc_id` cookie via `PCSwitch`)
2. Fetch PC row: `select('id, campaign_id, ...').eq('id', pcId).single()`
3. All subsequent queries on the page use `campaignId = pc.campaign_id`

### Files that need campaign filter added
All pages under `apps/gm/src/app/play/` that query campaign-aware tables:
- `play/page.tsx` (character sheet + party sidebar)
- `play/factions/page.tsx` and `[id]/page.tsx`
- `play/locations/page.tsx` and `[id]/page.tsx`
- `play/npcs/page.tsx` and `[id]/page.tsx`
- `play/sessions/page.tsx` and `[id]/page.tsx`
- `play/lore/page.tsx`, `[id]/page.tsx`, `timeline/page.tsx`
- `play/map/page.tsx` and `[id]/page.tsx`
- `play/player-characters/[id]/page.tsx`
- `play/plot-threads/[id]/page.tsx`

### Files that don't need campaign filter
- `play/character/CharacterForm.tsx` — loads species/cultures, which are per-campaign but already derived from the PC's campaign

---

## 14 — Middleware (`apps/gm/src/proxy.ts`)

No structural changes needed. Campaign validation happens at the layout level (redirect to dashboard if no active campaign cookie), not in middleware.

---

## Implementation order

1. SQL migration (campaigns table + campaign_id columns + backfill + indexes)
2. `packages/db/src/types.ts` — add campaigns + campaign_id fields
3. `lib/activeCampaign.ts` utility + `actions/campaigns.ts`
4. GM layout: read cookie, redirect if missing
5. Dashboard: campaign switcher + New Campaign form
6. Sidebar: compact campaign indicator
7. All 14 create actions: add campaign_id param
8. All 9 list pages: add campaign filter
9. All 11 new/create pages: hidden campaign_id field + filter dropdowns
10. All GM detail page dropdowns: filter by campaign
11. All 17 player portal pages: derive campaign from PC
12. Duplicate entity action + UI on detail pages
13. Map pages: campaign filter on locations query

**Total scope:** 1 new table, 12 altered tables, 2 new utility files, ~14 action changes, ~40 page changes, 1 new component (CampaignSwitcher).
