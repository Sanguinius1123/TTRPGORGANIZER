import { db } from '@/lib/db'
import { updateFaction, deleteFaction, toggleFactionVisibility } from '@/lib/actions/factions'
import { Faction } from '@ttrpg/db'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const input = 'block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none'
const label = 'block text-sm font-medium text-zinc-700 mb-1'

interface MemberLink { id: string; role: string | null; npc_id: string }
interface SubFaction { id: string; name: string; disposition: string | null; visible: boolean }
interface SimpleNPC { id: string; name: string }

export default async function FactionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = db()

  const { data: raw } = await supabase.from('factions').select('*').eq('id', id).single()
  if (!raw) notFound()
  const faction = raw as Faction

  const [r1, r2, r3, r4] = await Promise.all([
    supabase.from('factions').select('id, name').neq('id', id).order('name'),
    supabase.from('factions').select('id, name, disposition, visible').eq('parent_faction_id', id).order('name'),
    supabase.from('npc_factions').select('id, role, npc_id').eq('faction_id', id),
    supabase.from('npcs').select('id, name').order('name'),
  ])

  const allFactions = (r1.data ?? []) as Array<{ id: string; name: string }>
  const subFactions = (r2.data ?? []) as SubFaction[]
  const memberLinks = (r3.data ?? []) as MemberLink[]
  const allNpcs = (r4.data ?? []) as SimpleNPC[]
  const npcById = Object.fromEntries(allNpcs.map((n) => [n.id, n]))

  let parent: { id: string; name: string } | null = null
  if (faction.parent_faction_id) {
    const { data: p } = await supabase.from('factions').select('id, name').eq('id', faction.parent_faction_id).single()
    parent = p as { id: string; name: string } | null
  }

  return (
    <div className="p-8 max-w-3xl">
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

      <form action={updateFaction} className="bg-white rounded-lg border border-zinc-200 p-6 space-y-5 mb-8">
        <input type="hidden" name="id" value={faction.id} />
        <div>
          <label className={label}>Name</label>
          <input name="name" defaultValue={faction.name} required className={input} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Disposition</label>
            <input name="disposition" defaultValue={faction.disposition ?? ''} placeholder="allied, neutral, hostile…" className={input} />
          </div>
          <div>
            <label className={label}>Parent Faction</label>
            <select name="parent_faction_id" defaultValue={faction.parent_faction_id ?? ''} className={input}>
              <option value="">— None —</option>
              {allFactions.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className={label}>Goal</label>
          <input name="goal" defaultValue={faction.goal ?? ''} className={input} />
        </div>
        <div>
          <label className={label}>Description</label>
          <textarea name="description" defaultValue={faction.description ?? ''} rows={5} className={`${input} resize-none`} />
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
                    <td className="px-4 py-2.5 text-zinc-500">{sub.disposition ?? '—'}</td>
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
  )
}
