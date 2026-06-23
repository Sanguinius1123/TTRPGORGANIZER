import { db } from '@/lib/db'
import { createPlotThread } from '@/lib/actions/plot-threads'
import MentionTextarea from '@/components/MentionTextarea'
import Link from 'next/link'

const input = 'block w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none'
const label = 'block text-sm font-medium text-slate-300 mb-1'

export default async function NewPlotThreadPage() {
  const supabase = db()
  const { data: rawThreads } = await supabase
    .from('plot_threads')
    .select('id, title')
    .eq('type', 'objective')
    .order('title')
  const threads = (rawThreads ?? []) as Array<{ id: string; title: string }>

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/plot-threads" className="text-sm text-slate-500 hover:text-slate-300">Plot Threads</Link>
        <span className="text-slate-600">/</span>
        <span className="text-sm text-slate-100 font-medium">New</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-100 mb-6">New Plot Thread</h1>

      <form action={createPlotThread} className="space-y-5">
        <div>
          <label className={label}>Title <span className="text-red-500">*</span></label>
          <input spellCheck name="title" required className={input} autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Type</label>
            <select name="type" className={input} defaultValue="thread">
              <option value="thread">Thread</option>
              <option value="hook">Hook</option>
              <option value="objective">Objective</option>
            </select>
          </div>
          <div>
            <label className={label}>Status</label>
            <select name="status" className={input} defaultValue="active">
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="abandoned">Abandoned</option>
            </select>
          </div>
        </div>
        <div>
          <label className={label}>Parent Objective</label>
          <select name="parent_id" className={input}>
            <option value="">— None —</option>
            {threads.map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Description</label>
          <MentionTextarea name="description" rows={4} className={`${input} resize-none`} />
        </div>
        <div>
          <label className={label}>Notes <span className="text-xs text-slate-500">(private)</span></label>
          <MentionTextarea name="notes" rows={3} className={`${input} resize-none`} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Create Thread
          </button>
          <Link href="/plot-threads" className="rounded-md border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
