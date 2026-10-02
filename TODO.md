# TTRPG Organizer — TODO

---

## Done ✓

- **GM Notes on all player-visible entities** — `gm_notes text` on npcs, factions, sessions, lore_entries, plot_threads, species, cultures, player_characters. Amber GM-only section on detail/new pages. Excluded from all player portal selects.
- **Item category + descriptor** — `category`, `descriptor`, `properties jsonb`. 9 categories (weapon, armour, consumable, tool, valuables, relic, document, vehicle, misc) with per-category fields. Legacy `item_type` removed. Visibility flag wired up.

---

## To-Add
Features and functionality that need to be designed and coded.

- **Shop inventory management UI** — the `shop_inventory` schema already exists; no GM UI yet for adding, editing, or removing items from a shop. Needs design discussion before building.
- **Job board entity** — new entity type for the Sword & Sorcery campaign's two-board system (official + tavern). Fields needed: source (official/tavern), section (contract/lead-rumor), status (open/completed/expired/failed), deadline, reward, difficulty signal, posted-by (NPC or PC name), notes. GM creates/manages entries; players see open ones. Time-marked entries should show urgency clearly. Completed/expired entries stay visible as historical record with resolution notes. Discuss schema design before building.
- **Map background image** — `map_background_url` on `map_configs`. Canvas renders it behind nodes. Intended workflow: place nodes → export PNG → trace in Wonderdraft → upload art URL → nodes sit on the real map.
- **NPC portrait / image upload** — Supabase Storage bucket needs to be set up; then hook into the NPC detail form.
- **POI / local-scale location type expansion** — currently reuses the existing type list. Consider adding room/corridor/chamber/vault types for dungeon and interior maps.
- **@mention Tiptap upgrade** — replace the custom `MentionTextarea` with a Tiptap rich-text editor; `@` triggers autocomplete across all entity types.
- **PC notes on locations** — a notes section on the right side of the location detail page (both GM and player `/play/locations/[id]` views). Players can post notes about a location; all players and the GM see every note (shared, not private — different from `player_characters.private_notes`). Only the GM or the note's original author can edit/delete a given note. GM should also be able to post a note "as" an NPC — attributed to an NPC name instead of a player — still player-visible, useful for leaving in-character messages/warnings tied to a place. Likely needs a new `location_notes` table (location_id FK, author type pc/npc, author_pc_id FK nullable, author_npc_id FK nullable, note_text, created_at) with RLS modeled on the existing `session_notes` pattern (GM edits/deletes any note via service role; players edit/delete only their own via `author_pc_id` matching one of their PCs). Not yet designed in detail — needs a dedicated pass before building.

---

## To-Fix
Known bugs, rough edges, or UI issues that need a fix or another pass.

- **Content generation — @mention references** — when Claude generates content that refers to an already-existing entity (a location, NPC, faction, etc.), it should use the `[[type:id|name]]` mention syntax rather than plain text. The insertion agent needs to resolve existing entity IDs and wire up references before inserting.

---

## To-Imagine
Campaign content that needs to be fleshed out, discussed, and eventually generated. All content so far has been test data; this is where real campaign planning lives.

Before generating any content, a Campaign Bible (`CLAUDE-campaign-[name].md`) must be established in a conversation with Claude. The generation workflow is documented in `CLAUDE-generate.md`. The Bible covers: tone, genre, central conflict, 2–3 major factions and their goals, the player hook, TTRPG system, and map scale preferences.

### Active campaigns

- **Sci-fi campaign (Foxtrot Cluster)** — Campaign Bible complete (`CLAUDE-campaign-scifi.md`). Tier 1 content generated: 10 factions, 23+ locations (Holt System + planets + Songah districts + Mem surface), 8 NPCs, 5 lore entries. All visible=false. Mem surface fleshed out: Legion Outpost (military stronghold), The Holding Block (prison/labor camp), and 3 Harvest Platforms (Tol-Yan, Sel-Arak, Vur-Keth). Ocean terrain set on all Mem bodies so travel times calculate correctly. Next steps: place locations on the map (Holt System scale then Sonhandra/Mem scale), generate Tier 2 content (encounters, more NPCs, items, sessions), and write the Session 1 train heist encounter.

- **Sword & Sorcery campaign** — Campaign Bible drafted (`CLAUDE-campaign-swordandsorcery.md`). Living document — vision still being refined. Core established: west marches structure, competent-mortality tone, post-war world with three diminished empires, the Precursors as ancient prior civilization, six settlements (all TBD names), the Ash Compact (inquisition) vs. cults tension, creature design philosophy + 11 creature sketches, four crisis types, reactive world principle, character background categories, five non-human peoples (time-displaced, plant-people, stone-beings, prey-kin, fungal greenskins), two-board job system (official + tavern with open contracts / leads & rumors sections, time markers, snooze-you-lose), GM structure (harm ladder, faction clocks as partially-visible sequences, organic world flow), company model + Captain Harren, session one scenario (the ambush, the trunk, Casvin). Open: all proper names, ruleset, religion (dedicated discussion needed), map planning (dedicated session), sorcerer-lord's secret, Precursor endgame.

- **Bump in the Dark campaign ("Welcome To Corvid Cove")** — Forged in the Dark horror one-shot/open-table campaign, coastal Pacific Northwest town. Campaign Bible complete (`CLAUDE-campaign-bumpinthedark.md`), PDF page index at `BID-pdf-index.md`. Fully fleshed: setting (Corvid Cove, formerly Sable Cove, isolation mechanics, tourist boom), "the dark" (deliberately unnamed antagonist, GM-only), five-era layered history (1817-19 founding/deal, mid-1850s massacre, 1903 rename, 1918-19 Grey Fever, 1943 shipwreck, 1980s serial killer), six anchor POIs + 4 outdoor locations + hidden cave system, 7 town-scale factions + Town Services, Season One episode menu + Town Ledger mechanic. Live campaign created in-app (id `45308364-5f74-4654-b474-e461daf80bbd`). Build-out in progress: entries created one at a time with user review before each insert (workflow: draft in chat → approve → insert directly via Supabase REST, since no browser session is available). Done so far: Corvid Cove (the town, Settlement, `has_submap=true`). Next: the six POIs, starting with Harbor Square, then outdoor locations, then placing everything on a `local`-scale map, then factions/NPCs.

### Ideas & seeds

*(drop raw ideas, half-formed hooks, and setting concepts here for future development)*
