import { createAnonClient } from '@/lib/supabase/server'
import { PlotThread } from '@ttrpg/db'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { renderMentionsPlayer } from '@/lib/mentions'
import { buildVisibleMentionSet } from '@/lib/mentionVisibility'

const typeColor: Record<string, string> = {
  objective: 'bg-indigo-900/40 text-indigo-300 border-indigo-700',
  hook:      'bg-amber-900/30 text-amber-300 border-amber-700',
  thread:    'bg-slate-700 text-slate-300 border-slate-600',
}
const statusColor: Record<string, string> = {
  active:    'bg-green-900/40 text-green-400 border-green-700',
  completed: 'bg-slate-700 text-slate-500 border-slate-600',
  abandoned: 'bg-red-900/30 text-red-400 border-red-700',
}

export default async function PlotThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createAnonClient()

  const { data: raw } = await supabase
    .from('plot_threads')
    .select('id, title, type, description, status, notes, parent_id, visible, campaign_id, created_at')
    .eq('id', id)
    .eq('visible', true)
    .single()
  if (!raw) notFound()
  const thread = raw as PlotThread

  const visibleIds = await buildVisibleMentionSet(supabase, [thread.description])

  // Child threads that are also visible
  const { data: childRaw } = await supabase
    .from('plot_threads')
    .select('id, title, type, status')
    .eq('parent_id', id)
    .eq('visible', true)
    .order('status')
    .order('title')
  const children = (childRaw ?? []) as Array<{ id: string; title: string; type: string; status: string }>

  let parent: { id: string; title: string } | null = null
  if (thread.parent_id) {
    const { data: p } = await supabase
      .from('plot_threads')
      .select('id, title')
      .eq('id', thread.parent_id)
      .eq('visible', true)
      .single()
    parent = p as { id: string; title: string } | null
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Link href="/play" className="text-sm text-slate-500 hover:text-slate-300">Home</Link>
        {parent && (
          <>
            <span className="text-slate-600">/</span>
            <Link href={`/play/plot-threads/${parent.id}`} className="text-sm text-slate-500 hover:text-slate-300">{parent.title}</Link>
          </>
        )}
        <span className="text-slate-600">/</span>
        <span className="text-sm text-slate-100 font-medium">{thread.title}</span>
      </div>

      <div className="flex items-start gap-3 mb-6">
        <h1 className="text-2xl font-bold text-slate-100 flex-1">{thread.title}</h1>
        <div className="flex gap-2 shrink-0">
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border ${typeColor[thread.type] ?? 'bg-slate-700 text-slate-300 border-slate-600'}`}>
            {thread.type}
          </span>
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border ${statusColor[thread.status] ?? 'bg-slate-700 text-slate-300 border-slate-600'}`}>
            {thread.status}
          </span>
        </div>
      </div>

      {thread.description && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-5 mb-6 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
          {renderMentionsPlayer(thread.description, visibleIds)}
        </div>
      )}

      {children.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Related</h2>
          <div className="bg-slate-800 rounded-lg border border-slate-700 divide-y divide-slate-700/50 overflow-hidden">
            {children.map(c => (
              <Link
                key={c.id}
                href={`/play/plot-threads/${c.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-slate-700/50 transition-colors"
              >
                <span className="text-sm font-medium text-slate-100 hover:text-indigo-400">{c.title}</span>
                <div className="flex gap-2 shrink-0">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium border ${typeColor[c.type] ?? 'bg-slate-700 text-slate-300 border-slate-600'}`}>{c.type}</span>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium border ${statusColor[c.status] ?? 'bg-slate-700 text-slate-300 border-slate-600'}`}>{c.status}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
