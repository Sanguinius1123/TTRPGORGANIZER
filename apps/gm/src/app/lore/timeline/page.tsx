import { db } from '@/lib/db'
import { LoreEntry } from '@ttrpg/db'
import Link from 'next/link'

export default async function TimelinePage() {
  const supabase = db()
  const { data: raw } = await supabase
    .from('lore_entries')
    .select('*')
    .eq('category', 'History')
    .order('created_at', { ascending: true })

  const entries = (raw ?? []) as LoreEntry[]
  const major = entries.filter(e => e.major_event)
  const minor = entries.filter(e => !e.major_event)

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/lore" className="text-sm text-slate-500 hover:text-slate-300">Lore & Knowledge</Link>
            <span className="text-slate-600">/</span>
            <span className="text-sm text-slate-100 font-medium">Timeline</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">History Timeline</h1>
          <p className="text-sm text-slate-500 mt-1">{entries.length} event{entries.length !== 1 ? 's' : ''} · {major.length} major</p>
        </div>
        <Link
          href="/lore/new?category=History"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + New Event
        </Link>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <p className="text-lg mb-2">No history entries yet.</p>
          <p className="text-sm">Create a Lore entry with category "History" to see it here.</p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-700" />

          <div className="space-y-1">
            {entries.map((entry) => (
              <div key={entry.id} className="relative flex gap-6 group">
                {/* Dot */}
                <div className={`relative z-10 mt-1 shrink-0 rounded-full border-2 transition-colors ${
                  entry.major_event
                    ? 'w-4 h-4 bg-indigo-500 border-indigo-400'
                    : 'w-3.5 h-3.5 mt-1.5 bg-slate-700 border-slate-500 group-hover:border-slate-400'
                }`} />

                {/* Content */}
                <div className={`flex-1 pb-6 ${entry.major_event ? '' : ''}`}>
                  {entry.event_timestamp && (
                    <div className="text-xs text-slate-500 mb-1 font-mono">{entry.event_timestamp}</div>
                  )}

                  {entry.major_event ? (
                    <div className="bg-slate-800 border border-indigo-900/60 rounded-lg p-4 hover:border-indigo-700/60 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <Link href={`/lore/${entry.id}`} className="text-base font-semibold text-slate-100 hover:text-indigo-400 transition-colors">
                            {entry.title}
                          </Link>
                          {entry.descriptor && (
                            <span className="ml-2 text-xs text-slate-500">{entry.descriptor}</span>
                          )}
                          {entry.description && (
                            <p className="text-sm text-slate-400 mt-1.5 line-clamp-2">{entry.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {entry.visible
                            ? <span className="text-xs text-green-500">Visible</span>
                            : <span className="text-xs text-slate-600">Hidden</span>
                          }
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-3">
                      <Link href={`/lore/${entry.id}`} className="text-sm text-slate-300 hover:text-indigo-400 transition-colors">
                        {entry.title}
                      </Link>
                      {entry.descriptor && (
                        <span className="text-xs text-slate-600">{entry.descriptor}</span>
                      )}
                      {!entry.visible && (
                        <span className="text-xs text-slate-600">·  hidden</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-slate-800 flex items-center gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-indigo-500 border-2 border-indigo-400" />
          Major event
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-slate-700 border-2 border-slate-500" />
          Minor event
        </div>
        <span className="ml-auto">Ordered by creation date · set "Event Timestamp" on each entry for display labels</span>
      </div>
    </div>
  )
}
