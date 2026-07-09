# TTRPG Organizer — TODO

---

## To-Add
Features and functionality that need to be designed and coded.

- **Shop inventory management UI** — the `shop_inventory` schema already exists; no GM UI yet for adding, editing, or removing items from a shop. Needs design discussion before building.
- **Map background image** — `map_background_url` on `map_configs`. Canvas renders it behind nodes. Intended workflow: place nodes → export PNG → trace in Wonderdraft → upload art URL → nodes sit on the real map.
- **NPC portrait / image upload** — Supabase Storage bucket needs to be set up; then hook into the NPC detail form.
- **POI / local-scale location type expansion** — currently reuses the existing type list. Consider adding room/corridor/chamber/vault types for dungeon and interior maps.
- **@mention Tiptap upgrade** — replace the custom `MentionTextarea` with a Tiptap rich-text editor; `@` triggers autocomplete across all entity types.

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

### Ideas & seeds

*(drop raw ideas, half-formed hooks, and setting concepts here for future development)*
