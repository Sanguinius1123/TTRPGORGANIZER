# TTRPG Organizer — TODO

---

## To-Add
Features and functionality that need to be designed and coded.

- **Item category + descriptor** — add category dropdown (weapon, armour, consumable, tool, currency, relic, document, vehicle, misc) and a Descriptor field to the Items entity. Confirm the category list before implementing.
- **Shop inventory management UI** — the `shop_inventory` schema already exists; no GM UI yet for adding, editing, or removing items from a shop. Needs design discussion before building.
- **Map background image** — `map_background_url` on `map_configs`. Canvas renders it behind nodes. Intended workflow: place nodes → export PNG → trace in Wonderdraft → upload art URL → nodes sit on the real map.
- **NPC portrait / image upload** — Supabase Storage bucket needs to be set up; then hook into the NPC detail form.
- **POI / local-scale location type expansion** — currently reuses the existing type list. Consider adding room/corridor/chamber/vault types for dungeon and interior maps.
- **@mention Tiptap upgrade** — replace the custom `MentionTextarea` with a Tiptap rich-text editor; `@` triggers autocomplete across all entity types.
- **Shared dice roller** — real-time dice rolling visible to all players and the GM. Needs design: live (WebSocket/Supabase Realtime) vs. session-logged (rolls stored in DB and shown on session page). Could live as a floating widget or a dedicated page. Decide whether rolls are ephemeral or persistent before building.

---

## To-Fix
Known bugs, rough edges, or UI issues that need a fix or another pass.

- **Content generation — @mention references** — when Claude generates content that refers to an already-existing entity (a location, NPC, faction, etc.), it should use the `[[type:id|name]]` mention syntax rather than plain text. The insertion agent needs to resolve existing entity IDs and wire up references before inserting.

---

## To-Imagine
Campaign content that needs to be fleshed out, discussed, and eventually generated. All content so far has been test data; this is where real campaign planning lives.

Before generating any content, a Campaign Bible (`CLAUDE-campaign-[name].md`) must be established in a conversation with Claude. The generation workflow is documented in `CLAUDE-generate.md`. The Bible covers: tone, genre, central conflict, 2–3 major factions and their goals, the player hook, TTRPG system, and map scale preferences.

### Active campaigns

- **Sci-fi campaign (unnamed)** — ideas and notes exist in conversation but no Campaign Bible yet. Next step: sit down and convert existing thoughts into a `CLAUDE-campaign-scifi.md` file, then begin Tier 1 broad-strokes generation. Setting is original sci-fi; system TBD.

### Ideas & seeds

*(drop raw ideas, half-formed hooks, and setting concepts here for future development)*
