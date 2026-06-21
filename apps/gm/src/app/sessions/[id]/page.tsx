import { db } from '@/lib/db'
import { updateSession, deleteSession, addSessionPlotThread, removeSessionPlotThread } from '@/lib/actions/sessions'
import { removeEncounterFromSession } from '@/lib/actions/encounters'
import { Session } from '@ttrpg/db'
import MentionTextarea from '@/components/MentionTextarea'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const input = 'block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none'
const label = 'block text-sm font-medium text-zinc-700 mb-1'
const smallInput = 'block w-full rounded border border-zinc-300 px-2 py-1.5 text-xs text-zinc-900 focus:border-indigo-500 outline-none'

interface EncounterRow { id: string; title: string; status: string }
interface SessionNoteRow { id: string; author_name: string | null; notes_text: string | null; pc: { name: string } | null }
interface SessionPlotThreadRow { id: string; plot_thread_id: string }
interface PlotThreadRow { id: string; title: string; status: string }

const statusColor: Record<string, string> = {
  active:    'bg-green-100 text-green-800',
  completed: 'bg-zinc-100 text-zinc-500',
  abandoned: 'bg-red-100 text-red-700',
}

function stripMentions(text: string): string {
  return text.replace(/\[\[[^\]]+\|([^\]]+)\]\]/g, '$1')
}

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = db()

  const [r0, r1, r2, r3, r4] = await Promise.all([
    supabase.from('sessions').select('*').eq('id', id).single(),
    supabase.from('encounters').select('id, title, status').eq('session_id', id).order('created_at'),
    supabase.from('session_notes').select('*, pc:pc_id(name)').eq('session_id', id).order('created_at'),
    supabase.from('factions').select('id, name').order('name'),
    supabase.from('session_plot_threads').select('id, plot_thread_id').eq('session_id', id).order('created_at'),
  ])

  if (!r0.data) notFound()
  const session = r0.data as Session
  const encounters    = (r1.data ?? []) as EncounterRow[]
  const playerNotes   = (r2.data ?? []) as unknown as SessionNoteRow[]
  const factions      = (r3.data ?? []) as Array<{ id: string; name: string }>
  const sessionThreadLinks = (r4.data ?? []) as SessionPlotThreadRow[]

  const linkedThreadIds = new Set(sessionThreadLinks.map(l => l.plot_thread_id))

  const { data: rawThreads } = await supabase.from('plot_threads').select('id, title, status').order('title')
  const allThreads = (rawThreads ?? []) as PlotThreadRow[]
  const threadById = Object.fromEntries(allThreads.map(t => [t.id, t]))
  const availableThreads = allThreads.filter(t => !linkedThreadIds.has(t.id))

  const encounterStatusColor: Record<string, string> = {
    archived: 'bg-zinc-100 text-zinc-500',
    active:   'bg-blue-100 text-blue-800',
    prep:     'bg-yellow-100 text-yellow-800',
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/sessions" className="text-sm text-zinc-500 hover:text-zinc-700">Sessions</Link>
        <span className="text-zinc-300">/</span>
        <span className="text-sm text-zinc-900 font-medium">Session {session.session_number}</span>
      </div>
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">
        Session {session.session_number}{session.title ? ` — ${session.title}` : ''}
      </h1>

      <div className="flex gap-6 items-start">

        {/* ── Left: main content ── */}
        <div className="flex-1 min-w-0">
          <form action={updateSession} className="bg-white rounded-lg border border-zinc-200 p-6 space-y-5 mb-8">
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
              <select
                key={session.faction_id ?? ''}
                name="faction_id"
                defaultValue={session.faction_id ?? ''}
                className={input}
              >
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
              <h2 className="text-sm font-semibold text-zinc-700 uppercase tracking-wide mb-3">Player Notes</h2>
              <div className="space-y-3">
                {playerNotes.map((note) => (
                  <div key={note.id} className="bg-white rounded-lg border border-zinc-200 p-4">
                    <p className="text-xs font-semibold text-zinc-500 mb-1">
                      {note.pc?.name ?? note.author_name ?? 'Unknown player'}
                    </p>
                    <p className="text-sm text-zinc-800 whitespace-pre-wrap">
                      {note.notes_text ? stripMentions(note.notes_text) : '—'}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="border-t border-zinc-200 pt-6">
            <form action={deleteSession}>
              <input type="hidden" name="id" value={session.id} />
              <button type="submit" className="rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100">
                Delete Session
              </button>
            </form>
          </div>
        </div>

        {/* ── Right: sidebar ── */}
        <div className="w-72 shrink-0 space-y-4">

          {/* Encounters panel */}
          <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-zinc-600 uppercase tracking-wide">Encounters</h3>
              <Link href={`/encounters/new`} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">+ New</Link>
            </div>
            <div className="p-3 space-y-1">
              {encounters.length === 0 && (
                <p className="text-xs text-zinc-400 px-1 py-1">No encounters linked.</p>
              )}
              {encounters.map((e) => (
                <div key={e.id} className="flex items-center gap-2 group rounded px-1 py-1.5 hover:bg-zinc-50">
                  <div className="flex-1 min-w-0">
                    <Link href={`/encounters/${e.id}`} className="text-sm font-medium text-zinc-900 hover:text-indigo-600 block truncate">
                      {e.title}
                    </Link>
                    <span className={`inline-flex rounded-full px-1.5 py-0.5 text-xs font-medium ${encounterStatusColor[e.status] ?? 'bg-zinc-100 text-zinc-600'}`}>
                      {e.status}
                    </span>
                  </div>
                  <form action={removeEncounterFromSession}>
                    <input type="hidden" name="id" value={e.id} />
                    <input type="hidden" name="session_id" value={id} />
                    <button type="submit" className="opacity-0 group-hover:opacity-100 text-zinc-300 hover:text-red-500 text-xs shrink-0">✕</button>
                  </form>
                </div>
              ))}
            </div>
          </div>

          {/* Plot Threads panel */}
          <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-zinc-100 bg-zinc-50">
              <h3 className="text-xs font-semibold text-zinc-600 uppercase tracking-wide">Plot Threads</h3>
            </div>
            <div className="p-3 space-y-1">
              {sessionThreadLinks.length === 0 && (
                <p className="text-xs text-zinc-400 px-1 py-1">No threads linked.</p>
              )}
              {sessionThreadLinks.map((link) => {
                const thread = threadById[link.plot_thread_id]
                if (!thread) return null
                return (
                  <div key={link.id} className="flex items-center gap-2 group rounded px-1 py-1.5 hover:bg-zinc-50">
                    <div className="flex-1 min-w-0">
                      <Link href={`/plot-threads/${thread.id}`} className="text-sm font-medium text-zinc-900 hover:text-indigo-600 block truncate">
                        {thread.title}
                      </Link>
                      <span className={`inline-flex rounded-full px-1.5 py-0.5 text-xs font-medium ${statusColor[thread.status] ?? ''}`}>
                        {thread.status}
                      </span>
                    </div>
                    <form action={removeSessionPlotThread}>
                      <input type="hidden" name="id" value={link.id} />
                      <input type="hidden" name="session_id" value={id} />
                      <button type="submit" className="opacity-0 group-hover:opacity-100 text-zinc-300 hover:text-red-500 text-xs shrink-0">✕</button>
                    </form>
                  </div>
                )
              })}
            </div>
            {availableThreads.length > 0 && (
              <form action={addSessionPlotThread} className="px-3 pb-3 pt-2 border-t border-zinc-100 space-y-2">
                <input type="hidden" name="session_id" value={id} />
                <p className="text-xs text-zinc-500 font-medium">Add threads:</p>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {availableThreads.map(t => (
                    <label key={t.id} className="flex items-center gap-2 rounded px-1 py-1 hover:bg-zinc-50 cursor-pointer">
                      <input type="checkbox" name="plot_thread_id" value={t.id} className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-xs text-zinc-800 truncate">{t.title}</span>
                    </label>
                  ))}
                </div>
                <button type="submit" className="w-full rounded bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-700">
                  Add Selected
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
