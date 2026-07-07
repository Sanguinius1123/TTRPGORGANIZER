import { createAnonClient } from '@/lib/supabase/server'
import { LoreEntry } from '@ttrpg/db'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { renderMentionsPlayer } from '@/lib/mentions'
import { buildVisibleMentionSet } from '@/lib/mentionVisibility'
import { getActivePcId } from '@/lib/activePC'
import { WatchButton } from '@/components/WatchButton'

export default async function LoreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createAnonClient()
  const activePcId = await getActivePcId()

  const { data: raw } = await supabase
    .from('lore_entries')
    .select('*')
    .eq('id', id)
    .eq('visible', true)
    .single()
  if (!raw) notFound()
  const entry = raw as LoreEntry

  const visibleIds = await buildVisibleMentionSet(supabase, [entry.description])

  let isWatching = false
  if (activePcId) {
    const { data: watchData } = await supabase.from('pc_watches')
      .select('id').eq('pc_id', activePcId).eq('entity_type', 'lore').eq('entity_id', id).maybeSingle()
    isWatching = !!watchData
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/play/lore" className="text-slate-500 hover:text-slate-300">Lore & Knowledge</Link>
        <span className="text-slate-600">/</span>
        <span className="text-slate-100 font-medium">{entry.title}</span>
      </div>

      <div className="mb-6">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
          {entry.category ?? 'Lore'}{entry.descriptor ? ` · ${entry.descriptor}` : ''}
        </p>
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-slate-100">{entry.title}</h1>
          {activePcId && <WatchButton pcId={activePcId} entityType="lore" entityId={id} initialWatching={isWatching} />}
        </div>
      </div>

      {entry.description && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{renderMentionsPlayer(entry.description, visibleIds)}</p>
        </div>
      )}
    </div>
  )
}
