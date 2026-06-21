import { db } from '@/lib/db'
import { updateSpecies, deleteSpecies, setSpeciesOriginLocation } from '@/lib/actions/species'
import { Species } from '@ttrpg/db'
import MentionTextarea from '@/components/MentionTextarea'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const input = 'block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none'
const label = 'block text-sm font-medium text-zinc-700 mb-1'
const smallInput = 'block w-full rounded border border-zinc-300 px-2 py-1.5 text-xs text-zinc-900 focus:border-indigo-500 outline-none'

export default async function SpeciesDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = db()

  const results = await Promise.all([
    supabase.from('species').select('*').eq('id', id).single(),
    supabase.from('locations').select('id, name').order('name'),
  ])

  const raw = results[0].data
  if (!raw) notFound()
  const species = raw as Species

  const allLocations = (results[1].data ?? []) as Array<{ id: string; name: string }>

  let originLocation: { id: string; name: string } | null = null
  if (species.origin_location_id) {
    originLocation = allLocations.find(l => l.id === species.origin_location_id) ?? null
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/species" className="text-sm text-zinc-500 hover:text-zinc-700">Species</Link>
        <span className="text-zinc-300">/</span>
        <span className="text-sm text-zinc-900 font-medium">{species.name}</span>
      </div>
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">{species.name}</h1>

      <div className="flex gap-6 items-start">

        {/* ── Left: main content ── */}
        <div className="flex-1 min-w-0">
          <form action={updateSpecies} className="bg-white rounded-lg border border-zinc-200 p-6 space-y-5 mb-8">
            <input type="hidden" name="id" value={species.id} />
            <div>
              <label className={label}>Name</label>
              <input name="name" defaultValue={species.name} required className={input} />
            </div>
            <div>
              <label className={label}>Description</label>
              <MentionTextarea name="description" defaultValue={species.description ?? ''} rows={6} placeholder="Physical traits, cultural tendencies, origins…" className={`${input} resize-none`} />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                Save Changes
              </button>
            </div>
          </form>

          <div className="border-t border-zinc-200 pt-6">
            <form action={deleteSpecies}>
              <input type="hidden" name="id" value={species.id} />
              <button type="submit" className="rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100">
                Delete Species
              </button>
            </form>
          </div>
        </div>

        {/* ── Right: sidebar ── */}
        <div className="w-64 shrink-0 space-y-4">

          {/* Origin Location panel */}
          <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-zinc-100 bg-zinc-50">
              <h3 className="text-xs font-semibold text-zinc-600 uppercase tracking-wide">Origin Location</h3>
            </div>
            <div className="p-3">
              {originLocation && (
                <div className="mb-2">
                  <Link href={`/locations/${originLocation.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                    {originLocation.name}
                  </Link>
                </div>
              )}
              <form action={setSpeciesOriginLocation} className="space-y-1.5">
                <input type="hidden" name="id" value={species.id} />
                <select
                  key={species.origin_location_id ?? ''}
                  name="origin_location_id"
                  defaultValue={species.origin_location_id ?? ''}
                  className={smallInput}
                >
                  <option value="">— Unknown —</option>
                  {allLocations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
                <button type="submit" className="w-full rounded bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-700">
                  Set Location
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
