import { db } from '@/lib/db'
import { updateSession, deleteSession } from '@/lib/actions/sessions'
import { Session } from '@ttrpg/db'
import MentionTextarea from '@/components/MentionTextarea'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const input = 'block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none'
const label = 'block text-sm font-medium text-zinc-700 mb-1'

interface EncounterRow { id: string; title: string; status: string }
interface SessionNoteRow { id: string; author_name: string | null; notes_text: string | null; pc: { name: string } | null }

function stripMentions(text: string): string {
  return text.replace(/\[\[[^\]]+\|([^\]]+)\]\]/g, '$1')
}

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = db()

  const [r0, r1, r2, r3] = await Promise.all([
    supabase.from('sessions').select('*').eq('id', id).single(),
    supabase.from('encounters').select('id, title, status').eq('session_id', id).order('created_at'),
    supabase.from('session_notes').select('*, pc:pc_id(name)').eq('session_id', id).order('created_at'),
    supabase.from('factions').select('id, name').order('name'),
  ])

  if (!r0.data) notFound()
  const session = r0.data as Session
  const encounters = (r1.data ?? []) as EncounterRow[]
  const playerNotes = (r2.data ?? []) as unknown as SessionNoteRow[]
  const factions = (r3.data ?? []) as Array<{ id: string; name: string }>

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/sessions" className="text-sm text-zinc-500 hover:text-zinc-700">Sessions</Link>
        <span className="text-zinc-300">/</span>
        <span className="text-sm text-zinc-900 font-medium">Session {session.session_number}</span>
      </div>
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">
        Session {session.session_number}{session.title ? ` — ${session.title}` : ''}
      </h1>

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

      {encounters.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-zinc-700 uppercase tracking-wide mb-3">Encounters</h2>
          <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {encounters.map((e) => (
                  <tr key={e.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                    <td className="px-4 py-2.5">
                      <Link href={`/encounters/${e.id}`} className="font-medium text-zinc-900 hover:text-indigo-600">{e.title}</Link>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        e.status === 'archived' ? 'bg-zinc-100 text-zinc-500' :
                        e.status === 'active' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>{e.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

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
  )
}
