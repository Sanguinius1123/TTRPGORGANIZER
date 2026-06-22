import { db } from '@/lib/db'
import { updateLocation, deleteLocation, toggleLocationVisibility } from '@/lib/actions/locations'
import { Location } from '@ttrpg/db'
import MentionTextarea from '@/components/MentionTextarea'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const input = 'block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none'
const label = 'block text-sm font-medium text-zinc-700 mb-1'

const LOCATION_TYPES = [
  'Sector', 'Star System', 'Star / Singularity', 'World', 'Space Station',
  'Wilderness', 'Ruin', 'Settlement', 'District',
  'Fortification', 'Residence', 'Commerce', 'Tavern / Inn', 'Place of Worship',
  'Government', 'Prison', 'Guild / Organization', 'Workshop',
  'Research / Laboratory', 'Medical / Healthcare', 'Entertainment', 'Transport Hub',
]

interface SubLocation { id: string; name: string; type: string | null; visible: boolean }

export default async function LocationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = db()

  const { data: raw } = await supabase.from('locations').select('*').eq('id', id).single()
  if (!raw) notFound()
  const loc = raw as Location

  const [r1, r2, r3] = await Promise.all([
    supabase.from('locations').select('id, name').neq('id', id).order('name'),
    supabase.from('locations').select('id, name, type, visible').eq('parent_location_id', id).order('name'),
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
        <Link href="/locations" className="text-sm text-zinc-500 hover:text-zinc-700">Locations</Link>
        {parent && (
          <>
            <span className="text-zinc-300">/</span>
            <Link href={`/locations/${parent.id}`} className="text-sm text-zinc-500 hover:text-zinc-700">{parent.name}</Link>
          </>
        )}
        <span className="text-zinc-300">/</span>
        <span className="text-sm text-zinc-900 font-medium">{loc.name}</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">{loc.name}</h1>
        <form action={toggleLocationVisibility}>
          <input type="hidden" name="id" value={loc.id} />
          <input type="hidden" name="visible" value={String(loc.visible)} />
          <button type="submit" className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
            loc.visible
              ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
              : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200'
          }`}>
            {loc.visible ? 'Visible to players' : 'Hidden from players'}
          </button>
        </form>
      </div>

      <form action={updateLocation} className="bg-white rounded-lg border border-zinc-200 p-6 space-y-5 mb-8">
        <input type="hidden" name="id" value={loc.id} />
        <div>
          <label className={label}>Name</label>
          <input name="name" defaultValue={loc.name} required className={input} />
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
            <input name="descriptor" defaultValue={loc.descriptor ?? ''} placeholder="Ocean World, Frontier Colony…" className={input} />
          </div>
        </div>
        <div>
          <label className={label}>Status</label>
          <input name="status" defaultValue={loc.status ?? ''} placeholder="active, abandoned…" className={input} />
        </div>
        <div>
          <label className={label}>Area</label>
          <input name="area" defaultValue={loc.area ?? ''} placeholder="Relative position within parent" className={input} />
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
          <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Save Changes
          </button>
        </div>
      </form>

      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-zinc-700 uppercase tracking-wide">Sub-locations</h2>
          <Link href={`/locations/new?parent=${loc.id}`} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">+ Add</Link>
        </div>
        {!subLocations.length ? (
          <p className="text-sm text-zinc-400">None.</p>
        ) : (
          <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {subLocations.map((sub) => (
                  <tr key={sub.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                    <td className="px-4 py-2.5">
                      <Link href={`/locations/${sub.id}`} className="font-medium text-zinc-900 hover:text-indigo-600">{sub.name}</Link>
                    </td>
                    <td className="px-4 py-2.5 text-zinc-500">{sub.type ?? '—'}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${sub.visible ? 'bg-green-100 text-green-800' : 'bg-zinc-100 text-zinc-600'}`}>
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
          <h2 className="text-sm font-semibold text-zinc-700 uppercase tracking-wide mb-3">Shops</h2>
          <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {shops.map((shop) => (
                  <tr key={shop.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                    <td className="px-4 py-2.5 font-medium text-zinc-900">{shop.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="border-t border-zinc-200 pt-6">
        <form action={deleteLocation}>
          <input type="hidden" name="id" value={loc.id} />
          <button type="submit" className="rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100">
            Delete Location
          </button>
        </form>
      </div>
    </div>
  )
}
