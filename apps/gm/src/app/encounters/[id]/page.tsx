import { db } from '@/lib/db'
import { updateEncounter, deleteEncounter, addParticipant, deleteParticipant } from '@/lib/actions/encounters'
import { Encounter } from '@ttrpg/db'
import MentionTextarea from '@/components/MentionTextarea'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const input = 'block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none'
const label = 'block text-sm font-medium text-zinc-700 mb-1'

interface EncParticipant {
  id: string
  label: string
  count: number
  role: string | null
  dr: number | null
  npc_id: string | null
}
interface SimpleNPC { id: string; name: string }

const roleColor: Record<string, string> = {
  enemy:   'text-red-600',
  ally:    'text-green-600',
  neutral: 'text-zinc-500',
}

function formatDr(dr: number): string {
  return Number.isInteger(dr) ? String(dr) : dr.toFixed(2).replace(/\.?0+$/, '')
}

export default async function EncounterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = db()

  const { data: raw } = await supabase.from('encounters').select('*').eq('id', id).single()
  if (!raw) notFound()
  const enc = raw as Encounter

  const [r1, r2, r3, r4] = await Promise.all([
    supabase.from('encounter_participants').select('id, label, count, role, dr, npc_id').eq('encounter_id', id).order('created_at'),
    supabase.from('locations').select('id, name').order('name'),
    supabase.from('sessions').select('id, session_number, title').order('session_number', { ascending: false }),
    supabase.from('npcs').select('id, name').order('name'),
  ])

  const parts    = (r1.data ?? []) as EncParticipant[]
  const locations = (r2.data ?? []) as Array<{ id: string; name: string }>
  const sessions  = (r3.data ?? []) as Array<{ id: string; session_number: number; title: string | null }>
  const npcs      = (r4.data ?? []) as SimpleNPC[]
  const npcById   = Object.fromEntries(npcs.map((n) => [n.id, n]))

  // Compute net DR: enemies add (dr × count), allies subtract (dr × count)
  const netDr = parts.reduce((sum, p) => {
    if (!p.dr) return sum
    if (p.role === 'enemy') return sum + p.dr * p.count
    if (p.role === 'ally')  return sum - p.dr * p.count
    return sum
  }, 0)
  const hasDr = parts.some(p => p.dr !== null)

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/encounters" className="text-sm text-zinc-500 hover:text-zinc-700">Encounters</Link>
        <span className="text-zinc-300">/</span>
        <span className="text-sm text-zinc-900 font-medium">{enc.title}</span>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">{enc.title}</h1>
        {hasDr && (
          <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-sm font-semibold border ${
            netDr > 0
              ? 'bg-red-50 text-red-700 border-red-200'
              : netDr < 0
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-zinc-50 text-zinc-600 border-zinc-200'
          }`}>
            Net DR {formatDr(netDr)}
          </span>
        )}
      </div>

      <form action={updateEncounter} className="bg-white rounded-lg border border-zinc-200 p-6 space-y-5 mb-8">
        <input type="hidden" name="id" value={enc.id} />
        <div>
          <label className={label}>Title</label>
          <input name="title" defaultValue={enc.title} required className={input} />
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
            <label className={label}>Session</label>
            <select key={enc.session_id ?? ''} name="session_id" defaultValue={enc.session_id ?? ''} className={input}>
              <option value="">— None (prep) —</option>
              {sessions.map((s) => <option key={s.id} value={s.id}>#{s.session_number}{s.title ? ` — ${s.title}` : ''}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className={label}>Status</label>
          <select key={enc.status} name="status" defaultValue={enc.status} className={input}>
            <option value="prep">Prep</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div>
          <label className={label}>Notes</label>
          <MentionTextarea name="notes" defaultValue={enc.notes ?? ''} rows={4} placeholder="Setup, tactics, terrain, objectives…" className={`${input} resize-none`} />
        </div>
        <div>
          <label className={label}>Summary <span className="text-xs text-zinc-400">(fill in after the encounter)</span></label>
          <MentionTextarea name="summary" defaultValue={enc.summary ?? ''} rows={3} className={`${input} resize-none`} />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Save Changes
          </button>
        </div>
      </form>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-zinc-700 uppercase tracking-wide mb-3">Participants</h2>
        {!parts.length ? (
          <p className="text-sm text-zinc-400 mb-3">No participants yet.</p>
        ) : (
          <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden mb-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th className="text-left px-4 py-2.5 font-medium text-zinc-600">Label</th>
                  <th className="text-left px-4 py-2.5 font-medium text-zinc-600">Count</th>
                  <th className="text-left px-4 py-2.5 font-medium text-zinc-600">DR</th>
                  <th className="text-left px-4 py-2.5 font-medium text-zinc-600">Role</th>
                  <th className="text-left px-4 py-2.5 font-medium text-zinc-600">NPC</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {parts.map((p) => {
                  const linkedNpc = p.npc_id ? npcById[p.npc_id] : null
                  return (
                    <tr key={p.id} className="border-b border-zinc-100 last:border-0">
                      <td className="px-4 py-2.5 font-medium text-zinc-900">{p.label}</td>
                      <td className="px-4 py-2.5 text-zinc-500">{p.count}</td>
                      <td className="px-4 py-2.5 text-zinc-500">{p.dr !== null ? formatDr(p.dr) : '—'}</td>
                      <td className={`px-4 py-2.5 font-medium ${roleColor[p.role ?? ''] ?? 'text-zinc-500'}`}>
                        {p.role ?? '—'}
                      </td>
                      <td className="px-4 py-2.5">
                        {linkedNpc
                          ? <Link href={`/npcs/${linkedNpc.id}`} className="text-indigo-600 hover:text-indigo-700">{linkedNpc.name}</Link>
                          : <span className="text-zinc-400">—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <form action={deleteParticipant}>
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="encounter_id" value={id} />
                          <button type="submit" className="text-zinc-300 hover:text-red-500 text-xs">✕</button>
                        </form>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <form action={addParticipant} className="bg-white rounded-lg border border-zinc-200 p-4 space-y-3">
          <input type="hidden" name="encounter_id" value={id} />
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-2">
              <label className={label}>Label</label>
              <input name="label" required placeholder="6 Guards, The Warlord…" className={input} />
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
              <label className={label}>Linked NPC <span className="text-xs text-zinc-400">(optional)</span></label>
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

      <div className="border-t border-zinc-200 pt-6">
        <form action={deleteEncounter}>
          <input type="hidden" name="id" value={enc.id} />
          <button type="submit" className="rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100">
            Delete Encounter
          </button>
        </form>
      </div>
    </div>
  )
}
