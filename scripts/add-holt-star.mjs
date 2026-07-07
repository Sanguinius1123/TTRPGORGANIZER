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
const get = async (path) => { const r = await fetch(`${BASE}/rest/v1/${path}`, { headers: h }); return r.json() }
const post = async (table, body) => {
  const r = await fetch(`${BASE}/rest/v1/${table}`, { method: 'POST', headers: h, body: JSON.stringify(Array.isArray(body) ? body : [body]) })
  const d = await r.json()
  if (!r.ok) { console.error(d); process.exit(1) }
  return d
}

const campaigns = await get('campaigns?name=ilike.*scifi*&select=id,name')
const cid = campaigns[0].id
const locs = await get('locations?name=eq.Holt%20System&select=id')
const holtSystemId = locs[0]?.id
if (!holtSystemId) { console.error('Holt System not found'); process.exit(1) }
console.log('Campaign:', campaigns[0].name)
console.log('Holt System id:', holtSystemId)

const result = await post('locations', {
  campaign_id: cid,
  name: 'Holt',
  type: 'Star / Singularity',
  descriptor: "K-type orange dwarf — the system's central star",
  description: "An orange dwarf star, smaller and cooler than a G-type sun but exceptionally stable over billions of years. Its amber light gives Sonhandra's habitable twilight zone its characteristic perpetual dusk. Sonhandra orbits close enough that tidal locking has long since set in. The star burns without significant flare activity — no deadly radiation belts, which is why life took hold. Mem and Vos orbit further out in the system's temperate and cold bands respectively; Omega sits on the system's far edge.",
  visible: false,
  waypoint: false,
  has_submap: false,
  mystery: false,
  parent_location_id: holtSystemId,
})
console.log('Added:', result[0].name, result[0].id)
