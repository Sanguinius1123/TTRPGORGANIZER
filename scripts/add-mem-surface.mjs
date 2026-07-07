// Add surface locations to Mem (water world in Holt System)
// Mem ID: 890156da-7866-454f-b4b3-a1300aa1ee77
// Campaign: Scifi Game (b8353f9c-6caf-40c8-b122-5d6dc2b8c43c)

import { readFileSync } from 'fs'

const env = readFileSync('apps/gm/.env.local', 'utf8')
const URL = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim()
const KEY = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim()

const CAMPAIGN_ID = 'b8353f9c-6caf-40c8-b122-5d6dc2b8c43c'
const MEM_ID = '890156da-7866-454f-b4b3-a1300aa1ee77'
const LEGION_OUTPOST_ID = '98aaaa64-13de-434e-92aa-6078b58e3a83'

const headers = {
  'apikey': KEY,
  'Authorization': `Bearer ${KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
}

async function post(table, rows) {
  const r = await fetch(`${URL}/rest/v1/${table}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(rows),
  })
  const body = await r.json()
  if (!r.ok) throw new Error(`POST ${table}: ${JSON.stringify(body)}`)
  return body
}

async function patch(table, id, data) {
  const r = await fetch(`${URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
  })
  if (!r.ok) {
    const body = await r.json()
    throw new Error(`PATCH ${table}: ${JSON.stringify(body)}`)
  }
  console.log(`Updated ${table} ${id}`)
}

// --- Update Legion Outpost description to reflect its role as the shipping hub ---
await patch('locations', LEGION_OUTPOST_ID, {
  description: 'The primary point of entry and exit on Mem. All interstellar shipping passes through the Outpost\'s fortified docking bays — no cargo leaves or arrives without Legion inspection and tariff. The Outpost is also the seat of Legion authority on the planet, housing the garrison that enforces the colonial administration\'s control over the native population.',
  gm_notes: 'The Outpost commander is Col. Vethara Sain, a career officer who views the posting as exile. She runs a tight ship officially but is open to discreet bribes to look the other way on cargo manifests. The garrison is understaffed — about 200 soldiers to police a whole ocean world. They rely on fear and the threat of the Holding Block more than actual force.',
})

// --- New locations on Mem ---
const locations = [
  {
    campaign_id: CAMPAIGN_ID,
    parent_location_id: MEM_ID,
    name: 'The Holding Block',
    type: 'Prison',
    descriptor: 'Forced Labor Processing Facility',
    status: 'active',
    terrain: 'Ocean',
    visible: false,
    description: 'A massive semi-submersible platform anchored to the ocean floor, officially designated Mem Agricultural Facility Seven. The Holding Block is where native Mem\'an and convicted offenders process the algae harvest into compressed food blocks for export. The conditions are brutal — constant noise, chemical exposure from the processing vats, and tightly rationed food and rest. Workers are sorted into shifts by the Legion guards and rarely see natural light.',
    gm_notes: 'Capacity: ~2,000 prisoners. About half are native Mem\'an "resettled" from areas the Legion wants depopulated. The other half are criminals and political undesirables from across the Holt System. There are whispers of an underground network helping people disappear from the labor rolls — someone is forging death records. The facility\'s power supply is a weak point: one overloaded reactor and a backup that hasn\'t been tested in years.',
  },
  {
    campaign_id: CAMPAIGN_ID,
    parent_location_id: MEM_ID,
    name: 'Harvest Platform Tol-Yan',
    type: 'Settlement',
    descriptor: 'Surface Collection Outpost',
    status: 'active',
    terrain: 'Ocean',
    visible: false,
    description: 'A low-profile floating platform in the northern shelf zone, where algae blooms run thick year-round. A skeleton crew of workers — mostly indentured colonists — tends the collection booms and runs the initial skimming process before bulk transfer to the Holding Block. The platform rocks constantly in the ocean swells. Everything smells of brine and fermentation.',
    gm_notes: 'Population ~80. The foreman, a weathered colonist named Orin Pask, quietly skims a small percentage of harvest for his own trading stock. He sells it to passing independent ships at a discount, undercutting the Legion tariff. He\'d be very motivated to help anyone who could get him off the planet.',
  },
  {
    campaign_id: CAMPAIGN_ID,
    parent_location_id: MEM_ID,
    name: 'Harvest Platform Sel-Arak',
    type: 'Settlement',
    descriptor: 'Surface Collection Outpost',
    status: 'active',
    terrain: 'Ocean',
    visible: false,
    description: 'A deep-water platform positioned over one of the richest algae ecosystems on Mem. The platform is newer than the others — built after the Legion pushed the native Mem\'an communities off the southern shelf to clear it for industrial farming. The deep-water zones produce a rarer high-protein algae strain that fetches a premium on core worlds.',
    gm_notes: 'The Legion posted an extra squad here specifically to prevent contact between workers and the native Mem\'an communities that still live in the shallow reef systems below. There have been three "incidents" in the past year — sabotage of collection booms. The Legion attributed it to equipment failure. It wasn\'t.',
  },
  {
    campaign_id: CAMPAIGN_ID,
    parent_location_id: MEM_ID,
    name: 'Harvest Platform Vur-Keth',
    type: 'Settlement',
    descriptor: 'Surface Collection Outpost — Derelict',
    status: 'derelict',
    terrain: 'Ocean',
    visible: false,
    description: 'A third collection platform, now abandoned after a catastrophic bloom event three years ago. A sudden die-off of algae in the zone — possibly triggered by thermal vent activity — made the platform economically unviable. The Legion stripped most of its equipment and left the rusting hulk in place. It still shows on navigation charts as an active installation.',
    gm_notes: 'Unofficially, the platform is used as a dead drop and occasional shelter by independent smugglers and the Mem\'an resistance. The Legion knows it\'s being used for something but considers it a low priority. A small cache of contraband is stashed in the lower access tunnels — medical supplies, some older weapons, and encoded data chips whose contents nobody seems to know.',
  },
]

console.log('Adding Mem surface locations...')
const created = await post('locations', locations)
console.log(`Created ${created.length} locations:`)
for (const loc of created) {
  console.log(`  ${loc.id}  ${loc.name}`)
}
console.log('Done.')
