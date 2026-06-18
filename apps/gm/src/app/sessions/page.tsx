import { db } from '@/lib/db'
import { Session } from '@ttrpg/db'
import Link from 'next/link'

export default async function SessionsPage() {
  const supabase = db()
  const { data: rawSessions } = await supabase.from('sessions').select('*').order('session_number', { ascending: false })
  const sessions = (rawSessions ?? []) as Session[]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Sessions</h1>
          <p className="text-sm text-zinc-500 mt-1">{sessions.length} sessions logged</p>
        </div>
        <Link href="/sessions/new" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          Log Session
        </Link>
      </div>

      {!sessions.length ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center">
          <p className="text-zinc-500 text-sm">No sessions logged yet.</p>
          <Link href="/sessions/new" className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700">
            Log the first one →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <Link
              key={s.id}
              href={`/sessions/${s.id}`}
              className="flex items-start gap-4 bg-white rounded-lg border border-zinc-200 p-4 hover:border-indigo-300 hover:shadow-sm transition-all"
            >
              <span className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 font-bold text-sm">
                {s.session_number}
              </span>
              <div className="min-w-0">
                <p className="font-medium text-zinc-900">{s.title ?? `Session ${s.session_number}`}</p>
                {s.summary && (
                  <p className="text-sm text-zinc-500 mt-0.5 line-clamp-2">{s.summary}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
