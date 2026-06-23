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

const input = 'block w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none'
const label = 'block text-sm font-medium text-slate-300 mb-1'
const smallInput = 'block w-full rounded border border-slate-600 bg-slate-700 px-2 py-1.5 text-xs text-slate-100 focus:border-indigo-400 outline-none'

interface MemberLink { id: string; role: string | null; npc_id: string }
interface PCMemberLink { id: string; role: string | null; pc_id: string }
interface SubFaction { id: string; name: string; visible: boolean }
interface SimpleNPC { id: string; name: string }
interface SimplePC { id: string; name: string }
interface FactionRel { id: string; to_faction_id: string; relationship_type: string }
interface FactionLoc { id: string; location_id: string }

const REL_STYLE: Record<string, string> = {
  allied:      'bg-green-900/40 text-green-400',
  friendly:    'bg-blue-900/40 text-blue-300',
  neutral:     'bg-slate-700 text-slate-400',
  unfriendly:  'bg-amber-900/30 text-amber-300',
  hostile:     'bg-red-900/30 text-red-400',
  war:         'bg-red-900/50 text-red-300',
}

export default async function FactionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = db()

  const { data: raw } = await supabase.from('factions').select('*').eq('id', id).single()
  if (!raw) notFound()
  const faction = raw as Faction

  const [r1, r2, r3, r4, r5, r6, r7, r8, r9, r10] = await Promise.all([
    supabase.from('factions').select('id, name').neq('id', id).order('name'),
    supabase.from('factions').select('id, name, visible').eq('parent_faction_id', id).order('name'),
    supabase.from('npc_factions').select('id, role, npc_id').eq('faction_id', id),
    supabase.from('npcs').select('id, name').order('name'),
    supabase.from('species').select('id, name').order('name'),
    supabase.from('cultures').select('id, name').order('name'),
    supabase.from('faction_relationships').select('id, to_faction_id, relationship_type').eq('from_faction_id', id).order('created_at'),
    supabase.from('faction_locations').select('id, location_id').eq('faction_id', id).order('created_at'),
    supabase.from('locations').select('id, name').order('name'),
    supabase.from('pc_factions').select('id, role, pc_id').eq('faction_id', id),
  ])

  const allFactions   = (r1.data ?? []) as Array<{ id: string; name: string }>
  const subFactions   = (r2.data ?? []) as SubFaction[]
  const memberLinks   = (r3.data ?? []) as MemberLink[]
  const allNpcs       = (r4.data ?? []) as SimpleNPC[]
  const speciesList   = (r5.data ?? []) as Array<{ id: string; name: string }>
  const culturesList  = (r6.data ?? []) as Array<{ id: string; name: string }>
  const factionRels   = (r7.data ?? []) as FactionRel[]
  const factionLocs   = (r8.data ?? []) as FactionLoc[]
  const allLocations  = (r9.data ?? []) as Array<{ id: string; name: string }>
  const pcMemberLinks = (r10.data ?? []) as PCMemberLink[]

  // Fetch only the PCs that are actually members
  const pcIds = pcMemberLinks.map(m => m.pc_id)
  let pcById: Record<string, SimplePC> = {}
  if (pcIds.length > 0) {
    const { data: pcRaw } = await supabase.from('player_characters').select('id, name').in('id', pcIds)
    const pcs = (pcRaw ?? []) as SimplePC[]
    pcById = Object.fromEntries(pcs.map(p => [p.id, p]))
  }

  const npcById      = Object.fromEntries(allNpcs.map((n) => [n.id, n]))
  const factionById  = Object.fromEntries(allFactions.map((f) => [f.id, f]))
  const locationById = Object.fromEntries(allLocations.map((l) => [l.id, l]))
  const speciesIdByName = Object.fromEntries(speciesList.map(s => [s.name, s.id]))
  const cultureIdByName = Object.fromEntries(culturesList.map(c => [c.name, c.id]))

  let parent: { id: string; name: string } | null = null
  if (faction.parent_faction_id) {
    const { data: p } = await supabase.from('factions').select('id, name').eq('id', faction.parent_faction_id).single()
    parent = p as { id: string; name: string } | null
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/factions" className="text-sm text-slate-400 hover:text-slate-300">Factions</Link>
        {parent && (
          <>
            <span className="text-slate-600">/</span>
            <Link href={`/factions/${parent.id}`} className="text-sm text-slate-400 hover:text-slate-300">{parent.name}</Link>
          </>
        )}
        <span className="text-slate-600">/</span>
        <span className="text-sm text-slate-100 font-medium">{faction.name}</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-100">{faction.name}</h1>
        <form action={toggleFactionVisibility}>
          <input type="hidden" name="id" value={faction.id} />
          <input type="hidden" name="visible" value={String(faction.visible)} />
          <button type="submit" className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
            faction.visible ? 'bg-green-900/40 text-green-400 border-green-700 hover:bg-green-900/60' : 'bg-slate-700 text-slate-400 border-slate-600 hover:bg-slate-600'
          }`}>
            {faction.visible ? 'Visible to players' : 'Hidden from players'}
          </button>
        </form>
      </div>

      <div className="flex gap-6 items-start">

        {/* ── Left: main content ── */}
        <div className="flex-1 min-w-0">
          <form action={updateFaction} className="bg-slate-800 rounded-lg border border-slate-700 p-6 space-y-5 mb-8">
            <input type="hidden" name="id" value={faction.id} />
            <div>
              <label className={label}>Name</label>
              <input spellCheck name="name" defaultValue={faction.name} required className={input} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-slate-300">Species / Ancestry</label>
                  {faction.species && speciesIdByName[faction.species] && (
                    <Link href={`/species/${speciesIdByName[faction.species]}`} className="text-xs text-indigo-400 hover:text-indigo-300">View →</Link>
                  )}
                </div>
                <select key={faction.species ?? ''} name="species" defaultValue={faction.species ?? ''} className={input}>
                  <option value="">— None —</option>
                  {speciesList.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-slate-300">Culture</label>
                  {faction.culture && cultureIdByName[faction.culture] && (
                    <Link href={`/cultures/${cultureIdByName[faction.culture]}`} className="text-xs text-indigo-400 hover:text-indigo-300">View →</Link>
                  )}
                </div>
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
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Sub-factions</h2>
              <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    {subFactions.map((sub) => (
                      <tr key={sub.id} className="border-b border-slate-700/50 last:border-0 hover:bg-slate-700/50">
                        <td className="px-4 py-2.5">
                          <Link href={`/factions/${sub.id}`} className="font-medium text-slate-100 hover:text-indigo-400">{sub.name}</Link>
                        </td>
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
            </section>
          )}

          {(memberLinks.length > 0 || pcMemberLinks.length > 0) && (
            <section className="mb-8">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Members</h2>
              <div className="flex flex-wrap gap-2">
                {memberLinks.map((m) => {
                  const npc = npcById[m.npc_id]
                  return npc ? (
                    <Link key={m.id} href={`/npcs/${npc.id}`} className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-sm text-slate-300 hover:border-indigo-300">
                      {npc.name}
                      {m.role && <span className="text-slate-500 text-xs">· {m.role}</span>}
                    </Link>
                  ) : null
                })}
                {pcMemberLinks.map((m) => {
                  const pc = pcById[m.pc_id]
                  return pc ? (
                    <Link key={m.id} href={`/player-characters/${pc.id}`} className="inline-flex items-center gap-1.5 rounded-full border border-indigo-700 bg-indigo-900/30 px-3 py-1 text-sm text-indigo-300 hover:border-indigo-400">
                      {pc.name}
                      {m.role && <span className="text-indigo-400 text-xs">· {m.role}</span>}
                    </Link>
                  ) : null
                })}
              </div>
            </section>
          )}

          <div className="border-t border-slate-700 pt-6">
            <form action={deleteFaction}>
              <input type="hidden" name="id" value={faction.id} />
              <button type="submit" className="rounded-md bg-red-900/30 border border-red-700 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-900/50">
                Delete Faction
              </button>
            </form>
          </div>
        </div>

        {/* ── Right: sidebar ── */}
        <div className="w-64 shrink-0 space-y-4">

          {/* Related Factions panel */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-700/50 bg-slate-800">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Stance</h3>
            </div>
            <div className="p-3 space-y-1">
              {factionRels.length === 0 && (
                <p className="text-xs text-slate-500 px-1 py-1">No relationships defined.</p>
              )}
              {factionRels.map((rel) => {
                const f = factionById[rel.to_faction_id]
                if (!f) return null
                return (
                  <div key={rel.id} className="flex items-center gap-2 group rounded px-1 py-1.5 hover:bg-slate-700/50">
                    <div className="flex-1 min-w-0">
                      <Link href={`/factions/${f.id}`} className="text-sm font-medium text-slate-100 hover:text-indigo-400 block truncate">
                        {f.name}
                      </Link>
                      <span className={`inline-flex rounded-full px-1.5 py-0.5 text-xs font-medium ${REL_STYLE[rel.relationship_type] ?? 'bg-slate-700 text-slate-400'}`}>
                        {rel.relationship_type}
                      </span>
                    </div>
                    <form action={removeFactionRelationship}>
                      <input type="hidden" name="id" value={rel.id} />
                      <input type="hidden" name="faction_id" value={id} />
                      <button type="submit" className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 text-xs pt-0.5">✕</button>
                    </form>
                  </div>
                )
              })}
            </div>
            <form action={addFactionRelationship} className="px-3 pb-3 pt-2 border-t border-slate-700/50 space-y-1.5">
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
          <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-700/50 bg-slate-800">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Locations</h3>
            </div>
            <div className="p-3 space-y-1">
              {factionLocs.length === 0 && (
                <p className="text-xs text-slate-500 px-1 py-1">No locations linked.</p>
              )}
              {factionLocs.map((loc) => {
                const l = locationById[loc.location_id]
                if (!l) return null
                return (
                  <div key={loc.id} className="flex items-center gap-2 group rounded px-1 py-1.5 hover:bg-slate-700/50">
                    <Link href={`/locations/${l.id}`} className="flex-1 text-sm font-medium text-slate-100 hover:text-indigo-400 truncate">
                      {l.name}
                    </Link>
                    <form action={removeFactionLocation}>
                      <input type="hidden" name="id" value={loc.id} />
                      <input type="hidden" name="faction_id" value={id} />
                      <button type="submit" className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 text-xs">✕</button>
                    </form>
                  </div>
                )
              })}
            </div>
            <form action={addFactionLocation} className="px-3 pb-3 pt-2 border-t border-slate-700/50 space-y-1.5">
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
