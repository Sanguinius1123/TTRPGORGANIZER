# CLAUDE-generate — Content Generation Guide

Rules and conventions for generating campaign content via Claude. Each section defines naming, structure, tone, and entity archetypes for a given setting type or specific universe. Always read CLAUDE.md first for the data model — this file only covers *what* to create, not *how*.

For active campaigns, a companion file `CLAUDE-campaign-[name].md` holds the campaign-specific bible: tone, factions, central conflict, TTRPG system rules and mechanics. Only load that file when generating content for that campaign. This keeps general rules separate from system-specific details.

---

## Narration

### Principles

**Short beats long.** A single well-chosen detail does more work than a paragraph of description. When in doubt, cut the last sentence — it's usually summary.

**Lead with the striking thing.** Don't build to the image; open with it. "The gates groan open" before "the caravan rolls out." The world hits first, context follows.

**Sensory over adjectival.** One physical sensation beats three descriptors. "The air tastes of smoke and iron" is better than "the dark, smoky, industrial atmosphere." What does it smell like, sound like, feel underfoot?

**Imply, don't explain.** If the implication is clear, cut the explanation. "Varn raises a hand and the column stops. For once, there's something almost like relief in her voice." — no need to add "showing that even she felt the tension of the journey."

**End on action or weight, not summary.** The last line of a narration beat should land, not wrap up. Avoid sentences that restate what just happened.

**Never recap player actions back to them.** They know what they did. Start from the consequence or reaction.

**Patterns to avoid:**
- "As you look around, you see..."
- "You can't help but notice..."
- Stacking three adjectives where one would do
- Explaining the emotional significance of a moment
- Describing what a character is thinking rather than what they do

---

### Dialogue

Every named NPC should sound like themselves and no one else. Generic dialogue — competent but interchangeable — is the failure mode.

**What makes dialogue feel like a character:**
- Sentence length. Torne speaks in short, deliberate sentences. A nervous bureaucrat rambles.
- What they don't say. A guarded character deflects, changes subject, answers a different question.
- Vocabulary. A dockworker and a diplomat don't share a register.
- Emotional tells. One character goes quiet when angry. Another gets precise. Another cracks a joke.
- What they never do. Some characters never ask for help. Some never apologize. Hold the line.

**Keep it short.** One line that feels true to the character beats three lines of naturalistic back-and-forth. Aim for the line they'd be remembered for, not the full exchange.

**Player characters are off-limits.**
Never generate PC dialogue, actions, or decisions. Never tell a player what their character does or says — not even as a suggestion during generation. It is sometimes useful to note what a PC *might* do when planning an encounter or a social scene ("the party may try to negotiate rather than fight"), but treat this as loose planning context, not prediction. Players surprise you. Leave room for it.

**Personality notes and the character agent:**

Major NPCs store a `personality_notes` field in the GM app — a private GM-only document defining how the character thinks, speaks, and behaves. It's not lore. It's a behavioral profile: speech patterns, emotional triggers, contradictions, what they lie about, how they act under pressure.

To get in-character dialogue or reactions, spawn an agent with:
- The NPC's personality notes
- The current situation (what just happened, who else is present, what's at stake for them)
- The specific ask (how do they react? what do they say? how do they deflect?)

The agent responds in character without the main conversation context cluttering its output. Use this for: reaction to a major player choice, a difficult conversation, a negotiation beat, or any moment where the character needs to feel fully present.

---

## Generation Workflow

### Campaign Bible (pre-generation, conversation only — nothing inserted)

Before generating any content for a new campaign, establish in conversation:
- Tone and genre
- Central conflict / campaign question
- 2–3 major factions and their goals
- The player hook (why does the party care?)
- TTRPG system being used and any mechanical conventions that affect content (encounter budget, faction stance labels, rest rules, etc.)
- Map scale preferences and travel unit labels

The output of this conversation is a `CLAUDE-campaign-[name].md` file committed to the repo. All subsequent generation sessions for that campaign read that file alongside CLAUDE-generate.md. General rules always apply; the campaign file adds or overrides where the setting or system requires it.

### Generation Tiers

**Tier 1 — Broad Strokes** (campaign kickoff or entering a new major area)

Fill a map level so it feels real and gives the party direction. Keep it vague enough that details can change later. No NPCs yet — too early to commit.
- 6–10 locations: names, types, one-line descriptors, placed on the map
- 2–4 factions: name, goal, disposition
- 3–5 plot threads: title and hook only
- Key lore entries if the setting history needs grounding
- Encounter seeds: note 1–2 locations where encounters feel natural (a dangerous crossing, an unstable ruin, contested territory) — no stats, just flagged as likely conflict sites

**Tier 2 — Location Flesh-Out** (standard prep unit, party heading somewhere specific)

One parent location + sub-locations, fully playable for next session.
- Parent location + 2–5 sub-locations
- 3–5 key NPCs with facts, location, faction membership
- Settlement stop content: 2 simple leads, 1 major lead, 2 exposition threads, 1 relationship thread
- 1–2 lore entries linked to the location
- Faction links
- Encounter suggestions: flag sub-locations or travel segments that feel like natural encounter sites, and note the type (combat, social, environmental hazard). Include a full encounter only if explicitly requested or if the location is clearly a conflict site (hostile outpost, active dungeon, contested zone).

**Tier 3 — Quick Fill** (party arrived unexpectedly, need something now)

Minimum viable content to run a scene. Skip or fast-track review.
- 1 location + brief description
- 2–3 NPCs, revealed facts only
- Flag if an encounter is likely; build it only if requested

### Encounters

Encounters can occur at any scale and any tier — a derelict vessel drifting between systems, a hidden cave system on a planet surface, a contested bridge on a trade road. They are not locked to a specific location type.

**During generation:** Flag natural encounter sites in the review brief. Note the type (combat ambush, environmental hazard, social confrontation, mystery/investigation) and where it fits in the location. Don't build full stat blocks in the brief — just the seed.

**When explicitly requested:** If the user asks for an encounter at a specific location or beat, include it fully in the brief with participant types, rough threat level, and the encounter's dramatic purpose. Ask if the user has a specific idea in mind before building it out — they often do.

**Encounter types to flag:**
- Hostile territory / contested zones (combat likely)
- Unknown/mysterious locations (investigation, may escalate to combat)
- Travel segments through dangerous regions (ambush, environmental)
- Social confrontations at high-tension locations (negotiation, may escalate)

The campaign file (`CLAUDE-campaign-[name].md`) holds system-specific encounter budget rules, stat block conventions, and difficulty guidance for that TTRPG.

### Review Format

For Tier 1 and Tier 2, Claude produces a structured brief before inserting anything. The user reviews, adjusts, and approves. Only then does the agent insert.

The brief covers:
- **Locations** — name, type, parent, one-line descriptor
- **Key NPCs** — name, role/profession, disposition, 2 revealed facts, 1 hidden hook
- **Factions** — name, goal, disposition, key members listed
- **Encounters** — title, location, rough participant description, threat signal
- **Plot threads** — title, type (simple/major/relationship), one-line hook
- **Lore entries** — title, category, major or minor

Not in the brief (agent fills in): map coordinates, exact travel times, minor walk-on NPCs, waypoints.

### Agent Insertion

Once the user approves the review, spawn a sub-agent (`isolation: "worktree"`) with:
- The full approved content brief
- The CLAUDE.md schema reference
- Any parent location IDs or faction IDs it needs to look up first

The agent:
1. Queries existing data to resolve parent IDs and map configs
2. Writes a temporary Node.js script using the Supabase service-role client (`NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` from `apps/gm/.env.local`)
3. Inserts in dependency order: locations → factions → NPCs → encounters → plot threads → lore
4. Places locations with rough coordinates on the appropriate map (user adjusts on canvas afterward)
5. Reports what was created with a summary, then deletes the script

---

## Story Structure

### Narrative Hierarchy

Campaign content is organized into four levels:

**Campaign Arc** — The overarching story question spanning the whole campaign. One sentence: what is the central conflict or mystery the party is moving toward?

**Story Arc** — A major narrative thread running across multiple sessions or locations. A campaign typically has 2–4 active story arcs at once. Each arc has a faction, a mystery, or a force driving it forward. Example: a hostile faction expanding its territory; an ancient secret surfacing across multiple sites.

**Sub-Arc** — A focused narrative unit playing out across one or two locations. Story arcs surface through their sub-arcs. The party encounters the arc indirectly at first (a clue, a rumor, a consequence) before they understand what they're dealing with.

**Story Thread** — The smallest unit. A single hook, clue, encounter, relationship beat, or piece of world texture. Sub-arcs are built from 2–4 story threads.

---

### Story Thread Types

**Exposition Thread**
Pure world texture. No mechanics, no reward, no pressure. Rewards curious players who engage with the setting. Can hint at larger arcs without requiring action. Never frame these as leads — they should feel ambient.

**Simple Lead**
A contained problem solvable at one location. 2–3 discovery tiers. Some have time pressure, some persist indefinitely. Resolves within the stop. Connects to sub-arcs only loosely, if at all.

**Major Lead**
A sub-arc footprint at a specific location. Full 3 discovery tiers. Higher stakes and reward. Directly connects to a story arc — completing it advances the arc. May fully resolve here or trail into a future location.

**Relationship Thread**
NPC-driven. Develops through attention and engagement rather than formal mechanics. Three-beat structure (see below). Reward is relational: trust, loyalty, a shift in how the NPC behaves toward the party.

---

### Lead Discovery Tiers

Every lead (simple or major) has 2–3 tiers of information that unlock progressively.

**Tier 1 — Surface**
What surfaces through general exploration or ambient rumor. Always includes:
- A **danger signal** embedded in fiction, not mechanical language: "easy coin," "risky job," "nobody's come back from there"
- Enough intrigue to be interesting, not enough to fully commit without more information

**Tier 2 — Deeper Intel**
Unlocked by targeting this lead specifically: a focused exploration day, buying information, or clever engagement. Adds:
- What's actually there (still in-world language)
- A scale signal: "three of them" vs "just the one, but it's big"
- A reward hint
- A time pressure flag if applicable: "she's leaving in two days"

**Tier 3 — Full Picture** (optional)
The complete situation. Available only through a second targeted day, a specific purchase, or very clever play. Removes most uncertainty before committing. Not every lead needs this tier.

**Director Notes** (never shown to players):
- Actual mechanical content: encounter stats, challenge structure
- What happens if time expires (closes, escalates, transforms, or persists)
- Whether it's soloable and at what risk
- Which story arc this connects to

---

### Relationship Thread Structure (Three-Beat)

**Beat 1 — Surface** (free, woven into narration)
A small observable detail about a specific NPC. Delivered without framing it as a lead — it should feel like ambient world texture. Players who notice and engage move toward Beat 2.

Delivery points: camp descriptions, travel narration, arrival at a meaningful location, how an NPC reacts after an encounter.

**Beat 2 — Thread** (requires engagement)
Surfaces when a player talks to the NPC, asks questions, or follows up on Beat 1. The actual situation emerges: what the NPC needs, fears, is hiding, or is dealing with. Delivered through roleplay, not a formal investigation mechanic.

**Beat 3 — Lead** (player-driven)
Only becomes a full lead if players choose to pursue it. Connects to mechanical content if appropriate. Reward is relational rather than material.

**Short threads** (1–2 stops): Beat 1 during travel, Beat 2 at the next stop, Beat 3 resolves there or the stop after.

**Long threads** (many stops): Beat 1 surfaces early in the campaign. Beat 2 takes several stops of small interactions. Beat 3 arrives only when a specific location, event, or player push triggers it. Good for named recurring NPCs.

---

### Settlement Stop Content Formula

Each settlement stop contains a consistent set of content. Scale and detail change per location; the skeleton is the same.

| Content | Quantity | Time Pressure | Surfaces Via |
|---|---|---|---|
| Simple leads | 2 | Some yes, some no | Exploration / rumor |
| Major lead | 1 | Usually yes | Exploration / caravan NPC |
| Exposition threads | 2 | No | Ambient, exploration |
| Relationship thread | 1 per journey leg | Varies | NPC interaction, narration |

**Days available:** Variable per stop (roll or set on arrival). Players allocate days to: Rest (full downtime), Explore/Carouse (general investigation → surfaces leads), or Follow a Lead (pursue a specific thread, 1–2 days depending on scope).

**Targeting a known lead:** If a player spends their Explore day on a specific lead rather than exploring broadly, they get the next discovery tier for that lead instead of a fresh rumor.

---

### Prep Questions per Location

Answer these in order to generate a stop's content from scratch.

**Location character:**
1. What is this place's single most distinctive physical feature?
2. What does this place need from the outside world (import)?
3. What does this place produce or offer (export)?
4. Who holds power here, and what do they want?
5. What is this place afraid of?

**Lead generation:**
1. What local problem exists that outsiders could solve but locals can't or won't?
2. What does someone here desperately want that they can't get through normal means?
3. Which active story arc has a visible footprint here — and what does it look like from the ground?

**Exposition thread generation:**
1. What does a typical day look like for a resident here?
2. What is one small human moment that captures this settlement's character?

**Relationship thread generation:**
1. Which NPC is due for a beat in their arc?
2. Does anything about this location connect to that NPC's history or situation?
3. What is the smallest observable detail that could open Beat 1 naturally?

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
1. Which universe/section applies (or describe the tone if original)
2. Which generation tier (Broad Strokes / Flesh-Out / Quick Fill)
3. The parent location or map level to generate into
4. Any specific NPCs, factions, or plot hooks that must appear
5. Any tone notes or constraints for this specific session

Example — flesh-out:
> "Flesh out Karath Station using the sci-fi section. Body scale. Parent is the Velos System. The Sutured faction has a presence here. Party is arriving to trade and resupply."

Example — broad strokes:
> "Generate a broad strokes pass for a new fantasy region. Galaxy scale. Tone: dark, post-collapse. Central conflict: the old empire collapsed a generation ago and three factions are filling the void."
