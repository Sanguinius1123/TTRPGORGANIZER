# CLAUDE-generate — Content Generation Guide

Rules and conventions for generating campaign content via Claude. Each section defines naming, structure, tone, and entity archetypes for a given setting type or specific universe. Always read CLAUDE.md first for the data model — this file only covers *what* to create, not *how*.

---

## General Rules (all settings)

### Map hierarchy
Always use the correct scale chain. Content that skips levels will break submap navigation:
- `galaxy` → Sectors, Star Systems, POIs
- `system` → Worlds, Space Stations, Stars, Planetoids, POIs
- `body` → Wilderness, Ruins, Settlements, Districts, Fortifications, etc.
- `local` → Interior locations (rooms, shops, offices, chambers)

Every location with `has_submap = true` must have child locations placed on that submap with `map_x`/`map_y` set and a matching `map_configs` row.

### Visibility defaults
- Named locations players should discover: `visible = true`
- Hidden/secret locations: `visible = false`
- Locations that exist but are mysterious: `visible = true`, `mystery = true`
- Waypoints (routing only, no name): `waypoint = true`, `visible = false`

### NPC structure
Every NPC should have:
- At least 2 revealed facts (things players can learn on first meeting)
- At least 1 hidden fact (something to discover later)
- A `current_location_id` placing them somewhere
- A faction membership if they belong to one

### Faction structure
Every faction should have:
- A clear `goal` (one sentence: what do they want?)
- A `disposition` toward outsiders: `friendly` / `neutral` / `cautious` / `hostile` / `unknown`
- At least one location via `faction_locations`
- At least one NPC member via `npc_factions`

### Lore structure
- History entries: use `major_event = true` for world-shaping events, `event_timestamp` for era labels
- Link lore to relevant locations via `lore_locations`
- Mix revealed (`visible = true`) and hidden (`visible = false`) entries

---

## Sci-Fi Settings

### Scale mapping
| Real concept | App scale | App type |
|---|---|---|
| Galaxy / sector of space | galaxy | Sector |
| Solar system | galaxy (node) + system (submap) | Star System |
| Planet / moon | system (node) + body (submap) | World / Planetoid |
| City / region on planet | body (node) + local (submap) | Settlement / District |
| Interior of a building | local (node) | Commerce / Government / etc. |

### Naming conventions (generic sci-fi)
- Systems: celestial + Latin suffix (Verath Prime, Kelos IV, The Reach)
- Stations: functional + identifier (Crucible Station, Waypost Gamma)
- Settlements: founding concept + suffix (Ironhold, New Verath, The Cradle)
- Ships/stations as locations: treat as Space Station type

### Faction archetypes
- Corporate conglomerate (neutral/hostile, profit-driven)
- Colonial government (cautious, order-driven)
- Resistance / insurgency (hostile to power, survival-driven)
- Religious order (unknown/cautious, belief-driven)
- Criminal syndicate (cautious, control-driven)

---

## Fantasy Settings

### Scale mapping
| Real concept | App scale | App type |
|---|---|---|
| Continent / region | galaxy | Sector |
| Kingdom / large territory | galaxy (node) + system (submap) | Star System → repurpose as "Region" |
| Wilderness / points of interest | system (node) | POI, Wilderness, Ruin |
| Town / dungeon | body (node) + body (submap) | Settlement, Ruin |
| Interior (inn, castle, dungeon level) | local (node) + local (submap) | Tavern / Inn, Fortification, etc. |

> Note: the galaxy/system/body/local labels are UI-only — a "Star System" node can represent a kingdom, a "World" can represent a city. Rename travel units to `days`, `hours`, `rooms` as appropriate.

### Naming conventions (generic fantasy)
- Settlements: evocative compound nouns (Ashenveil, Greymoor, Thornwick)
- Ruins: descriptive + "of" phrasing (Ruins of Caer Dûn, The Sunken Citadel)
- Wilderness: terrain + mood (The Blighted Fen, Stormreach Peaks)
- NPCs: short, pronounceable, no apostrophes

### Faction archetypes
- Ruling noble house (neutral/cautious, legacy-driven)
- Merchant guild (friendly, profit-driven)
- Thieves' guild / underground (cautious, survival-driven)
- Religious institution (cautious/hostile, doctrine-driven)
- Arcane order / academy (neutral, knowledge-driven)
- Monster tribe / warband (hostile, territory-driven)

---

## Specific Universes

### Warhammer 40,000

**Tone:** Grimdark. Authoritarian, decaying, zealous. No optimism without irony.

**Map scale usage:**
- galaxy: Sectors of the Imperium, Warp anomalies
- system: Star systems with hive worlds, forge worlds, death worlds
- body: Hive cities, fortresses, agri-worlds, void stations
- local: Hive underhives, manufactorums, temples of the Ecclesiarchy

**Naming conventions:**
- Planets: Latin/Gothic compound (Vraks III, Cadia, Fenris, Mordian)
- Hive cities: Imperial and grandiose (Hive Primus, Hive Secundus, Hive Infernus)
- NPCs: Gothic names, Imperial ranks matter (Inquisitor Vayne, Commissar Stern)
- Avoid: modern words, anything that sounds cheerful

**Faction archetypes:**
- Adeptus Mechanicus (neutral/cautious, dogma-driven, hoards technology)
- Planetary Defense Force (friendly to party, order-driven)
- Inquisition (unknown, paranoia-driven — ally or threat depending on context)
- Chaos Cult (hostile, hidden initially)
- Rogue Trader house (cautious, profit-driven, operates in grey areas)
- Criminal underclass / Guilders (cautious, survival-driven)

**Lore categories to populate:**
- History: Great Crusade events, local wars, heresies
- Religion & Faith: Imperial Cult doctrine, local saint cults
- Politics & Law: Imperial hierarchy, local governance
- Bestiary: Xenos threats, Chaos mutations

---

### Star Wars–Style (Space Opera)

**Tone:** Heroic adventure with moral grey zones. Hope vs. oppression. Diverse alien species.

**Map scale usage:**
- galaxy: Sectors and regions (Outer Rim, Core Worlds)
- system: Named star systems (Tatooine System, Coruscant System)
- body: Planets, moons, orbital stations
- local: Cantinas, imperial bases, rebel safehouses, spaceports

**Naming conventions:**
- Planets: Short, punchy, often alien-sounding (Nar Shaddaa, Dantooine)
- NPCs: Mix human names with alien cadences (Jek Porkins, Cad Bane style)
- Factions: Clear allegiance names (The Dominion, The Free Compact)
- Avoid: real-world Earth references

**Faction archetypes:**
- Galactic authority / Empire analog (hostile/cautious, control-driven)
- Rebel alliance analog (friendly, freedom-driven)
- Hutt-style crime syndicate (neutral/cautious, profit-driven)
- Jedi/Force order analog (neutral, tradition-driven)
- Bounty hunter guild (neutral, contract-driven)
- Local planetary government (cautious, self-preservation-driven)

**Lore categories to populate:**
- History: Rise of the Empire analog, ancient wars, lost orders
- Myth & Legend: Force mythology, ancient civilisations
- Politics & Law: Imperial law, senate history, rebellion origins
- Bestiary: Alien species encountered

---

## How to invoke generation

When asking Claude to generate content for a specific setting, reference this file and specify:
1. Which universe/section applies
2. Map level to generate (e.g. "generate a body-scale map for a hive city")
3. How many NPCs / factions / lore entries
4. Any specific plot hooks or tone notes

Example prompt:
> "Generate a body-scale settlement using the 40k section of CLAUDE-generate.md. It should be a hive city underhive with 6 local locations, 4 NPCs, 2 factions, and 3 lore entries. The party just arrived as refugees."
