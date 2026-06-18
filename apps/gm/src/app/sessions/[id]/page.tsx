import { db } from '@/lib/db'
import { updateSession, deleteSession } from '@/lib/actions/sessions'
import { Session } from '@ttrpg/db'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const input = 'block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none'
const label = 'block text-sm font-medium text-zinc-700 mb-1'

interface EncounterRow { id: string; title: string; status: string }

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = db()

  const { data: raw } = await supabase.from('sessions').select('*').eq('id', id).single()
  if (!raw) notFound()
  const session = raw as Session

  const { data: rawEncounters } = await supabase.from('encounters').select('id, title, status').eq('session_id', id).order('created_at')
  const encounters = (rawEncounters ?? []) as EncounterRow[]

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
          <label className={label}>Summary</label>
          <textarea name="summary" defaultValue={session.summary ?? ''} rows={8} className={`${input} resize-none`} />
        </div>
        <div>
          <label className={label}>Loose Threads</label>
          <textarea name="loose_threads" defaultValue={session.loose_threads ?? ''} rows={4} placeholder="Unresolved questions, follow-ups, things players may pursue…" className={`${input} resize-none`} />
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
