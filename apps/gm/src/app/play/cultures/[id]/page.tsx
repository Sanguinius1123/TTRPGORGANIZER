import { createAnonClient } from '@/lib/supabase/server'
import { Culture } from '@ttrpg/db'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { renderMentions } from '@/lib/mentions'
import { buildVisibleMentionSet } from '@/lib/mentionVisibility'

export default async function CultureDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createAnonClient()
  const { data: raw } = await supabase.from('cultures').select('*').eq('id', id).single()
  if (!raw) notFound()
  const culture = raw as Culture

  const visibleIds = await buildVisibleMentionSet(supabase, [culture.description])

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/play/lore?tab=cultures" className="text-slate-500 hover:text-slate-300">Cultures</Link>
        <span className="text-slate-600">/</span>
        <span className="text-slate-100 font-medium">{culture.name}</span>
      </div>

      <div className="mb-6">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Culture</p>
        <h1 className="text-2xl font-bold text-slate-100">{culture.name}</h1>
      </div>

      {culture.description && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{renderMentions(culture.description, visibleIds)}</p>
        </div>
      )}
    </div>
  )
}
