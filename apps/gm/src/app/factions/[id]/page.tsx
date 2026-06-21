import { db } from '@/lib/db'
import {
  updateFaction, deleteFaction, toggleFactionVisibility,
  addFactionRelationship, removeFactionRelationship,
  addFactionLocation, removeFactionLocation,
} from '@/lib/actions/factions'
import { Faction } from '@ttrpg/db'
import MentionTextarea from '@/components/MentionTextarea'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const input = 'block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none'
const label = 'block text-sm font-medium text-zinc-700 mb-1'
const smallInput = 'block w-full rounded border border-zinc-300 px-2 py-1.5 text-xs text-zinc-900 focus:border-indigo-500 outline-none'

interface MemberLink { id: string; role: string | null; npc_id: string }
interface SubFaction { id: string; name: string; visible: boolean }
interface SimpleNPC { id: string; name: string }
interface FactionRel { id: string; to_faction_id: string; relationship_type: string }
interface FactionLoc { id: string; location_id: string }

const REL_STYLE: Record<string, string> = {
  allied:      'bg-green-100 text-green-700',
  friendly:    'bg-blue-100 text-blue-700',
  neutral:     'bg-zinc-100 text-zinc-600',
  unfriendly:  'bg-amber-100 text-amber-700',
  hostile:     'bg-red-100 text-red-700',
  war:         'bg-red-200 text-red-900',
}

export default async function FactionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = db()

  const { data: raw } = await supabase.from('factions').select('*').eq('id', id).single()
  if (!raw) notFound()
  const faction = raw as Faction

  const [r1, r2, r3, r4, r5, r6, r7, r8, r9] = await Promise.all([
    supabase.from('factions').select('id, name').neq('id', id).order('name'),
    supabase.from('factions').select('id, name, visible').eq('parent_faction_id', id).order('name'),
    supabase.from('npc_factions').select('id, role, npc_id').eq('faction_id', id),
    supabase.from('npcs').select('id, name').order('name'),
    supabase.from('species').select('id, name').order('name'),
    supabase.from('cultures').select('id, name').order('name'),
    supabase.from('faction_relationships').select('id, to_faction_id, relationship_type').eq('from_faction_id', id).order('created_at'),
    supabase.from('faction_locations').select('id, location_id').eq('faction_id', id).order('created_at'),
    supabase.from('locations').select('id, name').order('name'),
  ])

  const allFactions  = (r1.data ?? []) as Array<{ id: string; name: string }>
  const subFactions  = (r2.data ?? []) as SubFaction[]
  const memberLinks  = (r3.data ?? []) as MemberLink[]
  const allNpcs      = (r4.data ?? []) as SimpleNPC[]
  const speciesList  = (r5.data ?? []) as Array<{ id: string; name: string }>
  const culturesList = (r6.data ?? []) as Array<{ id: string; name: string }>
  const factionRels  = (r7.data ?? []) as FactionRel[]
  const factionLocs  = (r8.data ?? []) as FactionLoc[]
  const allLocations = (r9.data ?? []) as Array<{ id: string; name: string }>

  const npcById      = Object.fromEntries(allNpcs.map((n) => [n.id, n]))
  const factionById  = Object.fromEntries(allFactions.map((f) => [f.id, f]))
  const locationById = Object.fromEntries(allLocations.map((l) => [l.id, l]))

  let parent: { id: string; name: string } | null = null
  if (faction.parent_faction_id) {
    const { data: p } = await supabase.from('factions').select('id, name').eq('id', faction.parent_faction_id).single()
    parent = p as { id: string; name: string } | null
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/factions" className="text-sm text-zinc-500 hover:text-zinc-700">Factions</Link>
        {parent && (
          <>
            <span className="text-zinc-300">/</span>
            <Link href={`/factions/${parent.id}`} className="text-sm text-zinc-500 hover:text-zinc-700">{parent.name}</Link>
          </>
        )}
        <span className="text-zinc-300">/</span>
        <span className="text-sm text-zinc-900 font-medium">{faction.name}</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">{faction.name}</h1>
        <form action={toggleFactionVisibility}>
          <input type="hidden" name="id" value={faction.id} />
          <input type="hidden" name="visible" value={String(faction.visible)} />
          <button type="submit" className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
            faction.visible ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200'
          }`}>
            {faction.visible ? 'Visible to players' : 'Hidden from players'}
          </button>
        </form>
      </div>

      <div className="flex gap-6 items-start">

        {/* ── Left: main content ── */}
        <div className="flex-1 min-w-0">
          <form action={updateFaction} className="bg-white rounded-lg border border-zinc-200 p-6 space-y-5 mb-8">
            <input type="hidden" name="id" value={faction.id} />
            <div>
              <label className={label}>Name</label>
              <input name="name" defaultValue={faction.name} required className={input} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={label}>Species / Ancestry</label>
                <select key={faction.species ?? ''} name="species" defaultValue={faction.species ?? ''} className={input}>
                  <option value="">— None —</option>
                  {speciesList.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className={label}>Culture</label>
                <select key={faction.culture ?? ''} name="culture" defaultValue={faction.culture ?? ''} className={input}>
                  <option value="">— None —</option>
                  {culturesList.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={label}>Parent Faction</label>
              <select key={faction.parent_faction_id ?? ''} name="parent_faction_id" defaultValue={faction.parent_faction_id ?? ''} className={input}>
                <option value="">— None —</option>
                {allFactions.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Goal</label>
              <MentionTextarea name="goal" defaultValue={faction.goal ?? ''} rows={2} className={`${input} resize-none`} />
            </div>
            <div>
              <label className={label}>Description</label>
              <MentionTextarea name="description" defaultValue={faction.description ?? ''} rows={5} className={`${input} resize-none`} />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                Save Changes
              </button>
            </div>
          </form>

          {subFactions.length > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-semibold text-zinc-700 uppercase tracking-wide mb-3">Sub-factions</h2>
              <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    {subFactions.map((sub) => (
                      <tr key={sub.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                        <td className="px-4 py-2.5">
                          <Link href={`/factions/${sub.id}`} className="font-medium text-zinc-900 hover:text-indigo-600">{sub.name}</Link>
                        </td>
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
            </section>
          )}

          {memberLinks.length > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-semibold text-zinc-700 uppercase tracking-wide mb-3">Members</h2>
              <div className="flex flex-wrap gap-2">
                {memberLinks.map((m) => {
                  const npc = npcById[m.npc_id]
                  return npc ? (
                    <Link key={m.id} href={`/npcs/${npc.id}`} className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-sm text-zinc-700 hover:border-indigo-300">
                      {npc.name}
                      {m.role && <span className="text-zinc-400 text-xs">· {m.role}</span>}
                    </Link>
                  ) : null
                })}
              </div>
            </section>
          )}

          <div className="border-t border-zinc-200 pt-6">
            <form action={deleteFaction}>
              <input type="hidden" name="id" value={faction.id} />
              <button type="submit" className="rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100">
                Delete Faction
              </button>
            </form>
          </div>
        </div>

        {/* ── Right: sidebar ── */}
        <div className="w-64 shrink-0 space-y-4">

          {/* Related Factions panel */}
          <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-zinc-100 bg-zinc-50">
              <h3 className="text-xs font-semibold text-zinc-600 uppercase tracking-wide">Stance</h3>
            </div>
            <div className="p-3 space-y-1">
              {factionRels.length === 0 && (
                <p className="text-xs text-zinc-400 px-1 py-1">No relationships defined.</p>
              )}
              {factionRels.map((rel) => {
                const f = factionById[rel.to_faction_id]
                if (!f) return null
                return (
                  <div key={rel.id} className="flex items-center gap-2 group rounded px-1 py-1.5 hover:bg-zinc-50">
                    <div className="flex-1 min-w-0">
                      <Link href={`/factions/${f.id}`} className="text-sm font-medium text-zinc-900 hover:text-indigo-600 block truncate">
                        {f.name}
                      </Link>
                      <span className={`inline-flex rounded-full px-1.5 py-0.5 text-xs font-medium ${REL_STYLE[rel.relationship_type] ?? 'bg-zinc-100 text-zinc-600'}`}>
                        {rel.relationship_type}
                      </span>
                    </div>
                    <form action={removeFactionRelationship}>
                      <input type="hidden" name="id" value={rel.id} />
                      <input type="hidden" name="faction_id" value={id} />
                      <button type="submit" className="opacity-0 group-hover:opacity-100 text-zinc-300 hover:text-red-500 text-xs pt-0.5">✕</button>
                    </form>
                  </div>
                )
              })}
            </div>
            <form action={addFactionRelationship} className="px-3 pb-3 pt-2 border-t border-zinc-100 space-y-1.5">
              <input type="hidden" name="faction_id" value={id} />
              <select name="to_faction_id" required className={smallInput}>
                <option value="">Select faction…</option>
                {allFactions.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
              <div className="flex gap-1.5">
                <select name="relationship_type" className={`${smallInput} flex-1`}>
                  <option value="allied">Allied</option>
                  <option value="friendly">Friendly</option>
                  <option value="neutral">Neutral</option>
                  <option value="unfriendly">Unfriendly</option>
                  <option value="hostile">Hostile</option>
                  <option value="war">War</option>
                </select>
                <button type="submit" className="rounded bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 whitespace-nowrap">
                  Add
                </button>
              </div>
            </form>
          </div>

          {/* Locations panel */}
          <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-zinc-100 bg-zinc-50">
              <h3 className="text-xs font-semibold text-zinc-600 uppercase tracking-wide">Locations</h3>
            </div>
            <div className="p-3 space-y-1">
              {factionLocs.length === 0 && (
                <p className="text-xs text-zinc-400 px-1 py-1">No locations linked.</p>
              )}
              {factionLocs.map((loc) => {
                const l = locationById[loc.location_id]
                if (!l) return null
                return (
                  <div key={loc.id} className="flex items-center gap-2 group rounded px-1 py-1.5 hover:bg-zinc-50">
                    <Link href={`/locations/${l.id}`} className="flex-1 text-sm font-medium text-zinc-900 hover:text-indigo-600 truncate">
                      {l.name}
                    </Link>
                    <form action={removeFactionLocation}>
                      <input type="hidden" name="id" value={loc.id} />
                      <input type="hidden" name="faction_id" value={id} />
                      <button type="submit" className="opacity-0 group-hover:opacity-100 text-zinc-300 hover:text-red-500 text-xs">✕</button>
                    </form>
                  </div>
                )
              })}
            </div>
            <form action={addFactionLocation} className="px-3 pb-3 pt-2 border-t border-zinc-100 space-y-1.5">
              <input type="hidden" name="faction_id" value={id} />
              <select name="location_id" required className={smallInput}>
                <option value="">Add location…</option>
                {allLocations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
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
