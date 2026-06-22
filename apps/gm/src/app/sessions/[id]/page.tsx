import { db } from '@/lib/db'
import { updateSession, deleteSession, addSessionPlotThread, removeSessionPlotThread, updateSessionNote, deleteSessionNote } from '@/lib/actions/sessions'
import { addEncounterToSession, removeEncounterFromSession } from '@/lib/actions/encounters'
import { Session } from '@ttrpg/db'
import MentionTextarea from '@/components/MentionTextarea'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const input = 'block w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none'
const label = 'block text-sm font-medium text-slate-300 mb-1'
const smallInput = 'block w-full rounded border border-slate-600 bg-slate-700 px-2 py-1.5 text-xs text-slate-100 focus:border-indigo-400 outline-none'

interface EncounterRow { id: string; title: string; status: string }
interface ParticipantDrRow { encounter_id: string; role: string | null; dr: number | null; count: number }
interface SessionNoteRow { id: string; author_name: string | null; notes_text: string | null; pc: { name: string; player_name: string | null } | null }
interface SessionPlotThreadRow { id: string; plot_thread_id: string }
interface PlotThreadRow { id: string; title: string; status: string }

const threadStatusColor: Record<string, string> = {
  active:    'bg-green-900/40 text-green-400',
  completed: 'bg-slate-700 text-slate-500',
  abandoned: 'bg-red-900/30 text-red-400',
}

const encounterStatusColor: Record<string, string> = {
  archived: 'bg-slate-700 text-slate-500',
  active:   'bg-blue-900/40 text-blue-300',
  prep:     'bg-yellow-900/40 text-yellow-300',
}

function stripMentions(text: string): string {
  return text.replace(/\[\[[^\]]+\|([^\]]+)\]\]/g, '$1')
}

function formatDr(dr: number): string {
  return Number.isInteger(dr) ? String(dr) : dr.toFixed(2).replace(/\.?0+$/, '')
}

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = db()

  const [r0, r1, r2, r3, r4, r5, r6] = await Promise.all([
    supabase.from('sessions').select('*').eq('id', id).single(),
    supabase.from('encounters').select('id, title, status').eq('session_id', id).order('created_at'),
    supabase.from('session_notes').select('*, pc:pc_id(name, player_name)').eq('session_id', id).order('created_at'),
    supabase.from('factions').select('id, name').order('name'),
    supabase.from('session_plot_threads').select('id, plot_thread_id').eq('session_id', id).order('created_at'),
    supabase.from('encounters').select('id, title, status').neq('session_id', id).order('title'),
    supabase.from('plot_threads').select('id, title, status').order('title'),
  ])

  if (!r0.data) notFound()
  const session            = r0.data as Session
  const encounters         = (r1.data ?? []) as EncounterRow[]
  const playerNotes        = (r2.data ?? []) as unknown as SessionNoteRow[]
  const factions           = (r3.data ?? []) as Array<{ id: string; name: string }>
  const sessionThreadLinks = (r4.data ?? []) as SessionPlotThreadRow[]
  const otherEncounters    = (r5.data ?? []) as EncounterRow[]
  const allThreads         = (r6.data ?? []) as PlotThreadRow[]

  // neq() excludes NULLs in postgres — fetch unassigned separately
  const { data: unassignedRaw } = await supabase
    .from('encounters').select('id, title, status').is('session_id', null).order('title')
  const unassignedEncounters = (unassignedRaw ?? []) as EncounterRow[]
  const availableEncounters  = [...unassignedEncounters, ...otherEncounters]

  // Fetch participant DR data for all encounters linked to this session
  const encounterIds = encounters.map(e => e.id)
  let netDrByEncounter: Record<string, number> = {}
  if (encounterIds.length > 0) {
    const { data: drRaw } = await supabase
      .from('encounter_participants')
      .select('encounter_id, role, dr, count')
      .in('encounter_id', encounterIds)
    const drRows = (drRaw ?? []) as ParticipantDrRow[]
    for (const p of drRows) {
      if (p.dr === null) continue
      const prev = netDrByEncounter[p.encounter_id] ?? 0
      if (p.role === 'enemy') netDrByEncounter[p.encounter_id] = prev + p.dr * p.count
      else if (p.role === 'ally') netDrByEncounter[p.encounter_id] = prev - p.dr * p.count
      else netDrByEncounter[p.encounter_id] = prev
    }
  }

  const linkedEncounterIds = new Set(encounters.map(e => e.id))
  const linkedThreadIds    = new Set(sessionThreadLinks.map(l => l.plot_thread_id))
  const threadById         = Object.fromEntries(allThreads.map(t => [t.id, t]))
  const availableThreads   = allThreads.filter(t => !linkedThreadIds.has(t.id))

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/sessions" className="text-sm text-slate-400 hover:text-slate-300">Sessions</Link>
        <span className="text-slate-600">/</span>
        <span className="text-sm text-slate-100 font-medium">Session {session.session_number}</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-100 mb-6">
        Session {session.session_number}{session.title ? ` — ${session.title}` : ''}
      </h1>

      <div className="flex gap-6 items-start">

        {/* ── Left: main content ── */}
        <div className="flex-1 min-w-0">
          <form action={updateSession} className="bg-slate-800 rounded-lg border border-slate-700 p-6 space-y-5 mb-8">
            <input type="hidden" name="id" value={session.id} />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={label}>Session #</label>
                <input name="session_number" type="number" min="1" defaultValue={session.session_number} required className={input} />
              </div>
              <div>
                <label className={label}>Title</label>
                <input name="title" defaultValue={session.title ?? ''} className={input} />
              </div>
            </div>
            <div>
              <label className={label}>Party / Faction</label>
              <select key={session.faction_id ?? ''} name="faction_id" defaultValue={session.faction_id ?? ''} className={input}>
                <option value="">— None —</option>
                {factions.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Summary</label>
              <MentionTextarea name="summary" defaultValue={session.summary ?? ''} rows={8} className={`${input} resize-none`} />
            </div>
            <div>
              <label className={label}>Loose Threads</label>
              <MentionTextarea name="loose_threads" defaultValue={session.loose_threads ?? ''} rows={4} placeholder="Unresolved questions, follow-ups, things players may pursue…" className={`${input} resize-none`} />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                Save Changes
              </button>
            </div>
          </form>

          {playerNotes.length > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Player Notes</h2>
              <div className="space-y-3">
                {playerNotes.map((note) => {
                  const pcLabel = note.pc
                    ? [note.pc.name, note.pc.player_name].filter(Boolean).join(' — ')
                    : (note.author_name ?? 'Unknown player')
                  return (
                    <div key={note.id} className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700/50 bg-slate-800">
                        <p className="text-xs font-semibold text-slate-400">{pcLabel}</p>
                        <form action={deleteSessionNote}>
                          <input type="hidden" name="id" value={note.id} />
                          <input type="hidden" name="session_id" value={id} />
                          <button type="submit" className="text-slate-600 hover:text-red-400 text-xs transition-colors">Delete</button>
                        </form>
                      </div>
                      <form action={updateSessionNote} className="p-4 space-y-2">
                        <input type="hidden" name="id" value={note.id} />
                        <input type="hidden" name="session_id" value={id} />
                        <textarea
                          name="notes_text"
                          defaultValue={note.notes_text ? stripMentions(note.notes_text) : ''}
                          rows={3}
                          className="block w-full rounded border border-slate-700 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:outline-none resize-none"
                        />
                        <button type="submit" className="rounded bg-slate-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-600">
                          Save
                        </button>
                      </form>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          <div className="border-t border-slate-700 pt-6">
            <form action={deleteSession}>
              <input type="hidden" name="id" value={session.id} />
              <button type="submit" className="rounded-md bg-red-900/30 border border-red-700 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-900/50">
                Delete Session
              </button>
            </form>
          </div>
        </div>

        {/* ── Right: sidebar ── */}
        <div className="w-72 shrink-0 space-y-4">

          {/* Encounters panel */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-700/50 bg-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Encounters</h3>
              <Link href="/encounters/new" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">+ New</Link>
            </div>
            {availableEncounters.length > 0 && (
              <form action={addEncounterToSession} className="px-3 pt-2.5 pb-2 border-b border-slate-700/50 flex gap-1.5">
                <input type="hidden" name="session_id" value={id} />
                <select name="id" required className={`${smallInput} flex-1`}>
                  <option value="">Link existing…</option>
                  {availableEncounters
                    .filter(e => !linkedEncounterIds.has(e.id))
                    .map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                </select>
                <button type="submit" className="rounded bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 whitespace-nowrap">
                  Add
                </button>
              </form>
            )}
            <div className="p-3 space-y-1">
              {encounters.length === 0 && (
                <p className="text-xs text-slate-500 px-1 py-1">No encounters linked.</p>
              )}
              {encounters.map((e) => {
                const netDr = netDrByEncounter[e.id]
                const hasDr = netDr !== undefined
                return (
                  <div key={e.id} className="flex items-center gap-2 group rounded px-1 py-1.5 hover:bg-slate-700/50">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Link href={`/encounters/${e.id}`} className="text-sm font-medium text-slate-100 hover:text-indigo-400 truncate">
                          {e.title}
                        </Link>
                        {hasDr && (
                          <span className={`shrink-0 inline-flex rounded px-1 py-0.5 text-xs font-semibold ${
                            netDr > 0 ? 'bg-red-900/30 text-red-400' : netDr < 0 ? 'bg-green-900/40 text-green-400' : 'bg-slate-700 text-slate-500'
                          }`}>
                            DR {formatDr(netDr)}
                          </span>
                        )}
                      </div>
                      <span className={`inline-flex rounded-full px-1.5 py-0.5 text-xs font-medium ${encounterStatusColor[e.status] ?? 'bg-slate-700 text-slate-400'}`}>
                        {e.status}
                      </span>
                    </div>
                    <form action={removeEncounterFromSession}>
                      <input type="hidden" name="id" value={e.id} />
                      <input type="hidden" name="session_id" value={id} />
                      <button type="submit" className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 text-xs shrink-0">✕</button>
                    </form>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Plot Threads panel */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-700/50 bg-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Plot Threads</h3>
              <Link href="/plot-threads/new" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">+ New</Link>
            </div>
            {availableThreads.length > 0 && (
              <form action={addSessionPlotThread} className="px-3 pt-2.5 pb-2 border-b border-slate-700/50 flex gap-1.5">
                <input type="hidden" name="session_id" value={id} />
                <select name="plot_thread_id" required className={`${smallInput} flex-1`}>
                  <option value="">Link existing…</option>
                  {availableThreads.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
                <button type="submit" className="rounded bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 whitespace-nowrap">
                  Add
                </button>
              </form>
            )}
            <div className="p-3 space-y-1">
              {sessionThreadLinks.length === 0 && (
                <p className="text-xs text-slate-500 px-1 py-1">No threads linked.</p>
              )}
              {sessionThreadLinks.map((link) => {
                const thread = threadById[link.plot_thread_id]
                if (!thread) return null
                return (
                  <div key={link.id} className="flex items-center gap-2 group rounded px-1 py-1.5 hover:bg-slate-700/50">
                    <div className="flex-1 min-w-0">
                      <Link href={`/plot-threads/${thread.id}`} className="text-sm font-medium text-slate-100 hover:text-indigo-400 block truncate">
                        {thread.title}
                      </Link>
                      <span className={`inline-flex rounded-full px-1.5 py-0.5 text-xs font-medium ${threadStatusColor[thread.status] ?? ''}`}>
                        {thread.status}
                      </span>
                    </div>
                    <form action={removeSessionPlotThread}>
                      <input type="hidden" name="id" value={link.id} />
                      <input type="hidden" name="session_id" value={id} />
                      <button type="submit" className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 text-xs shrink-0">✕</button>
                    </form>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
