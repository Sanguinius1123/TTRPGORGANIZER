import { createClient } from '@/lib/supabase/server'
import { Session } from '@ttrpg/db'
import Link from 'next/link'

export default async function SessionsPage() {
  const supabase = await createClient()
  const { data: rawSessions } = await supabase
    .from('sessions')
    .select('*')
    .order('session_number', { ascending: false })
  const sessions = (rawSessions ?? []) as Session[]

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">Sessions</h1>
      {sessions.length === 0 ? (
        <p className="text-zinc-500 text-sm">No sessions recorded yet.</p>
      ) : (
        <div className="space-y-3">
          {sessions.map(s => (
            <Link
              key={s.id}
              href={`/sessions/${s.id}`}
              className="block rounded-lg bg-white border border-zinc-200 px-5 py-4 hover:border-indigo-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Session {s.session_number}</span>
              </div>
              <p className="mt-1 font-semibold text-zinc-900">{s.title ?? 'Untitled'}</p>
              {s.summary && <p className="mt-1 text-sm text-zinc-500 line-clamp-2">{s.summary}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
