import { db } from '@/lib/db'
import Link from 'next/link'

interface ThreadRow {
  id: string
  title: string
  type: string
  status: string
  parent: { title: string } | null
}

const typeColor: Record<string, string> = {
  thread: 'bg-zinc-100 text-zinc-700',
  hook: 'bg-amber-100 text-amber-800',
  objective: 'bg-indigo-100 text-indigo-800',
}

const statusColor: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  completed: 'bg-zinc-100 text-zinc-500',
  abandoned: 'bg-red-100 text-red-700',
}

export default async function PlotThreadsPage() {
  const supabase = db()
  const { data: raw } = await supabase
    .from('plot_threads')
    .select('*, parent:parent_id(title)')
    .order('status')
    .order('type')
    .order('title')

  const threads = (raw ?? []) as unknown as ThreadRow[]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Plot Threads</h1>
          <p className="text-sm text-zinc-500 mt-1">{threads.length} entries</p>
        </div>
        <Link href="/plot-threads/new" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          New Thread
        </Link>
      </div>

      {!threads.length ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center">
          <p className="text-zinc-500 text-sm">No plot threads yet.</p>
          <Link href="/plot-threads/new" className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700">
            Create the first one →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Title</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Parent</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {threads.map((t) => (
                <tr key={t.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <Link href={`/plot-threads/${t.id}`} className="font-medium text-zinc-900 hover:text-indigo-600">
                      {t.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${typeColor[t.type] ?? ''}`}>
                      {t.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{t.parent?.title ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[t.status] ?? ''}`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
