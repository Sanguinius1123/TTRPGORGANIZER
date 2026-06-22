import { db } from '@/lib/db'
import { togglePlotThreadVisibility } from '@/lib/actions/plot-threads'
import { FilterBar } from '@/components/FilterBar'
import { ClickableRow, SubLink, StopPropCell } from '@/components/TableRow'
import Link from 'next/link'
import { Suspense } from 'react'

interface ThreadRow {
  id: string
  title: string
  type: string
  status: string
  visible: boolean
  parent: { id: string; title: string } | null
}

const typeColor: Record<string, string> = {
  thread: 'bg-slate-700 text-slate-300',
  hook: 'bg-amber-900/40 text-amber-300',
  objective: 'bg-indigo-900/40 text-indigo-300',
}

const statusColor: Record<string, string> = {
  active: 'bg-green-900/40 text-green-400',
  completed: 'bg-slate-700 text-slate-500',
  abandoned: 'bg-red-900/30 text-red-400',
}

type SearchParams = Promise<{ type?: string; status?: string; visible?: string }>

export default async function PlotThreadsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const supabase = db()

  let q = supabase.from('plot_threads').select('*, parent:parent_id(id, title)').order('status').order('type').order('title')
  if (params.type) q = q.eq('type', params.type)
  if (params.status) q = q.eq('status', params.status)
  if (params.visible === 'true') q = q.eq('visible', true)
  else if (params.visible === 'false') q = q.eq('visible', false)

  const { data: raw } = await q
  const threads = (raw ?? []) as unknown as ThreadRow[]

  const filters = [
    { type: 'select' as const, name: 'type', label: 'Type', options: [
      { value: 'thread', label: 'Thread' },
      { value: 'hook', label: 'Hook' },
      { value: 'objective', label: 'Objective' },
    ]},
    { type: 'select' as const, name: 'status', label: 'Status', options: [
      { value: 'active', label: 'Active' },
      { value: 'completed', label: 'Completed' },
      { value: 'abandoned', label: 'Abandoned' },
    ]},
    { type: 'select' as const, name: 'visible', label: 'Visibility', options: [{ value: 'true', label: 'Visible' }, { value: 'false', label: 'Hidden' }] },
  ]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Plot Threads</h1>
          <p className="text-sm text-slate-500 mt-1">{threads.length} entries</p>
        </div>
        <Link href="/plot-threads/new" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          New Thread
        </Link>
      </div>

      <Suspense fallback={null}>
        <FilterBar filters={filters} />
      </Suspense>

      {!threads.length ? (
        <div className="rounded-lg border border-dashed border-slate-600 p-12 text-center">
          <p className="text-slate-500 text-sm">No plot threads match the current filters.</p>
          <Link href="/plot-threads/new" className="mt-3 inline-block text-sm font-medium text-indigo-400 hover:text-indigo-300">
            Create the first one →
          </Link>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800">
                <th className="text-left px-4 py-3 font-medium text-slate-400">Title</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400">Type</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400">Parent</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400">Visible</th>
              </tr>
            </thead>
            <tbody>
              {threads.map((t) => (
                <ClickableRow key={t.id} href={`/plot-threads/${t.id}`} className="border-b border-slate-700/50 last:border-0 hover:bg-slate-700/50">
                  <td className="px-4 py-3">
                    <SubLink href={`/plot-threads/${t.id}`} className="font-medium text-slate-100 hover:text-indigo-400">
                      {t.title}
                    </SubLink>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${typeColor[t.type] ?? ''}`}>
                      {t.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {t.parent
                      ? <SubLink href={`/plot-threads/${t.parent.id}`} className="text-slate-400 hover:text-indigo-400">{t.parent.title}</SubLink>
                      : <span className="text-slate-500">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[t.status] ?? ''}`}>
                      {t.status}
                    </span>
                  </td>
                  <StopPropCell className="px-4 py-3">
                    <form action={togglePlotThreadVisibility}>
                      <input type="hidden" name="id" value={t.id} />
                      <input type="hidden" name="visible" value={String(t.visible)} />
                      <button type="submit" className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium cursor-pointer transition-colors ${
                        t.visible ? 'bg-green-900/40 text-green-400 hover:bg-green-900/60' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                      }`}>
                        {t.visible ? 'Visible' : 'Hidden'}
                      </button>
                    </form>
                  </StopPropCell>
                </ClickableRow>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
