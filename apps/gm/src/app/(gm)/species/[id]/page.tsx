import { db } from '@/lib/db'
import { updateSpecies, deleteSpecies, setSpeciesOriginLocation, toggleSpeciesVisibility } from '@/lib/actions/species'
import { Species } from '@ttrpg/db'
import MentionTextarea from '@/components/MentionTextarea'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SubmitButton } from '@/components/SubmitButton'

const input = 'block w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none'
const label = 'block text-sm font-medium text-slate-300 mb-1'
const smallInput = 'block w-full rounded border border-slate-600 bg-slate-700 px-2 py-1.5 text-xs text-slate-100 focus:border-indigo-400 outline-none'

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
        <Link href="/species" className="text-sm text-slate-400 hover:text-slate-300">Species</Link>
        <span className="text-slate-600">/</span>
        <span className="text-sm text-slate-100 font-medium">{species.name}</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-100">{species.name}</h1>
        <form action={async () => { 'use server'; await toggleSpeciesVisibility(id, !species.visible) }}>
          <button type="submit" className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
            species.visible
              ? 'bg-green-900/40 text-green-400 border-green-700 hover:bg-green-900/60'
              : 'bg-slate-700 text-slate-400 border-slate-600 hover:bg-slate-600'
          }`}>
            {species.visible ? 'Visible to players' : 'Hidden from players'}
          </button>
        </form>
      </div>

      <div className="flex gap-6 items-start">

        {/* ── Left: main content ── */}
        <div className="flex-1 min-w-0">
          <form action={updateSpecies} className="bg-slate-800 rounded-lg border border-slate-700 p-6 space-y-5 mb-8">
            <input type="hidden" name="id" value={species.id} />
            <div>
              <label className={label}>Name</label>
              <input spellCheck name="name" defaultValue={species.name} required className={input} />
            </div>
            <div>
              <label className={label}>Description</label>
              <MentionTextarea name="description" defaultValue={species.description ?? ''} rows={6} placeholder="Physical traits, cultural tendencies, origins…" className={`${input} resize-none`} />
            </div>
            <div className="rounded-lg border border-amber-800/50 bg-amber-950/20 p-4 space-y-2">
              <label className="block text-sm font-medium text-amber-400 mb-1">
                GM Notes <span className="text-xs text-amber-600 font-normal ml-1">— never shown to players</span>
              </label>
              <MentionTextarea name="gm_notes" defaultValue={species.gm_notes ?? ''} rows={4} className={`${input} resize-none`} />
            </div>
            <div className="flex gap-3 pt-2">
              <SubmitButton label="Save Changes" />
            </div>
          </form>

          <div className="border-t border-slate-700 pt-6">
            <form action={deleteSpecies}>
              <input type="hidden" name="id" value={species.id} />
              <button type="submit" className="rounded-md bg-red-900/30 border border-red-700 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-900/50">
                Delete Species
              </button>
            </form>
          </div>
        </div>

        {/* ── Right: sidebar ── */}
        <div className="w-64 shrink-0 space-y-4">

          {/* Origin Location panel */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-700/50 bg-slate-800">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Origin Location</h3>
            </div>
            <div className="p-3">
              {originLocation && (
                <div className="mb-2">
                  <Link href={`/locations/${originLocation.id}`} className="text-sm font-medium text-indigo-400 hover:text-indigo-300">
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
