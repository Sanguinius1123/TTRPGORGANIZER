import { db } from '@/lib/db'
import { updateCulture, deleteCulture, addCultureLocation, removeCultureLocation } from '@/lib/actions/cultures'
import { Culture } from '@ttrpg/db'
import MentionTextarea from '@/components/MentionTextarea'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const input = 'block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none'
const label = 'block text-sm font-medium text-zinc-700 mb-1'
const smallInput = 'block w-full rounded border border-zinc-300 px-2 py-1.5 text-xs text-zinc-900 focus:border-indigo-500 outline-none'

interface CultureLoc { id: string; location_id: string }

export default async function CultureDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = db()

  const results = await Promise.all([
    supabase.from('cultures').select('*').eq('id', id).single(),
    supabase.from('culture_locations').select('id, location_id').eq('culture_id', id).order('created_at'),
    supabase.from('locations').select('id, name').order('name'),
  ])

  const raw = results[0].data
  if (!raw) notFound()
  const culture = raw as Culture

  const cultureLocLinks = (results[1].data ?? []) as CultureLoc[]
  const allLocations = (results[2].data ?? []) as Array<{ id: string; name: string }>
  const locationById = Object.fromEntries(allLocations.map(l => [l.id, l]))

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/cultures" className="text-sm text-zinc-500 hover:text-zinc-700">Cultures</Link>
        <span className="text-zinc-300">/</span>
        <span className="text-sm text-zinc-900 font-medium">{culture.name}</span>
      </div>
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">{culture.name}</h1>

      <div className="flex gap-6 items-start">

        {/* ── Left: main content ── */}
        <div className="flex-1 min-w-0">
          <form action={updateCulture} className="bg-white rounded-lg border border-zinc-200 p-6 space-y-5 mb-8">
            <input type="hidden" name="id" value={culture.id} />
            <div>
              <label className={label}>Name</label>
              <input name="name" defaultValue={culture.name} required className={input} />
            </div>
            <div>
              <label className={label}>Description</label>
              <MentionTextarea name="description" defaultValue={culture.description ?? ''} rows={6} placeholder="Values, customs, traditions, social structure…" className={`${input} resize-none`} />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                Save Changes
              </button>
            </div>
          </form>

          <div className="border-t border-zinc-200 pt-6">
            <form action={deleteCulture}>
              <input type="hidden" name="id" value={culture.id} />
              <button type="submit" className="rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100">
                Delete Culture
              </button>
            </form>
          </div>
        </div>

        {/* ── Right: sidebar ── */}
        <div className="w-64 shrink-0 space-y-4">

          {/* Locations panel */}
          <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-zinc-100 bg-zinc-50">
              <h3 className="text-xs font-semibold text-zinc-600 uppercase tracking-wide">Locations</h3>
            </div>
            <div className="p-3 space-y-1">
              {cultureLocLinks.length === 0 && (
                <p className="text-xs text-zinc-400 px-1 py-1">No locations linked.</p>
              )}
              {cultureLocLinks.map((link) => {
                const loc = locationById[link.location_id]
                if (!loc) return null
                return (
                  <div key={link.id} className="flex items-center gap-2 group rounded px-1 py-1.5 hover:bg-zinc-50">
                    <Link href={`/locations/${loc.id}`} className="flex-1 text-sm font-medium text-zinc-900 hover:text-indigo-600 truncate">
                      {loc.name}
                    </Link>
                    <form action={removeCultureLocation}>
                      <input type="hidden" name="id" value={link.id} />
                      <input type="hidden" name="culture_id" value={id} />
                      <button type="submit" className="opacity-0 group-hover:opacity-100 text-zinc-300 hover:text-red-500 text-xs">✕</button>
                    </form>
                  </div>
                )
              })}
            </div>
            <form action={addCultureLocation} className="px-3 pb-3 pt-2 border-t border-zinc-100 space-y-1.5">
              <input type="hidden" name="culture_id" value={id} />
              <select name="location_id" required className={smallInput}>
                <option value="">Add location…</option>
                {allLocations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
              <button type="submit" className="w-full rounded bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-700">
                Add
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  )
}
