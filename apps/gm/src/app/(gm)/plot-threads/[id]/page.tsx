import { db } from '@/lib/db'
import {
  updatePlotThread, deletePlotThread, togglePlotThreadVisibility,
  linkPlotThreadFaction, unlinkPlotThreadFaction,
  linkPlotThreadCharacter, unlinkPlotThreadCharacter,
} from '@/lib/actions/plot-threads'
import { PlotThread } from '@ttrpg/db'
import MentionTextarea from '@/components/MentionTextarea'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getActiveCampaignId } from '@/lib/activeCampaign'
import { SubmitButton } from '@/components/SubmitButton'

const input = 'block w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none'
const label = 'block text-sm font-medium text-slate-300 mb-1'
const smallInput = 'block w-full rounded border border-slate-600 bg-slate-700 px-2 py-1.5 text-xs text-slate-100 focus:border-indigo-400 outline-none'

interface ChildThread { id: string; title: string; type: string; status: string }
interface LinkedFaction { id: string; faction_id: string; faction_name: string }
interface LinkedCharacter { id: string; pc_id: string | null; npc_id: string | null; name: string; type: 'pc' | 'npc' }

export default async function PlotThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const campaignId = await getActiveCampaignId()
  const supabase = db()

  const { data: raw } = await supabase.from('plot_threads').select('*').eq('id', id).single()
  if (!raw) notFound()
  const thread = raw as PlotThread

  const cid = campaignId ?? thread.campaign_id
  const [r1, r2, r3, r4, r5, r6, r7] = await Promise.all([
    supabase.from('plot_threads').select('id, title').eq('campaign_id', cid).eq('type', 'objective').neq('id', id).order('title'),
    supabase.from('plot_threads').select('id, title, type, status').eq('parent_id', id).order('type').order('title'),
    supabase.from('plot_thread_factions').select('id, faction_id').eq('plot_thread_id', id),
    supabase.from('plot_thread_characters').select('id, pc_id, npc_id').eq('plot_thread_id', id),
    supabase.from('factions').select('id, name').eq('campaign_id', cid).order('name'),
    supabase.from('player_characters').select('id, name, player_name').eq('campaign_id', cid).order('name'),
    supabase.from('npcs').select('id, name').eq('campaign_id', cid).order('name'),
  ])

  const allObjectives  = (r1.data ?? []) as Array<{ id: string; title: string }>
  const children       = (r2.data ?? []) as ChildThread[]
  const factionLinks   = (r3.data ?? []) as Array<{ id: string; faction_id: string }>
  const charLinks      = (r4.data ?? []) as Array<{ id: string; pc_id: string | null; npc_id: string | null }>
  const allFactions    = (r5.data ?? []) as Array<{ id: string; name: string }>
  const allPCs         = (r6.data ?? []) as Array<{ id: string; name: string; player_name: string | null }>
  const allNPCs        = (r7.data ?? []) as Array<{ id: string; name: string }>

  let parent: { id: string; title: string } | null = null
  if (thread.parent_id) {
    const { data: p } = await supabase.from('plot_threads').select('id, title').eq('id', thread.parent_id).single()
    parent = p as { id: string; title: string } | null
  }

  const factionById = Object.fromEntries(allFactions.map(f => [f.id, f]))
  const pcById      = Object.fromEntries(allPCs.map(p => [p.id, p]))
  const npcById     = Object.fromEntries(allNPCs.map(n => [n.id, n]))

  const linkedFactionIds = new Set(factionLinks.map(l => l.faction_id))
  const linkedPcIds      = new Set(charLinks.filter(l => l.pc_id).map(l => l.pc_id!))
  const linkedNpcIds     = new Set(charLinks.filter(l => l.npc_id).map(l => l.npc_id!))

  const availFactions = allFactions.filter(f => !linkedFactionIds.has(f.id))
  const availPCs      = allPCs.filter(p => !linkedPcIds.has(p.id))
  const availNPCs     = allNPCs.filter(n => !linkedNpcIds.has(n.id))

  const linkedFactions: LinkedFaction[] = factionLinks
    .map(l => ({ id: l.id, faction_id: l.faction_id, faction_name: factionById[l.faction_id]?.name ?? l.faction_id }))
    .filter(l => l.faction_name)

  const linkedChars: LinkedCharacter[] = charLinks.map(l => {
    if (l.pc_id) {
      const pc = pcById[l.pc_id]
      return { id: l.id, pc_id: l.pc_id, npc_id: null, name: pc ? `${pc.name}${pc.player_name ? ` (${pc.player_name})` : ''}` : l.pc_id, type: 'pc' as const }
    } else {
      const npc = npcById[l.npc_id!]
      return { id: l.id, pc_id: null, npc_id: l.npc_id, name: npc?.name ?? l.npc_id!, type: 'npc' as const }
    }
  })

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/plot-threads" className="text-sm text-slate-500 hover:text-slate-300">Plot Threads</Link>
        {parent && (
          <>
            <span className="text-slate-600">/</span>
            <Link href={`/plot-threads/${parent.id}`} className="text-sm text-slate-500 hover:text-slate-300">{parent.title}</Link>
          </>
        )}
        <span className="text-slate-600">/</span>
        <span className="text-sm text-slate-100 font-medium">{thread.title}</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-100">{thread.title}</h1>
        <form action={togglePlotThreadVisibility}>
          <input type="hidden" name="id" value={thread.id} />
          <input type="hidden" name="visible" value={String(thread.visible)} />
          <button type="submit" className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
            thread.visible ? 'bg-green-900/40 text-green-400 border-green-700 hover:bg-green-900/60' : 'bg-slate-700 text-slate-400 border-slate-700 hover:bg-slate-600'
          }`}>
            {thread.visible ? 'Visible to players' : 'Hidden from players'}
          </button>
        </form>
      </div>

      <div className="flex gap-6 items-start">

        {/* ── Left: main form + children ── */}
        <div className="flex-1 min-w-0">
          <form action={updatePlotThread} className="bg-slate-800 rounded-lg border border-slate-700 p-6 space-y-5 mb-8">
            <input type="hidden" name="id" value={thread.id} />
            <div>
              <label className={label}>Title</label>
              <input spellCheck name="title" defaultValue={thread.title} required className={input} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={label}>Type</label>
                <select key={thread.type} name="type" defaultValue={thread.type} className={input}>
                  <option value="thread">Thread</option>
                  <option value="hook">Hook</option>
                  <option value="objective">Objective</option>
                </select>
              </div>
              <div>
                <label className={label}>Status</label>
                <select key={thread.status} name="status" defaultValue={thread.status} className={input}>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="abandoned">Abandoned</option>
                </select>
              </div>
            </div>
            <div>
              <label className={label}>Parent Objective</label>
              <select key={thread.parent_id ?? ''} name="parent_id" defaultValue={thread.parent_id ?? ''} className={input}>
                <option value="">— None —</option>
                {allObjectives.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Description</label>
              <MentionTextarea name="description" defaultValue={thread.description ?? ''} rows={4} className={`${input} resize-none`} />
            </div>
            <div>
              <label className={label}>Notes <span className="text-xs text-slate-500">(private)</span></label>
              <MentionTextarea name="notes" defaultValue={thread.notes ?? ''} rows={3} className={`${input} resize-none`} />
            </div>
            <div className="flex gap-3 pt-2">
              <SubmitButton label="Save Changes" />
            </div>
          </form>

          {children.length > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">Related Threads & Hooks</h2>
              <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    {children.map((c) => (
                      <tr key={c.id} className="border-b border-slate-700/50 last:border-0 hover:bg-slate-800">
                        <td className="px-4 py-2.5">
                          <Link href={`/plot-threads/${c.id}`} className="font-medium text-slate-100 hover:text-indigo-400">{c.title}</Link>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            c.type === 'objective' ? 'bg-indigo-900/40 text-indigo-300' :
                            c.type === 'hook' ? 'bg-amber-900/30 text-amber-300' :
                            'bg-slate-700 text-slate-300'
                          }`}>{c.type}</span>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            c.status === 'active' ? 'bg-green-900/40 text-green-400' :
                            c.status === 'completed' ? 'bg-slate-700 text-slate-500' :
                            'bg-red-900/30 text-red-400'
                          }`}>{c.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <div className="border-t border-slate-700 pt-6">
            <form action={deletePlotThread}>
              <input type="hidden" name="id" value={thread.id} />
              <button type="submit" className="rounded-md bg-red-900/30 border border-red-700 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-900/50">
                Delete Thread
              </button>
            </form>
          </div>
        </div>

        {/* ── Right: linked factions + characters ── */}
        <div className="w-64 shrink-0 space-y-4">

          {/* Factions */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-700/50">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Linked Factions</h3>
            </div>
            {availFactions.length > 0 && (
              <form action={linkPlotThreadFaction} className="px-3 pt-2.5 pb-2 border-b border-slate-700/50 flex gap-1.5">
                <input type="hidden" name="plot_thread_id" value={id} />
                <select name="faction_id" required className={`${smallInput} flex-1`}>
                  <option value="">Link faction…</option>
                  {availFactions.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
                <button type="submit" className="rounded bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 whitespace-nowrap">Add</button>
              </form>
            )}
            <div className="p-3 space-y-1">
              {linkedFactions.length === 0 && <p className="text-xs text-slate-500 px-1 py-1">No factions linked.</p>}
              {linkedFactions.map(l => (
                <div key={l.id} className="flex items-center gap-2 group rounded px-1 py-1.5 hover:bg-slate-700/50">
                  <Link href={`/factions/${l.faction_id}`} className="flex-1 text-sm text-slate-100 hover:text-indigo-400 truncate">{l.faction_name}</Link>
                  <form action={unlinkPlotThreadFaction}>
                    <input type="hidden" name="id" value={l.id} />
                    <input type="hidden" name="plot_thread_id" value={id} />
                    <button type="submit" className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 text-xs">✕</button>
                  </form>
                </div>
              ))}
            </div>
          </div>

          {/* Player Characters */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-700/50">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Linked Player Characters</h3>
            </div>
            {availPCs.length > 0 && (
              <form action={linkPlotThreadCharacter} className="px-3 pt-2.5 pb-2 border-b border-slate-700/50 flex gap-1.5">
                <input type="hidden" name="plot_thread_id" value={id} />
                <select name="pc_id" required className={`${smallInput} flex-1`}>
                  <option value="">Link character…</option>
                  {availPCs.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}{p.player_name ? ` (${p.player_name})` : ''}
                    </option>
                  ))}
                </select>
                <button type="submit" className="rounded bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 whitespace-nowrap">Add</button>
              </form>
            )}
            <div className="p-3 space-y-1">
              {linkedChars.filter(c => c.type === 'pc').length === 0 && <p className="text-xs text-slate-500 px-1 py-1">No characters linked.</p>}
              {linkedChars.filter(c => c.type === 'pc').map(c => (
                <div key={c.id} className="flex items-center gap-2 group rounded px-1 py-1.5 hover:bg-slate-700/50">
                  <Link href={`/player-characters/${c.pc_id}`} className="flex-1 text-sm text-slate-100 hover:text-indigo-400 truncate">{c.name}</Link>
                  <form action={unlinkPlotThreadCharacter}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="plot_thread_id" value={id} />
                    <button type="submit" className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 text-xs">✕</button>
                  </form>
                </div>
              ))}
            </div>
          </div>

          {/* NPCs */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-700/50">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Linked NPCs</h3>
            </div>
            {availNPCs.length > 0 && (
              <form action={linkPlotThreadCharacter} className="px-3 pt-2.5 pb-2 border-b border-slate-700/50 flex gap-1.5">
                <input type="hidden" name="plot_thread_id" value={id} />
                <select name="npc_id" required className={`${smallInput} flex-1`}>
                  <option value="">Link NPC…</option>
                  {availNPCs.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
                <button type="submit" className="rounded bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 whitespace-nowrap">Add</button>
              </form>
            )}
            <div className="p-3 space-y-1">
              {linkedChars.filter(c => c.type === 'npc').length === 0 && <p className="text-xs text-slate-500 px-1 py-1">No NPCs linked.</p>}
              {linkedChars.filter(c => c.type === 'npc').map(c => (
                <div key={c.id} className="flex items-center gap-2 group rounded px-1 py-1.5 hover:bg-slate-700/50">
                  <Link href={`/npcs/${c.npc_id}`} className="flex-1 text-sm text-slate-100 hover:text-indigo-400 truncate">{c.name}</Link>
                  <form action={unlinkPlotThreadCharacter}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="plot_thread_id" value={id} />
                    <button type="submit" className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 text-xs">✕</button>
                  </form>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
