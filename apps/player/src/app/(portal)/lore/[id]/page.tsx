import { createClient } from '@/lib/supabase/server'
import { LoreEntry } from '@ttrpg/db'
import { notFound } from 'next/navigation'

export default async function LoreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: raw } = await supabase
    .from('lore_entries')
    .select('*')
    .eq('id', id)
    .eq('visible', true)
    .single()
  if (!raw) notFound()
  const entry = raw as LoreEntry

  return (
    <div className="p-8 max-w-2xl space-y-4">
      <div>
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">
          {entry.category ?? 'Lore'}{entry.descriptor ? ` · ${entry.descriptor}` : ''}
        </p>
        <h1 className="text-2xl font-bold text-zinc-900">{entry.title}</h1>
      </div>
      {entry.description && <p className="text-zinc-700 whitespace-pre-wrap">{entry.description}</p>}
    </div>
  )
}
