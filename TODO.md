# TTRPG Organizer — TODO

---

## To-Add
Features and functionality that need to be designed and coded.

- **Item category + descriptor** — add category dropdown (weapon, armour, consumable, tool, currency, relic, document, vehicle, misc) and a Descriptor field to the Items entity. Confirm the category list before implementing.
- **Shop inventory management UI** — the `shop_inventory` schema already exists; no GM UI yet for adding, editing, or removing items from a shop. Needs design discussion before building.
- **GM dashboard — campaign panel** — when a campaign is active, show campaign name + editable description at the top of the dashboard. Consider additional campaign-level fields (status, system, tone, start date?). Shrink the entity count/list blocks significantly — they don't need to dominate the screen.
- **Player dashboard — right panel** — currently empty. Top right should show the active campaign name + description. Below that: quick links to the most recent session, the one before it, and the next upcoming session.
- **"Watch" system** — eye icon/button on NPC, faction, location, and lore detail pages. A PC can mark things they want to remember or pursue. Watched items appear on a personal "Quick List" page in the player portal. GM side: one page per campaign listing all player characters and what each is watching, so the GM can see overlap and player intent at a glance.
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

- **Waypoint visibility** — waypoint nodes should respect the "visible to players" flag: when `visible = true` they show on the player map, when `false` they're hidden. Currently they always show. Newly created waypoints should default to `visible = true`.
- **Map UI dark mode contrast** — the minimap box (bottom right) and context/zoom buttons (bottom left) render light gray on a near-white background, making them invisible in dark mode. Need dark background or border treatment on those React Flow controls.
- **Content generation — @mention references** — when Claude generates content that refers to an already-existing entity (a location, NPC, faction, etc.), it should use the `[[type:id|name]]` mention syntax rather than plain text. The insertion agent needs to resolve existing entity IDs and wire up references before inserting.

---

## To-Imagine
Campaign content that needs to be fleshed out, discussed, and eventually generated. All content so far has been test data; this is where real campaign planning lives.

Before generating any content, a Campaign Bible (`CLAUDE-campaign-[name].md`) must be established in a conversation with Claude. The generation workflow is documented in `CLAUDE-generate.md`. The Bible covers: tone, genre, central conflict, 2–3 major factions and their goals, the player hook, TTRPG system, and map scale preferences.

### Active campaigns

- **Sci-fi campaign (unnamed)** — ideas and notes exist in conversation but no Campaign Bible yet. Next step: sit down and convert existing thoughts into a `CLAUDE-campaign-scifi.md` file, then begin Tier 1 broad-strokes generation. Setting is original sci-fi; system TBD.

### Ideas & seeds

*(drop raw ideas, half-formed hooks, and setting concepts here for future development)*
