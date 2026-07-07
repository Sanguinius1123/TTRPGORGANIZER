/**
 * Tier 1 content generation for the "Scifi game" campaign (Foxtrot Cluster / Holt System).
 * Uses Supabase REST API directly — no npm dependencies needed.
 * Run: node scripts/generate-scifi-tier1.mjs
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))

// Parse .env.local
function loadEnv(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8')
    for (const line of content.split('\n')) {
      const m = line.match(/^([^#=\s]+)\s*=\s*(.*)$/)
      if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch (e) { /* ignore */ }
}
loadEnv(resolve(__dir, '../apps/gm/.env.local'))

const URL_BASE   = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!URL_BASE || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in apps/gm/.env.local')
  process.exit(1)
}

const headers = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
}

// PostgREST requires all rows in a batch to have identical keys
function normalize(rows) {
  if (!Array.isArray(rows) || rows.length <= 1) return rows
  const keys = [...new Set(rows.flatMap(r => Object.keys(r)))]
  return rows.map(r => Object.fromEntries(keys.map(k => [k, r[k] ?? null])))
}

async function post(table, body) {
  const rows = normalize(Array.isArray(body) ? body : [body])
  const res = await fetch(`${URL_BASE}/rest/v1/${table}`, {
    method: 'POST', headers,
    body: JSON.stringify(rows),
  })
  const data = await res.json()
  if (!res.ok) { console.error(`POST ${table} error:`, JSON.stringify(data)); process.exit(1) }
  return Array.isArray(data) ? data : [data]
}

async function get(table, params = '') {
  const res = await fetch(`${URL_BASE}/rest/v1/${table}?${params}`, {
    method: 'GET', headers: { ...headers, 'Prefer': 'return=representation' },
  })
  const data = await res.json()
  if (!res.ok) { console.error(`GET ${table} error:`, JSON.stringify(data)); process.exit(1) }
  return data
}

// ─── main ────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Find campaign
  const campaigns = await get('campaigns', 'name=ilike.*scifi*&select=id,name')
  if (!campaigns.length) {
    console.error('No campaign found matching "scifi". Create it in the GM portal first.')
    process.exit(1)
  }
  const campaign = campaigns[0]
  const cid = campaign.id
  console.log(`\nGenerating Tier 1 content for: "${campaign.name}" (${cid})\n`)

  // ── FACTIONS ─────────────────────────────────────────────────────────────────

  console.log('Inserting factions...')
  const factionRows = await post('factions', [
    { campaign_id: cid, name: 'Guild of Engineers', disposition: 'neutral',
      goal: 'Maintain monopoly control over mining operations and shipbuilding throughout the Holt System. Protect proprietary kaelite refining processes.',
      description: 'The dominant industrial power in the Holt System. Tier V. The Guild controls what gets mined, what gets built, and what gets shipped — or at least believes it does. Its authority is backed by licensed enforcers, automated turrets on Guild outposts, and deep Hegemony contracts. Individual engineers are often just workers; the Guild leadership is ruthless and politically entangled at every level.',
      visible: false },
    { campaign_id: cid, name: 'Cobalt Syndicate', disposition: 'hostile',
      goal: 'Control all shipping lanes in the Holt System. Skim profit from every cargo that moves. Keep the Guild dependent on Syndicate logistics.',
      description: 'Tier IV. Once a legitimate labor union, the Cobalt Syndicate evolved into a criminal enterprise controlling the system\'s shipping lanes. They still use union rhetoric. They still protect workers, occasionally. But their primary product is leverage: over cargo manifests, over port access, over anyone who needs something moved.',
      visible: false },
    { campaign_id: cid, name: 'Ashen Knives', disposition: 'hostile',
      goal: 'Expand pleasure and vice operations across all inhabited worlds. Eliminate or absorb smaller criminal outfits.',
      description: 'Tier III. A decadent syndicate running gambling dens, drug distribution, and contract assassination. Their pasha Arlox is corpulent and sartorial, hosting elaborate dinners before quietly ordering executions. Present on Vos and Sonhandra; rumored to be running expeditions to quarantined Omega.',
      visible: false },
    { campaign_id: cid, name: 'Memish Labor Bosses', disposition: 'neutral',
      goal: 'Protect Memish workers from Hegemony exploitation on Mem. Maintain cultural and spiritual practices of the Memish people.',
      description: 'Tier II. The Memish are a sapient xeno species native to Mem, adapted to crushing ocean depths, marked by bioluminescent scarring that shifts with emotion and status. Their labor bosses are both union representatives and cultural leaders — navigating the paranoid Hegemony administration of Governor Kromyl.',
      visible: false, species: 'Memish' },
    { campaign_id: cid, name: 'The Vigilance', disposition: 'neutral',
      goal: 'Locate and secure Precursor artifacts. Study Way anomalies. Understand the Precursors\' relationship with the Way.',
      description: 'Tier I. Warrior mystics operating throughout the Holt System, headquartered at Trade Platform Alpha. Not a cult and not mercenaries — scholars with blades. Some members are Way-touched. They believe raw kaelite retains a faint Way resonance that the Guild\'s refining process destroys.',
      visible: false },
    { campaign_id: cid, name: 'Starsmiths Guild', disposition: 'neutral',
      goal: 'Operate Trade Platform Alpha as a neutral, profitable trade hub. Keep all factions transacting through licensed channels.',
      description: 'A Guild affiliate that operates Trade Platform Alpha. They style themselves as neutral facilitators of commerce. Their surveillance array tracks everything that moves through the platform, and that information is worth more than the docking fees.',
      visible: false },
    { campaign_id: cid, name: 'The Hegemony', disposition: 'neutral',
      goal: 'Maintain political and military dominance over the Holt System. Keep the population productive and compliant.',
      description: 'The ruling political body. The Hegemony presents itself as civilizing and stabilizing. In the Holt System its presence is Governors, Hegemonic Marine patrols, and Legion enforcement. Outside core settlements, Hegemony control is thin — they set the rules and enforce them selectively.',
      visible: false },
    { campaign_id: cid, name: 'Borniko Syndicate', disposition: 'hostile',
      goal: 'Steal and fence high-end technological hardware. Stay nimble, stay anonymous.',
      description: 'A loose outfit of thieves specializing in Guild tech theft. They use Jerek\'s Junkyard as a fence and disappear between jobs. They recently stole a Guild shipment from Trade Platform Alpha and hid it in the junkyard, which is causing problems.',
      visible: false },
    { campaign_id: cid, name: 'Church of Stellar Flame', disposition: 'neutral',
      goal: 'Eradicate the lifeform on Omega. Seal the planet.',
      description: 'A Hegemony-aligned religious organization. The Church sees the Omega creature as an abomination that cannot be reasoned with and represents a vector for civilizational collapse. They fund expeditions, lobby for military action, and view the Ashtari Cult\'s attempts to communicate as heretical.',
      visible: false },
    { campaign_id: cid, name: 'Ashtari Cult', disposition: 'neutral',
      goal: 'Establish communication with the Omega lifeform, believed to be a manifestation of the Ur — a primordial Way-entity.',
      description: 'A fringe movement that believes the creature on Omega is a god, or close enough the distinction doesn\'t matter. They attempt expeditions to Omega despite the quarantine. Most don\'t return. The ones that do are changed.',
      visible: false },
  ])

  const factionByName = Object.fromEntries(factionRows.map(f => [f.name, f.id]))
  console.log(`  ✓ ${factionRows.length} factions`)

  // ── LOCATIONS — SYSTEM SCALE ─────────────────────────────────────────────────

  console.log('Inserting system-scale locations...')
  const [holtSystem] = await post('locations', [{
    campaign_id: cid, name: 'Holt System', type: 'Star System',
    descriptor: 'Frontier system in the Foxtrot Cluster',
    description: 'A mid-tier frontier system in the Foxtrot Cluster. Rich in resources — kaelite on Sonhandra, diamond crystals on Vos, ocean food production on Mem — and correspondingly rich in faction conflict. The Hegemony maintains nominal control; the Guild of Engineers and Cobalt Syndicate fight over everything else. At the system\'s edge sits a quarantined planet that everyone agrees is a problem.',
    visible: false, waypoint: false, has_submap: true, mystery: false, parent_location_id: null,
  }])
  const holtSystemId = holtSystem.id

  const planetRows = await post('locations', [
    { campaign_id: cid, name: 'Sonhandra', type: 'World', descriptor: 'Tidally locked twilight world',
      description: 'A tidally locked planet: scorching day side, ice-storm night side, habitable twilight zone along the terminator. All civilization exists in this band. Songah, the massive hive city, sits along the northern twilight pole. A high-speed maglev train runs the planet\'s full circumference along the twilight band.',
      visible: false, waypoint: false, has_submap: true, mystery: false, parent_location_id: holtSystemId },
    { campaign_id: cid, name: 'Mem', type: 'World', descriptor: 'Oversized ocean planet, system food supply',
      description: 'An oversized ocean planet that produces food for every other inhabited world in the Holt System. The Memish — a bioluminescent xeno species — are native here and fiercely contest Hegemony colonization. The real action is in the depths: submersible docks, undersea cities, and the submerged Memish holy site of Nur-thulama.',
      visible: false, waypoint: false, has_submap: true, mystery: false, parent_location_id: holtSystemId },
    { campaign_id: cid, name: 'Vos', type: 'World', descriptor: '"Glimmer" — crystal mining planet',
      description: 'Known as Glimmer by anyone who\'s seen it from orbit: the surface is carpeted in massive glowing diamond and crystal spires visible through the thin particulate atmosphere. Vos exists entirely for its minerals. The hive city Ugar Prime is built into a carbon cliff. The Blackened Mines pulse with Way anomalies that nobody officially acknowledges.',
      visible: false, waypoint: false, has_submap: true, mystery: false, parent_location_id: holtSystemId },
    { campaign_id: cid, name: 'Omega', type: 'World', descriptor: 'QUARANTINED — approach will be intercepted',
      description: 'A quarantined world. A Hegemony survey mission was lost here after encountering a lifeform that resists conventional weapons. The planet is under hard quarantine. Beneath the surface: Precursor ruins, the abandoned Hegemonic outpost, and the lifeform itself. Three factions want access for three incompatible reasons.',
      visible: false, waypoint: false, has_submap: true, mystery: false, parent_location_id: holtSystemId, status: 'ruined' },
    { campaign_id: cid, name: "Jerek's Junkyard", type: 'Space Station', descriptor: 'Floating scrapyard merchant station',
      description: 'A floating mass of decommissioned ships and salvaged components held together by magnetism and cables. If you need a part — legal or otherwise — this is the first stop. Jerek is neutral by policy. The Borniko Syndicate uses the junkyard as a fence, which Jerek tolerates.',
      visible: false, waypoint: false, has_submap: false, mystery: false, parent_location_id: holtSystemId },
    { campaign_id: cid, name: 'Trade Platform Alpha', type: 'Space Station', descriptor: 'Starsmiths Guild automated trade hub',
      description: 'An automated trading platform operated by the Starsmiths Guild. Ships dock to refuel and trade without direct Hegemony interference. Heavily defended. The Starsmiths surveillance array tracks everything through the platform. The Vigilance use it as a base of operations.',
      visible: false, waypoint: false, has_submap: false, mystery: false, parent_location_id: holtSystemId },
  ])

  const locByName = {}
  for (const l of planetRows) locByName[l.name] = l.id
  const sonhandraId = locByName['Sonhandra']
  const memId       = locByName['Mem']
  const vosId       = locByName['Vos']
  const omegaId     = locByName['Omega']
  console.log(`  ✓ ${1 + planetRows.length} system-scale locations`)

  // ── LOCATIONS — SONHANDRA ────────────────────────────────────────────────────

  console.log('Inserting Sonhandra locations...')
  const sonhandraLocs = await post('locations', [
    { campaign_id: cid, name: 'Songah', type: 'Settlement', descriptor: 'Massive twilight hive city',
      description: 'The planet\'s dominant city, positioned along the northern twilight pole where aurora-like light plays constantly across the perpetual dusk. A vertical metropolis: deep mined caverns at its foundations, finger-like towers of metal and concrete reaching into the amber sky. Neon signs flicker in the perpetual twilight. Class is literal geography — the wealthy occupy the upper tiers, the poor are crammed into the depths.',
      visible: false, waypoint: false, has_submap: true, mystery: false, parent_location_id: sonhandraId },
    { campaign_id: cid, name: 'The Steel Warehouse District', type: 'District', descriptor: 'Industrial sprawl along the twilight zone',
      description: 'A sprawling industrial complex extruding from Songah along the twilight band — factories and warehouses where kaelite and other extracted materials are processed for export. The atmosphere is thick with particulate and hot metal. Corrupt local enforcers run protection rackets while Guild inspectors look the other way. The maglev train passes through here.',
      visible: false, waypoint: false, has_submap: false, mystery: false, parent_location_id: sonhandraId },
    { campaign_id: cid, name: "Zaeed's Night-Side Caverns", type: 'Wilderness', descriptor: "Hidden ship cache in Sonhandra's dark side",
      description: 'In the ice-carved cavern networks on Sonhandra\'s unlit night side, Zaeed "Tank" Marak has carved out a private operation over years. Ships in various states of repair sit in the dark, frozen and waiting. He knows every tunnel and safe approach vector. Reaching it without a guide is dangerous. With one, it\'s expensive.',
      visible: false, waypoint: false, has_submap: false, mystery: false, parent_location_id: sonhandraId },
    { campaign_id: cid, name: 'The Lost City', type: 'Ruin', descriptor: 'Buried Precursor pyramid on the cooked side',
      description: 'Somewhere in the scorching drifts of Sonhandra\'s day side, a geometric shape breaks the sand — the tip of a pyramid, almost entirely buried. Getting close requires a Tier 3 hazard suit. Those who have found it describe stone carved with patterns in an unknown language and a sealed entrance that wasn\'t always sealed. What\'s inside has not been reported back.',
      visible: false, waypoint: false, has_submap: false, mystery: true, parent_location_id: sonhandraId, status: 'ruined' },
  ])

  const songahId = sonhandraLocs.find(l => l.name === 'Songah').id
  console.log(`  ✓ ${sonhandraLocs.length} Sonhandra locations`)

  // ── LOCATIONS — SONGAH ───────────────────────────────────────────────────────

  console.log('Inserting Songah district locations...')
  await post('locations', [
    { campaign_id: cid, name: "Sable's Club", type: 'Entertainment', descriptor: 'Mid-tier nightclub and information brokerage',
      description: 'A nightclub occupying a mid-tier floor in Songah\'s midsection. The music is always something with a heavy low-frequency pulse. The staff are professional and notably incurious. Private booths are available for meetings that don\'t need to be remembered. Sable is here, somewhere, always — heard but never clearly seen, their shape blurred by light-bending privacy tech that makes the air around them look like heat haze.',
      visible: false, waypoint: false, has_submap: false, mystery: false, parent_location_id: songahId },
    { campaign_id: cid, name: 'The Three Suns', type: 'Tavern / Inn', descriptor: "Osha's gambling den",
      description: 'A gambling den in the lower-mid tiers of Songah, run by Osha — an ex-Legionnaire who drinks too much and notices too much. The games are rigged just enough to stay profitable without triggering violence. Disputes are settled in the back room. If you need to disappear for a few days or meet someone who doesn\'t want to be findable, the Three Suns is a reasonable choice.',
      visible: false, waypoint: false, has_submap: false, mystery: false, parent_location_id: songahId },
    { campaign_id: cid, name: "Del Hex's Fighting Ring", type: 'Entertainment', descriptor: 'Underground vibro-weapon combat ring',
      description: 'Hidden in the industrial depths of the Warehouse District, accessible through a series of unmarked doors that change based on who\'s watching. Del Hex runs vibro-weapon bouts — sanctioned only by the crowd\'s approval and the money changing hands. Del Hex herself presides from a gantry above the pit, her cybernetic enhancements making her look more constructed than human.',
      visible: false, waypoint: false, has_submap: false, mystery: false, parent_location_id: songahId },
    { campaign_id: cid, name: "Abra Drake's Auction House", type: 'Commerce', descriptor: 'Black market auction and fixer services',
      description: 'Abra Drake operates from a location that changes — or more precisely, that is always described as temporary even if it\'s been there for years. She is a fixer and auctioneer who knows everyone. Her prices reflect that she has no competition worth naming. Unfailingly polite until she isn\'t, at which point the conversation is over.',
      visible: false, waypoint: false, has_submap: false, mystery: false, parent_location_id: songahId },
    { campaign_id: cid, name: 'The Lower Depths', type: 'District', descriptor: "Lawless underbelly of Songah",
      description: 'Below the functional middle tiers, the city\'s foundations are carved from rock and pressed with the weight of everything above. Lighting is sparse. The air smells of recycled water and cheap food synthesis. Guild authority does not extend here. Hegemony patrols are theoretical. The Lower Depths are governed by whoever is strongest at any given moment. It is also where most of Songah\'s population lives.',
      visible: false, waypoint: false, has_submap: false, mystery: false, parent_location_id: songahId },
    { campaign_id: cid, name: 'The Upper Spires', type: 'District', descriptor: "Songah's wealthy upper tier",
      description: 'The top floors of Songah\'s towers belong to Guild administrators, Hegemony officials, and anyone wealthy enough to buy altitude. The air is filtered. Security is private and thorough. Being caught where you don\'t belong is treated as a capital matter by the private security forces.',
      visible: false, waypoint: false, has_submap: false, mystery: false, parent_location_id: songahId },
  ])
  console.log(`  ✓ Songah district locations`)

  // ── LOCATIONS — OTHER PLANETS ────────────────────────────────────────────────

  console.log('Inserting seed locations for Mem, Vos, Omega...')
  await post('locations', [
    { campaign_id: cid, name: 'Nur-thulama', type: 'Place of Worship', descriptor: 'Submerged Memish holy site',
      description: 'A vast submerged temple complex in the crushing depths of Mem\'s ocean. Memish mystics pray here to the Prophet Ruum. The site is believed to contain a Precursor artifact — a key to something called the Hantu Gate. Infested with dangerous deep-sea fauna the Memish treat with reverence. Access requires a submersible and, ideally, Memish permission.',
      visible: false, waypoint: false, has_submap: false, mystery: false, parent_location_id: memId },
    { campaign_id: cid, name: 'Legion Outpost — Mem', type: 'Fortification', descriptor: 'Hegemony surface base on Mem',
      description: 'A heavily fortified surface installation where the Hegemony maintains its presence on Mem. Answers to Governor Kromyl, whose increasingly paranoid directives have made the Marine officers quietly resentful. Fortified enough to withstand an assault; not fortified against the slow institutional rot of following impossible orders.',
      visible: false, waypoint: false, has_submap: false, mystery: false, parent_location_id: memId },
    { campaign_id: cid, name: 'Ugar Prime', type: 'Settlement', descriptor: 'Hive city built into Vos carbon cliff',
      description: 'Carved into the face of a massive carbon cliff on Vos. Upper levels catch reflected crystal-light; lower levels are dark and dense. Same vertical class structure as Songah. The Guild Outpost on the plateau above pretends to maintain order. Del Hex runs a fighting ring here. The Ashen Knives have a substantial presence in the commerce and entertainment levels.',
      visible: false, waypoint: false, has_submap: false, mystery: false, parent_location_id: vosId },
    { campaign_id: cid, name: 'The Blackened Mines', type: 'Wilderness', descriptor: 'Way-touched diamond mining tunnels under Vos',
      description: 'A labyrinthine system of tunnels beneath Vos where carbon and diamond crystal are extracted. Filter required. Way anomalies pulse unpredictably through certain sections, causing crystal formations to glow with unusual intensity and drawing Way creatures into the tunnels. Miners go missing. The Guild does not publicize this.',
      visible: false, waypoint: false, has_submap: false, mystery: false, parent_location_id: vosId },
    { campaign_id: cid, name: 'The Abandoned Base — Omega', type: 'Fortification', descriptor: 'Overrun Hegemony outpost on quarantined Omega',
      description: 'The former Hegemonic survey outpost, now overrun. The lifeform nests somewhere in or beneath it. Power flows intermittently. Data terminals are intact but corrupted — or selectively wiped. Someone who escaped claimed the base contained a map to Precursor ruins beneath the surface. That person\'s whereabouts are unknown.',
      visible: false, waypoint: false, has_submap: false, mystery: false, parent_location_id: omegaId, status: 'ruined' },
  ])
  console.log(`  ✓ Seed locations for Mem, Vos, Omega`)

  // ── NPCs ─────────────────────────────────────────────────────────────────────

  console.log('Inserting NPCs...')
  const npcRows = await post('npcs', [
    { campaign_id: cid, name: 'Sable', species: 'Unknown', profession: 'Information Broker / Crime Boss', disposition: 'neutral',
      background: 'No confirmed background exists. Has operated in Songah\'s mid-tiers for at least five years under this name, possibly longer under others.',
      notes: 'Hires the party for the kaelite train heist. Contact is always indirect — modulated voice, light-bending privacy technology that blurs their humanoid shape like heat haze. May never be clearly seen for multiple sessions. Has something dangerous they know, and needs it to stop being a problem.',
      personality_notes: 'Voice: calm, measured, electronically modulated to neutrality. Never raised. Behavior: operates entirely through intermediaries and tech. Clinical precision. Warmth is a tool deployed rarely. Triggers: information leaks, being cornered, being lied to directly — they always know.',
      visible: false },
    { campaign_id: cid, name: 'Del Hex', species: 'Human (heavily augmented)', profession: 'Syndicate Operator / Fighting Ring Proprietor', disposition: 'neutral',
      background: 'Came up through the lower tiers of Songah — or Vos, depending on the story. Acquired cybernetic enhancements through winnings, theft, and surgical stubbornness.',
      notes: 'Tier II local power. Runs vibro-weapon fighting rings in Songah and Ugar Prime. Can be a contact, employer, or obstacle depending on player choices.',
      personality_notes: 'Voice: flat, direct, never unnecessary. Behavior: watches everything from the gantry; cybernetic eyes give her perception range that unsettles people. Does not bluff. Does not threaten twice. Triggers: interference with her rings, unpaid debts.',
      visible: false },
    { campaign_id: cid, name: 'Abra Drake', species: 'Human', profession: 'Fixer / Black Market Auctioneer', disposition: 'neutral',
      background: 'Has been in the Holt System longer than most people can confirm. Has connections in every faction without being owned by any.',
      notes: 'Tier II. The person to call for anything needing acquiring, moving, or disappearing. Prices reflect no real competition. Excellent information source.',
      personality_notes: 'Voice: warm, social, always sounds genuinely pleased — you\'re a revenue opportunity. Behavior: always has a drink nearby, always making introductions, always in motion. Triggers: non-payment, being used as bait, threats to her contact network.',
      visible: false },
    { campaign_id: cid, name: 'Zaeed "Tank" Marak', species: 'Human', profession: 'Mercenary-turned-recluse / Ship Cache Operator', disposition: 'neutral',
      background: 'Former mercenary. At some point decided staying alive was more interesting than staying profitable and retreated to Sonhandra\'s night side.',
      notes: 'Knows Sonhandra\'s night-side geography better than anyone. Has a ship cache in the ice caverns. Can be guide, contact, or transport source.',
      personality_notes: 'Voice: unhurried, low, like someone who stopped worrying about impressions. Behavior: always aware of exits. Left hand goes to belt when assessing whether something becomes a fight. Triggers: being rushed, risk levels being understated, heat brought to his caverns.',
      visible: false },
    { campaign_id: cid, name: 'Osha', species: 'Human', profession: 'Ex-Legionnaire / Gambling Den Proprietor', disposition: 'neutral',
      background: 'Served with the Legion for more years than she talks about. Left — or was left — and ended up in Songah running the Three Suns.',
      notes: 'Runs the Three Suns gambling den. Useful contact for information about what moves through the city\'s mid and lower tiers.',
      personality_notes: 'Voice: gravel-dry, rarely more than necessary. Behavior: always back to a wall, drink in hand. Observes more than she speaks. Will intervene in violence exactly once as warning. Triggers: threats to her staff, disrespect to the Three Suns, Legion recruiters.',
      visible: false },
    { campaign_id: cid, name: 'Jerek', species: 'Unknown', profession: 'Merchant / Scrap Dealer', disposition: 'friendly',
      background: 'Has been running the junkyard long enough he may have built parts of it. Species not commonly encountered in the Holt System; doesn\'t volunteer origins.',
      notes: 'Neutral by policy. Sells legal and illegal equipment to those who can pay and have earned trust. Trust takes time. Tolerates Borniko fencing as less trouble than alternatives.',
      personality_notes: 'Voice: haggling cadence even in casual conversation. Behavior: always handling something mechanical. Encyclopedic inventory memory, equally good memory for who tried to cheat him. Triggers: theft, interference with the Auction Block, actions that bring Guild attention.',
      visible: false },
    { campaign_id: cid, name: 'Victor Kromyl', species: 'Human', profession: 'Hegemony Governor of Mem', disposition: 'hostile',
      background: 'A career Hegemony administrator given Mem as a reward for political loyalty. It has not been a reward. He has been secretly consuming a locally-made narcotic to manage stress, which is producing paranoid ideation.',
      notes: 'Governor of Mem. Sees insubordination everywhere. Could be a source of contracts or an obstacle. His deterioration is a ticking clock that will produce a crisis.',
      personality_notes: 'Voice: clipped, official, slight tremor under pressure. Behavior: files reports on his own staff. Has fired three aides this month. Keeps detailed notes he shows no one. Triggers: any suggestion he\'s not in control, questions about his health, the Memish Labor Bosses.',
      visible: false },
    { campaign_id: cid, name: 'FireStarter', species: 'Human (cyberpsycho)', profession: 'Wandering Folk Villain / Chaos Agent', disposition: 'neutral',
      background: 'Real name unknown. Travels the system via stolen or public transport, throwing parties and leaving wreckage. He and his crew are all cyberpsychos.',
      notes: 'Wandering NPC. Appears as random encounter, news report, rumor, or full story thread if players engage. No allegiance. Funds travel through opportunistic robbery.',
      personality_notes: 'Voice: warm, expansive, genuinely delighted by everything. Behavior: always at the center of whatever\'s happening, always in motion. No plan beyond tonight. Triggers: being confined, being told he can\'t go somewhere, boredom.',
      visible: false },
  ])
  console.log(`  ✓ ${npcRows.length} NPCs`)

  // ── LORE ─────────────────────────────────────────────────────────────────────

  console.log('Inserting lore entries...')
  await post('lore_entries', [
    { campaign_id: cid, title: 'The Way', category: 'Magic / Technology', descriptor: 'Primordial mystical force',
      description: 'The Way is real. It is not understood. It manifests as anomalies — spatial disturbances where physics behaves incorrectly, where the air feels wrong. It draws creatures to anomaly sites. Some people are Way-touched: born with sensitivity that grants perception and capability at costs that vary by individual. The Precursors are believed to have had a structural relationship with the Way — not merely sensitivity, but something built. What they built with it is unknown. The Vigilance spend their lives trying to find out.',
      visible: false, major_event: false },
    { campaign_id: cid, title: 'The Precursors', category: 'History', descriptor: 'Ancient alien civilization, long absent',
      description: 'No living species knows what the Precursors called themselves. Their ruins appear across the Foxtrot Cluster: on Omega, beneath the sands of Sonhandra\'s cooked side, possibly in the depths of Mem. Their artifacts are valuable, dangerous, and poorly understood. The Vigilance believe Precursor technology was built around the Way — not a tool they used but a presence they were in conversation with. The Hantu Gate, referenced in Memish spiritual tradition, is believed to be a Precursor construct of significant but unknown purpose.',
      visible: false, major_event: false },
    { campaign_id: cid, title: 'Kaelite', category: 'Magic / Technology', descriptor: "Sonhandra's primary export mineral",
      description: 'A dense crystalline mineral formed exclusively under extreme temperature differential conditions — the kind produced by Sonhandra\'s twilight geology. The Guild uses refined kaelite in ship hull heat-shielding and high-end weapon components. What they do not advertise: kaelite formations appear consistently near low-level Way anomaly sites in the mines. The Vigilance have documented this. They believe the Guild\'s refining process destroys a property of raw kaelite they cannot yet name — something the Way touched, now gone. Raw kaelite is worth considerably more to the right buyer than refined.',
      visible: false, major_event: false },
    { campaign_id: cid, title: 'The Hegemony', category: 'Politics & Law', descriptor: 'Ruling political body of known space',
      description: 'The Hegemony is the dominant political structure of the civilized cluster. It maintains control through military force, trade licensing, and appointed Governors. Within its core regions, law is real and enforced — reliably in the interest of those who can afford enforcement. Outside core regions, Hegemony control is nominal. Governors are appointed, Marines are stationed, but the Guilds run wild, and what happens in the mines and the research stations is the Hegemony\'s problem only when it becomes too visible to ignore.',
      visible: false, major_event: false },
    { campaign_id: cid, title: 'The Memish', category: 'Culture & Society', descriptor: 'Native species of Mem, ocean-adapted',
      description: 'The Memish adapted over millennia to the crushing pressures of Mem\'s deep ocean: dense musculature, pressure-resistant biology, bioluminescent scarring patterns that shift with emotional and social context. They are deeply spiritual; the Prophet Ruum is central to their cosmology, and Nur-thulama is their most sacred site. The Hegemony colonized Mem for its food production capacity without consulting the Memish. The resulting conflict is ongoing and unresolved. The Memish Labor Bosses navigate this — trading with Guilds on one side, managing Hegemony pressure on the other.',
      visible: false, major_event: false },
  ])
  console.log(`  ✓ 5 lore entries`)

  // ── RELATIONSHIPS ─────────────────────────────────────────────────────────────

  console.log('Wiring up relationships...')

  // Fetch all locations and npcs for linking
  const allLocs = await get('locations', `campaign_id=eq.${cid}&select=id,name`)
  const locId = name => allLocs.find(l => l.name === name)?.id

  const allNpcs = await get('npcs', `campaign_id=eq.${cid}&select=id,name`)
  const npcId = name => allNpcs.find(n => n.name === name)?.id

  // Faction–location links
  const flLinks = [
    { faction_id: factionByName['Starsmiths Guild'],   location_id: locId('Trade Platform Alpha'),      notes: 'Operates the platform' },
    { faction_id: factionByName['The Vigilance'],       location_id: locId('Trade Platform Alpha'),      notes: 'Uses as base of operations' },
    { faction_id: factionByName['Guild of Engineers'],  location_id: locId('Songah'),                    notes: 'Primary Sonhandra operations hub' },
    { faction_id: factionByName['Cobalt Syndicate'],    location_id: locId('The Steel Warehouse District'), notes: 'Controls shipping through the District' },
    { faction_id: factionByName['Ashen Knives'],        location_id: locId('Ugar Prime'),                notes: 'Strong presence in commerce levels' },
    { faction_id: factionByName['Memish Labor Bosses'], location_id: locId('Nur-thulama'),               notes: 'Sacred site; center of Memish authority' },
    { faction_id: factionByName['The Hegemony'],        location_id: locId('Legion Outpost — Mem'),      notes: 'Primary military presence on Mem' },
    { faction_id: factionByName['Borniko Syndicate'],   location_id: locId("Jerek's Junkyard"),          notes: 'Uses junkyard as fence' },
  ].filter(l => l.faction_id && l.location_id)
  if (flLinks.length) { await post('faction_locations', flLinks); console.log(`  ✓ ${flLinks.length} faction–location links`) }

  // NPC–faction links
  const nfLinks = [
    { npc_id: npcId('Victor Kromyl'), faction_id: factionByName['The Hegemony'],     role: 'Governor of Mem' },
    { npc_id: npcId('Jerek'),         faction_id: factionByName['Borniko Syndicate'], role: 'Reluctant fence — neutral party' },
  ].filter(l => l.npc_id && l.faction_id)
  if (nfLinks.length) { await post('npc_factions', nfLinks); console.log(`  ✓ ${nfLinks.length} NPC–faction links`) }

  // NPC–location links
  const nlLinks = [
    { npc_id: npcId('Sable'),               location_id: locId("Sable's Club"),             relationship_type: 'base', notes: 'Operates from here' },
    { npc_id: npcId('Osha'),                location_id: locId('The Three Suns'),            relationship_type: 'base', notes: 'Owns and operates' },
    { npc_id: npcId('Del Hex'),             location_id: locId("Del Hex's Fighting Ring"),   relationship_type: 'base', notes: 'Runs the ring' },
    { npc_id: npcId('Abra Drake'),          location_id: locId("Abra Drake's Auction House"), relationship_type: 'base', notes: 'Primary operation' },
    { npc_id: npcId('Zaeed "Tank" Marak'), location_id: locId("Zaeed's Night-Side Caverns"), relationship_type: 'base', notes: 'Lives and operates here' },
    { npc_id: npcId('Jerek'),              location_id: locId("Jerek's Junkyard"),           relationship_type: 'base', notes: 'Owns and operates' },
    { npc_id: npcId('Victor Kromyl'),      location_id: locId('Legion Outpost — Mem'),       relationship_type: 'base', notes: "Governor's office" },
  ].filter(l => l.npc_id && l.location_id)
  if (nlLinks.length) { await post('npc_locations', nlLinks); console.log(`  ✓ ${nlLinks.length} NPC–location links`) }

  console.log(`
✓ Tier 1 generation complete for: "${campaign.name}"
  10 factions · ${1 + planetRows.length + sonhandraLocs.length + 6 + 5} locations · 8 NPCs · 5 lore entries
  All visible = false. Reveal in the GM portal as needed.
`)
}

main().catch(e => { console.error(e); process.exit(1) })
