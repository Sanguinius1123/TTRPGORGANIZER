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
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Sessions</h1>
        <p className="text-sm text-zinc-500 mt-1">{sessions.length} recorded</p>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center">
          <p className="text-zinc-500 text-sm">No sessions recorded yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
          {sessions.map((s, i) => (
            <Link
              key={s.id}
              href={`/sessions/${s.id}`}
              className={`block px-6 py-4 hover:bg-zinc-50 transition-colors ${i < sessions.length - 1 ? 'border-b border-zinc-100' : ''}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-0.5">Session {s.session_number}</p>
                  <p className="font-semibold text-zinc-900">{s.title ?? 'Untitled'}</p>
                  {s.summary && <p className="mt-1 text-sm text-zinc-500 line-clamp-2">{s.summary}</p>}
                </div>
                <span className="text-zinc-300 text-sm shrink-0">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
