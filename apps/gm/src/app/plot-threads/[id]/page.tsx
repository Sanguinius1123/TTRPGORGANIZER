import { db } from '@/lib/db'
import { updatePlotThread, deletePlotThread, togglePlotThreadVisibility } from '@/lib/actions/plot-threads'
import { PlotThread } from '@ttrpg/db'
import MentionTextarea from '@/components/MentionTextarea'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const input = 'block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none'
const label = 'block text-sm font-medium text-zinc-700 mb-1'

interface ChildThread { id: string; title: string; type: string; status: string }

export default async function PlotThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = db()

  const { data: raw } = await supabase.from('plot_threads').select('*').eq('id', id).single()
  if (!raw) notFound()
  const thread = raw as PlotThread

  const [r1, r2] = await Promise.all([
    supabase.from('plot_threads').select('id, title').eq('type', 'objective').neq('id', id).order('title'),
    supabase.from('plot_threads').select('id, title, type, status').eq('parent_id', id).order('type').order('title'),
  ])

  const allObjectives = (r1.data ?? []) as Array<{ id: string; title: string }>
  const children = (r2.data ?? []) as ChildThread[]

  let parent: { id: string; title: string } | null = null
  if (thread.parent_id) {
    const { data: p } = await supabase.from('plot_threads').select('id, title').eq('id', thread.parent_id).single()
    parent = p as { id: string; title: string } | null
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/plot-threads" className="text-sm text-zinc-500 hover:text-zinc-700">Plot Threads</Link>
        {parent && (
          <>
            <span className="text-zinc-300">/</span>
            <Link href={`/plot-threads/${parent.id}`} className="text-sm text-zinc-500 hover:text-zinc-700">{parent.title}</Link>
          </>
        )}
        <span className="text-zinc-300">/</span>
        <span className="text-sm text-zinc-900 font-medium">{thread.title}</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">{thread.title}</h1>
        <form action={togglePlotThreadVisibility}>
          <input type="hidden" name="id" value={thread.id} />
          <input type="hidden" name="visible" value={String(thread.visible)} />
          <button type="submit" className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
            thread.visible ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200'
          }`}>
            {thread.visible ? 'Visible to players' : 'Hidden from players'}
          </button>
        </form>
      </div>

      <form action={updatePlotThread} className="bg-white rounded-lg border border-zinc-200 p-6 space-y-5 mb-8">
        <input type="hidden" name="id" value={thread.id} />
        <div>
          <label className={label}>Title</label>
          <input name="title" defaultValue={thread.title} required className={input} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Type</label>
            <select key={thread.type} name="type" defaultValue={thread.type} className={input}>
              <option value="thread">Thread</option>
              <option value="hook">Hook</option>
              <option value="objective">Objective</option>
            </select>
          </div>
          <div>
            <label className={label}>Status</label>
            <select key={thread.status} name="status" defaultValue={thread.status} className={input}>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="abandoned">Abandoned</option>
            </select>
          </div>
        </div>
        <div>
          <label className={label}>Parent Objective</label>
          <select key={thread.parent_id ?? ''} name="parent_id" defaultValue={thread.parent_id ?? ''} className={input}>
            <option value="">— None —</option>
            {allObjectives.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Description</label>
          <MentionTextarea name="description" defaultValue={thread.description ?? ''} rows={4} className={`${input} resize-none`} />
        </div>
        <div>
          <label className={label}>Notes <span className="text-xs text-zinc-400">(private)</span></label>
          <MentionTextarea name="notes" defaultValue={thread.notes ?? ''} rows={3} className={`${input} resize-none`} />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Save Changes
          </button>
        </div>
      </form>

      {children.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-zinc-700 uppercase tracking-wide mb-3">Related Threads & Hooks</h2>
          <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {children.map((c) => (
                  <tr key={c.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                    <td className="px-4 py-2.5">
                      <Link href={`/plot-threads/${c.id}`} className="font-medium text-zinc-900 hover:text-indigo-600">{c.title}</Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        c.type === 'objective' ? 'bg-indigo-100 text-indigo-800' :
                        c.type === 'hook' ? 'bg-amber-100 text-amber-800' :
                        'bg-zinc-100 text-zinc-700'
                      }`}>{c.type}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        c.status === 'active' ? 'bg-green-100 text-green-800' :
                        c.status === 'completed' ? 'bg-zinc-100 text-zinc-500' :
                        'bg-red-100 text-red-700'
                      }`}>{c.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="border-t border-zinc-200 pt-6">
        <form action={deletePlotThread}>
          <input type="hidden" name="id" value={thread.id} />
          <button type="submit" className="rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100">
            Delete Thread
          </button>
        </form>
      </div>
    </div>
  )
}
