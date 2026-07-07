import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
const __dir = dirname(fileURLToPath(import.meta.url))
const env = readFileSync(resolve(__dir, '../apps/gm/.env.local'), 'utf8')
for (const line of env.split('\n')) {
  const m = line.match(/^([^#=\s]+)\s*=\s*(.*)$/)
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY
const h = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' }

const get  = async (path) => { const r = await fetch(`${BASE}/rest/v1/${path}`, { headers: h }); return r.json() }
const post = async (table, body) => {
  const r = await fetch(`${BASE}/rest/v1/${table}`, { method: 'POST', headers: h, body: JSON.stringify([body]) })
  const d = await r.json(); if (!r.ok) { console.error(d); process.exit(1) }; return d[0]
}
const patch = async (table, filter, body) => {
  const r = await fetch(`${BASE}/rest/v1/${table}?${filter}`, { method: 'PATCH', headers: h, body: JSON.stringify(body) })
  const d = await r.json(); if (!r.ok) { console.error(d); process.exit(1) }; return d
}

const campaigns = await get('campaigns?name=ilike.*scifi*&select=id')
const cid = campaigns[0].id

// Fetch all Songah children by name
const locs = await get(`locations?campaign_id=eq.${cid}&select=id,name,parent_location_id`)
const byName = Object.fromEntries(locs.map(l => [l.name, l]))

const songahId      = byName['Songah']?.id
const lowerDepthsId = byName['The Lower Depths']?.id
const upperSpiresId = byName['The Upper Spires']?.id

if (!songahId || !lowerDepthsId || !upperSpiresId) {
  console.error('Could not find Songah, Lower Depths, or Upper Spires')
  console.log(Object.keys(byName))
  process.exit(1)
}

console.log('Songah:', songahId)
console.log('Lower Depths:', lowerDepthsId)
console.log('Upper Spires:', upperSpiresId)

// 1. Create the Mid District
console.log('\nCreating The Midsection...')
const midDistrict = await post('locations', {
  campaign_id: cid,
  name: 'The Midsection',
  type: 'District',
  descriptor: "Songah's mid-tier commercial and social layer",
  description: "The functional heart of Songah — neither the elevated privilege of the Upper Spires nor the lawless density of the Lower Depths. The Midsection is where most of the city's commerce, nightlife, and criminal enterprise operates in the open. Enforcers patrol here but selectively. A person of moderate means or moderate notoriety can move through without drawing attention.",
  visible: false,
  waypoint: false,
  has_submap: false,
  mystery: false,
  parent_location_id: songahId,
})
console.log('Created:', midDistrict.name, midDistrict.id)

// 2. Re-parent venues into the right district
//    Mid:   Sable's Club, The Three Suns, Abra Drake's Auction House
//    Lower: Del Hex's Fighting Ring (underground, industrial depth)

const toMid = ["Sable's Club", 'The Three Suns', "Abra Drake's Auction House"]
const toLower = ["Del Hex's Fighting Ring"]

for (const name of toMid) {
  const loc = byName[name]
  if (!loc) { console.warn('Not found:', name); continue }
  await patch('locations', `id=eq.${loc.id}`, { parent_location_id: midDistrict.id })
  console.log(`Moved "${name}" → The Midsection`)
}

for (const name of toLower) {
  const loc = byName[name]
  if (!loc) { console.warn('Not found:', name); continue }
  await patch('locations', `id=eq.${loc.id}`, { parent_location_id: lowerDepthsId })
  console.log(`Moved "${name}" → The Lower Depths`)
}

console.log('\nDone. Songah structure:')
console.log('  Songah')
console.log('    The Lower Depths')
console.log("      Del Hex's Fighting Ring")
console.log('    The Midsection')
console.log("      Sable's Club")
console.log('      The Three Suns')
console.log("      Abra Drake's Auction House")
console.log('    The Upper Spires')
console.log('      (empty for now)')
