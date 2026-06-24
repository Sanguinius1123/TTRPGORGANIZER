import { createAnonClient } from '@/lib/supabase/server'
import { Session } from '@ttrpg/db'
import Link from 'next/link'
import { stripMentions } from '@/lib/mentions'

export default async function SessionsPage() {
  const supabase = await createAnonClient()
  const { data: rawSessions } = await supabase
    .from('sessions')
    .select('*')
    .order('session_number', { ascending: false })
  const sessions = (rawSessions ?? []) as Session[]

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Sessions</h1>
        <p className="text-sm text-slate-500 mt-1">{sessions.length} recorded</p>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-600 p-12 text-center">
          <p className="text-slate-500 text-sm">No sessions recorded yet.</p>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          {sessions.map((s, i) => (
            <Link
              key={s.id}
              href={`/play/sessions/${s.id}`}
              className={`block px-6 py-4 hover:bg-slate-700/50 transition-colors ${i < sessions.length - 1 ? 'border-b border-slate-700/50' : ''}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-0.5">Session {s.session_number}</p>
                  <p className="font-semibold text-slate-100">{s.title ?? 'Untitled'}</p>
                  {s.summary && <p className="mt-1 text-sm text-slate-400 line-clamp-2">{stripMentions(s.summary)}</p>}
                </div>
                <span className="text-slate-600 text-sm shrink-0">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
