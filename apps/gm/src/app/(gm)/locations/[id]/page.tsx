import { db } from '@/lib/db'
import { updateLocation, deleteLocation, toggleLocationVisibility, toggleLocationMystery } from '@/lib/actions/locations'
import { Location } from '@ttrpg/db'
import MentionTextarea from '@/components/MentionTextarea'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getActiveCampaignId } from '@/lib/activeCampaign'
import { SubmitButton } from '@/components/SubmitButton'

const input = 'block w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none'
const label = 'block text-sm font-medium text-slate-300 mb-1'

const LOCATION_TYPES = [
  'Sector', 'Star System', 'Star / Singularity', 'Planetoid', 'World', 'Space Station',
  'Wilderness', 'Ruin', 'Settlement', 'District',
  'Fortification', 'Residence', 'Commerce', 'Tavern / Inn', 'Place of Worship',
  'Government', 'Prison', 'Guild / Organization', 'Workshop',
  'Research / Laboratory', 'Medical / Healthcare', 'Entertainment', 'Transport Hub',
  'POI',
]

interface SubLocation { id: string; name: string; type: string | null; visible: boolean }

export default async function LocationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const campaignId = await getActiveCampaignId()
  const supabase = db()

  const { data: raw } = await supabase.from('locations').select('*').eq('id', id).single()
  if (!raw) notFound()
  const loc = raw as Location

  const [r1, r2, r3] = await Promise.all([
    supabase.from('locations').select('id, name').eq('campaign_id', campaignId ?? loc.campaign_id).neq('id', id).order('name'),
    supabase.from('locations').select('id, name, type, visible').eq('parent_location_id', id).neq('waypoint', true).order('name'),
    supabase.from('shops').select('id, name').eq('location_id', id).order('name'),
  ])

  const allLocations = (r1.data ?? []) as Array<{ id: string; name: string }>
  const subLocations = (r2.data ?? []) as SubLocation[]
  const shops = (r3.data ?? []) as Array<{ id: string; name: string }>

  let parent: { id: string; name: string } | null = null
  if (loc.parent_location_id) {
    const { data: p } = await supabase.from('locations').select('id, name').eq('id', loc.parent_location_id).single()
    parent = p as { id: string; name: string } | null
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/locations" className="text-sm text-slate-500 hover:text-slate-300">Locations</Link>
        {parent && (
          <>
            <span className="text-slate-600">/</span>
            <Link href={`/locations/${parent.id}`} className="text-sm text-slate-500 hover:text-slate-300">{parent.name}</Link>
          </>
        )}
        <span className="text-slate-600">/</span>
        <span className="text-sm text-slate-100 font-medium">{loc.name ?? '(unnamed)'}</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-100">{loc.name ?? '(unnamed)'}</h1>
          {loc.map_x !== null && (
            <Link
              href={loc.parent_location_id ? `/map/${loc.parent_location_id}?focus=${loc.id}` : `/map?focus=${loc.id}`}
              className="text-xs text-indigo-400 hover:text-indigo-300 border border-indigo-800 hover:border-indigo-600 px-2 py-1 rounded transition-colors"
            >
              Map ↗
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2">
          <form action={toggleLocationVisibility}>
            <input type="hidden" name="id" value={loc.id} />
            <input type="hidden" name="visible" value={String(loc.visible)} />
            <button type="submit" className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
              loc.visible
                ? 'bg-green-900/40 text-green-400 border-green-700 hover:bg-green-900/60'
                : 'bg-slate-700 text-slate-400 border-slate-600 hover:bg-slate-600'
            }`}>
              {loc.visible ? 'Visible to players' : 'Hidden from players'}
            </button>
          </form>
          <form action={async () => { 'use server'; await toggleLocationMystery(loc.id, !loc.mystery) }}>
            <button type="submit" className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
              loc.mystery
                ? 'bg-purple-900/40 text-purple-400 border-purple-700 hover:bg-purple-900/60'
                : 'bg-slate-700 text-slate-400 border-slate-600 hover:bg-slate-600'
            }`}>
              {loc.mystery ? 'Mystery' : 'Not mystery'}
            </button>
          </form>
        </div>
      </div>

      <form action={updateLocation} className="bg-slate-800 rounded-lg border border-slate-700 p-6 space-y-5 mb-8">
        <input type="hidden" name="id" value={loc.id} />
        <div>
          <label className={label}>Name</label>
          <input spellCheck name="name" defaultValue={loc.name ?? ''} required className={input} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Type</label>
            <select key={loc.type ?? ''} name="type" defaultValue={loc.type ?? ''} className={input}>
              <option value="">— None —</option>
              {LOCATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>Descriptor</label>
            <input spellCheck name="descriptor" defaultValue={loc.descriptor ?? ''} placeholder="Ocean World, Frontier Colony…" className={input} />
          </div>
        </div>
        <div>
          <label className={label}>Status</label>
          <input spellCheck name="status" defaultValue={loc.status ?? ''} placeholder="active, abandoned…" className={input} />
        </div>
        <div>
          <label className={label}>Area</label>
          <MentionTextarea name="area" defaultValue={loc.area ?? ''} placeholder="Relative position within parent" rows={2} className={`${input} resize-none`} />
        </div>
        <div>
          <label className={label}>Parent Location</label>
          <select key={loc.parent_location_id ?? ''} name="parent_location_id" defaultValue={loc.parent_location_id ?? ''} className={input}>
            <option value="">— None —</option>
            {allLocations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Description</label>
          <MentionTextarea name="description" defaultValue={loc.description ?? ''} rows={5} className={`${input} resize-none`} />
        </div>
        <div className="flex gap-3 pt-2">
          <SubmitButton label="Save Changes" />
        </div>
      </form>

      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Sub-locations</h2>
          <Link href={`/locations/new?parent=${loc.id}`} className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">+ Add</Link>
        </div>
        {!subLocations.length ? (
          <p className="text-sm text-slate-500">None.</p>
        ) : (
          <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {subLocations.map((sub) => (
                  <tr key={sub.id} className="border-b border-slate-700/50 last:border-0 hover:bg-slate-700/50">
                    <td className="px-4 py-2.5">
                      <Link href={`/locations/${sub.id}`} className="font-medium text-slate-100 hover:text-indigo-400">{sub.name}</Link>
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">{sub.type ?? '—'}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${sub.visible ? 'bg-green-900/40 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                        {sub.visible ? 'Visible' : 'Hidden'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {shops.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Shops</h2>
          <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {shops.map((shop) => (
                  <tr key={shop.id} className="border-b border-slate-700/50 last:border-0 hover:bg-slate-700/50">
                    <td className="px-4 py-2.5 font-medium text-slate-100">{shop.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="border-t border-slate-700 pt-6">
        <form action={deleteLocation}>
          <input type="hidden" name="id" value={loc.id} />
          <button type="submit" className="rounded-md bg-red-900/30 border border-red-700 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-900/50">
            Delete Location
          </button>
        </form>
      </div>
    </div>
  )
}
