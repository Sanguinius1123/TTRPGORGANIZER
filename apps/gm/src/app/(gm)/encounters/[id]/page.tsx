import { db } from '@/lib/db'
import {
  updateEncounter, deleteEncounter, addParticipant, deleteParticipant,
  duplicateEncounter, linkEncounterSession, unlinkEncounterSession,
} from '@/lib/actions/encounters'
import { Encounter } from '@ttrpg/db'
import MentionTextarea from '@/components/MentionTextarea'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getActiveCampaignId } from '@/lib/activeCampaign'
import { SubmitButton } from '@/components/SubmitButton'

const input = 'block w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none'
const label = 'block text-sm font-medium text-slate-300 mb-1'
const smallInput = 'block w-full rounded border border-slate-600 bg-slate-700 px-2 py-1.5 text-xs text-slate-100 focus:border-indigo-400 outline-none'

interface EncParticipant {
  id: string
  label: string
  count: number
  role: string | null
  dr: number | null
  npc_id: string | null
}
interface SimpleNPC { id: string; name: string }
interface SessionLink { session_id: string }
interface SessionRow  { id: string; session_number: number; title: string | null }

const roleColor: Record<string, string> = {
  enemy:   'text-red-600',
  ally:    'text-green-400',
  neutral: 'text-slate-500',
}

function formatDr(dr: number): string {
  return Number.isInteger(dr) ? String(dr) : dr.toFixed(2).replace(/\.?0+$/, '')
}

export default async function EncounterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const campaignId = await getActiveCampaignId()
  const supabase = db()

  const { data: raw } = await supabase.from('encounters').select('*').eq('id', id).single()
  if (!raw) notFound()
  const enc = raw as Encounter

  const cid = campaignId ?? enc.campaign_id
  const [r1, r2, r3, r4, r5] = await Promise.all([
    supabase.from('encounter_participants').select('id, label, count, role, dr, npc_id').eq('encounter_id', id).order('created_at'),
    supabase.from('locations').select('id, name').eq('campaign_id', cid).order('name'),
    supabase.from('npcs').select('id, name').eq('campaign_id', cid).order('name'),
    supabase.from('session_encounters').select('session_id').eq('encounter_id', id),
    supabase.from('sessions').select('id, session_number, title').eq('campaign_id', cid).order('session_number', { ascending: false }),
  ])

  const parts     = (r1.data ?? []) as EncParticipant[]
  const locations = (r2.data ?? []) as Array<{ id: string; name: string }>
  const npcs      = (r3.data ?? []) as SimpleNPC[]
  const npcById   = Object.fromEntries(npcs.map((n) => [n.id, n]))
  const linkedSessionLinks = (r4.data ?? []) as SessionLink[]
  const allSessions        = (r5.data ?? []) as SessionRow[]

  const linkedSessionIds = new Set(linkedSessionLinks.map(l => l.session_id))
  const linkedSessions   = allSessions.filter(s => linkedSessionIds.has(s.id))
  const availSessions    = allSessions.filter(s => !linkedSessionIds.has(s.id))

  // Compute net DR: enemies add (dr × count), allies subtract (dr × count)
  const netDr = parts.reduce((sum, p) => {
    if (!p.dr) return sum
    if (p.role === 'enemy') return sum + p.dr * p.count
    if (p.role === 'ally')  return sum - p.dr * p.count
    return sum
  }, 0)
  const hasDr = parts.some(p => p.dr !== null)

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/encounters" className="text-sm text-slate-500 hover:text-slate-300">Encounters</Link>
        <span className="text-slate-600">/</span>
        <span className="text-sm text-slate-100 font-medium">{enc.title}</span>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-100">{enc.title}</h1>
        {hasDr && (
          <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-sm font-semibold border ${
            netDr > 0
              ? 'bg-red-900/30 text-red-400 border-red-700'
              : netDr < 0
              ? 'bg-green-900/40 text-green-400 border-green-700'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            Net DR {formatDr(netDr)}
          </span>
        )}
      </div>

      <div className="flex gap-6 items-start">
        {/* ── Left: main content ── */}
        <div className="flex-1 min-w-0">
          <form action={updateEncounter} className="bg-slate-800 rounded-lg border border-slate-700 p-6 space-y-5 mb-8">
            <input type="hidden" name="id" value={enc.id} />
            <div>
              <label className={label}>Title</label>
              <input spellCheck name="title" defaultValue={enc.title} required className={input} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={label}>Location</label>
                <select key={enc.location_id ?? ''} name="location_id" defaultValue={enc.location_id ?? ''} className={input}>
                  <option value="">— None —</option>
                  {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label className={label}>Status</label>
                <select key={enc.status} name="status" defaultValue={enc.status} className={input}>
                  <option value="prep">Prep</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
            <div>
              <label className={label}>Notes</label>
              <MentionTextarea name="notes" defaultValue={enc.notes ?? ''} rows={4} placeholder="Setup, tactics, terrain, objectives…" className={`${input} resize-none`} />
            </div>
            <div>
              <label className={label}>Summary <span className="text-xs text-slate-500">(fill in after the encounter)</span></label>
              <MentionTextarea name="summary" defaultValue={enc.summary ?? ''} rows={3} className={`${input} resize-none`} />
            </div>
            <div className="flex gap-3 pt-2">
              <SubmitButton label="Save Changes" />
            </div>
          </form>

          <section className="mb-8">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">Participants</h2>
            {!parts.length ? (
              <p className="text-sm text-slate-500 mb-3">No participants yet.</p>
            ) : (
              <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden mb-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 bg-slate-800">
                      <th className="text-left px-4 py-2.5 font-medium text-slate-400">Label</th>
                      <th className="text-left px-4 py-2.5 font-medium text-slate-400">Count</th>
                      <th className="text-left px-4 py-2.5 font-medium text-slate-400">DR</th>
                      <th className="text-left px-4 py-2.5 font-medium text-slate-400">Role</th>
                      <th className="text-left px-4 py-2.5 font-medium text-slate-400">NPC</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {parts.map((p) => {
                      const linkedNpc = p.npc_id ? npcById[p.npc_id] : null
                      return (
                        <tr key={p.id} className="border-b border-slate-700/50 last:border-0">
                          <td className="px-4 py-2.5 font-medium text-slate-100">{p.label}</td>
                          <td className="px-4 py-2.5 text-slate-500">{p.count}</td>
                          <td className="px-4 py-2.5 text-slate-500">{p.dr !== null ? formatDr(p.dr) : '—'}</td>
                          <td className={`px-4 py-2.5 font-medium ${roleColor[p.role ?? ''] ?? 'text-slate-500'}`}>
                            {p.role ?? '—'}
                          </td>
                          <td className="px-4 py-2.5">
                            {linkedNpc
                              ? <Link href={`/npcs/${linkedNpc.id}`} className="text-indigo-400 hover:text-indigo-300">{linkedNpc.name}</Link>
                              : <span className="text-slate-500">—</span>}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <form action={deleteParticipant}>
                              <input type="hidden" name="id" value={p.id} />
                              <input type="hidden" name="encounter_id" value={id} />
                              <button type="submit" className="text-slate-600 hover:text-red-500 text-xs">✕</button>
                            </form>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <form action={addParticipant} className="bg-slate-800 rounded-lg border border-slate-700 p-4 space-y-3">
              <input type="hidden" name="encounter_id" value={id} />
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-2">
                  <label className={label}>Label</label>
                  <input spellCheck name="label" required placeholder="6 Guards, The Warlord…" className={input} />
                </div>
                <div>
                  <label className={label}>Count</label>
                  <input name="count" type="number" min="1" defaultValue="1" className={input} />
                </div>
                <div>
                  <label className={label}>DR</label>
                  <input name="dr" type="number" min="0" step="any" placeholder="—" className={input} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={label}>Role</label>
                  <select name="role" className={input}>
                    <option value="enemy">Enemy</option>
                    <option value="neutral">Neutral</option>
                    <option value="ally">Ally</option>
                  </select>
                </div>
                <div>
                  <label className={label}>Linked NPC <span className="text-xs text-slate-500">(optional)</span></label>
                  <select name="npc_id" className={input}>
                    <option value="">— None —</option>
                    {npcs.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                Add Participant
              </button>
            </form>
          </section>

          <div className="border-t border-slate-700 pt-6 flex gap-3">
            <form action={duplicateEncounter}>
              <input type="hidden" name="id" value={enc.id} />
              <button type="submit" className="rounded-md bg-slate-700 border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-600">
                Duplicate Encounter
              </button>
            </form>
            <form action={deleteEncounter}>
              <input type="hidden" name="id" value={enc.id} />
              <button type="submit" className="rounded-md bg-red-900/30 border border-red-700 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-900/50">
                Delete Encounter
              </button>
            </form>
          </div>
        </div>

        {/* ── Right: sessions sidebar ── */}
        <div className="w-64 shrink-0">
          <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-700/50 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Sessions</h3>
              <Link href="/sessions/new" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">+ New</Link>
            </div>
            {availSessions.length > 0 && (
              <form action={linkEncounterSession} className="px-3 pt-2.5 pb-2 border-b border-slate-700/50 flex gap-1.5">
                <input type="hidden" name="encounter_id" value={id} />
                <select name="session_id" required className={`${smallInput} flex-1`}>
                  <option value="">Link session…</option>
                  {availSessions.map(s => (
                    <option key={s.id} value={s.id}>
                      #{s.session_number}{s.title ? ` — ${s.title}` : ''}
                    </option>
                  ))}
                </select>
                <button type="submit" className="rounded bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 whitespace-nowrap">
                  Add
                </button>
              </form>
            )}
            <div className="p-3 space-y-1">
              {linkedSessions.length === 0 && (
                <p className="text-xs text-slate-500 px-1 py-1">No sessions linked.</p>
              )}
              {linkedSessions.map((s) => (
                <div key={s.id} className="flex items-center gap-2 group rounded px-1 py-1.5 hover:bg-slate-700/50">
                  <Link href={`/sessions/${s.id}`} className="flex-1 text-sm text-slate-100 hover:text-indigo-400 truncate">
                    #{s.session_number}{s.title ? ` — ${s.title}` : ''}
                  </Link>
                  <form action={unlinkEncounterSession}>
                    <input type="hidden" name="encounter_id" value={id} />
                    <input type="hidden" name="session_id" value={s.id} />
                    <button type="submit" className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 text-xs shrink-0">✕</button>
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
