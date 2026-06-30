# TTRPG Organizer — TODO

---

## To-Add
Features and functionality that need to be designed and coded.

- **Item category + descriptor** — add category dropdown (weapon, armour, consumable, tool, currency, relic, document, vehicle, misc) and a Descriptor field to the Items entity. Confirm the category list before implementing.
- **Shop inventory management UI** — the `shop_inventory` schema already exists; no GM UI yet for adding, editing, or removing items from a shop. Needs design discussion before building.
- **Map background image** — `map_background_url` on `map_configs`. Canvas renders it behind nodes. Intended workflow: place nodes → export PNG → trace in Wonderdraft → upload art URL → nodes sit on the real map.
- **NPC portrait / image upload** — Supabase Storage bucket needs to be set up; then hook into the NPC detail form.
- **Live spellcheck** — add the `spellCheck` attribute to all textarea/input fields (browser-native, free).
- **POI / local-scale location type expansion** — currently reuses the existing type list. Consider adding room/corridor/chamber/vault types for dungeon and interior maps.
- **@mention Tiptap upgrade** — replace the custom `MentionTextarea` with a Tiptap rich-text editor; `@` triggers autocomplete across all entity types.
- **Player portal — distance calculator** — show estimated travel distance from the party's current location to other locations. Needs a design pass on how "party location" is tracked before building.
- **Settings — access code management** — currently the registration code is set directly in the DB. A simple settings UI field would make this easier to manage.

---

## To-Fix
Known bugs, rough edges, or UI issues that need a fix or another pass.

- *(add issues here as they're discovered)*

---

## To-Imagine
Campaign content that needs to be fleshed out, discussed, and eventually generated. All content so far has been test data; this is where real campaign planning lives.

Before generating any content, a Campaign Bible (`CLAUDE-campaign-[name].md`) must be established in a conversation with Claude. The generation workflow is documented in `CLAUDE-generate.md`. The Bible covers: tone, genre, central conflict, 2–3 major factions and their goals, the player hook, TTRPG system, and map scale preferences.

### Active campaigns

*(none yet — add campaigns here as they're started)*

### Ideas & seeds

*(drop raw ideas, half-formed hooks, and setting concepts here for future development)*
