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

const get   = async (path) => { const r = await fetch(`${BASE}/rest/v1/${path}`, { headers: h }); return r.json() }
const post  = async (table, body) => {
  const r = await fetch(`${BASE}/rest/v1/${table}`, { method: 'POST', headers: h, body: JSON.stringify(Array.isArray(body) ? body : [body]) })
  const d = await r.json(); if (!r.ok) { console.error(d); process.exit(1) }; return d
}
const patch = async (table, filter, body) => {
  const r = await fetch(`${BASE}/rest/v1/${table}?${filter}`, { method: 'PATCH', headers: h, body: JSON.stringify(body) })
  const d = await r.json(); if (!r.ok) { console.error(d); process.exit(1) }; return d
}

const campaigns = await get('campaigns?name=ilike.*scifi*&select=id')
const cid = campaigns[0].id

const locs = await get(`locations?campaign_id=eq.${cid}&select=id,name,parent_location_id`)
const byName = Object.fromEntries(locs.map(l => [l.name, l]))

const songahId      = byName['Songah']?.id
const lowerDepthsId = byName['The Lower Depths']?.id
const midsectionId  = byName['The Midsection']?.id
const upperSpiresId = byName['The Upper Spires']?.id

// Venues that need to be re-parented back to Songah (flat siblings on the same map)
const venues = [
  "Sable's Club",
  'The Three Suns',
  "Abra Drake's Auction House",
  "Del Hex's Fighting Ring",
]

console.log('Re-parenting all venues to Songah (flat structure)...')
for (const name of venues) {
  const loc = byName[name]
  if (!loc) { console.warn('Not found:', name); continue }
  if (loc.parent_location_id === songahId) { console.log(`  "${name}" already under Songah`); continue }
  await patch('locations', `id=eq.${loc.id}`, { parent_location_id: songahId })
  console.log(`  "${name}" → Songah`)
}

// Create location_connections: venue ↔ district hub (bidirectional, short walk)
const connections = [
  // Lower Depths hub
  { from: "Del Hex's Fighting Ring", to: 'The Lower Depths', notes: 'Hidden access through unmarked doors in the depths' },
  // Midsection hub
  { from: "Sable's Club",            to: 'The Midsection',   notes: 'Mid-tier floor, standard public access' },
  { from: 'The Three Suns',          to: 'The Midsection',   notes: 'Lower-mid tier, short walk from the main concourse' },
  { from: "Abra Drake's Auction House", to: 'The Midsection', notes: 'Location changes but always accessible from the Midsection' },
]

console.log('\nCreating travel connections...')
const connRows = connections.map(c => ({
  from_location_id: byName[c.from]?.id,
  to_location_id: byName[c.to]?.id,
  travel_time: '5 min',
  travel_time_manual: true,
  bidirectional: true,
  notes: c.notes,
})).filter(r => r.from_location_id && r.to_location_id)

await post('location_connections', connRows)
for (const c of connections) {
  console.log(`  "${c.from}" ↔ ${c.to}`)
}

console.log('\nDone. Songah local map (all siblings under Songah):')
console.log('  [The Lower Depths] ── Del Hex\'s Fighting Ring')
console.log('  [The Midsection]   ── Sable\'s Club')
console.log('                     ── The Three Suns')
console.log('                     ── Abra Drake\'s Auction House')
console.log('  [The Upper Spires] ── (empty)')
