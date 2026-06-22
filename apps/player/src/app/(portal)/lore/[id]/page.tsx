import { createClient } from '@/lib/supabase/server'
import { LoreEntry } from '@ttrpg/db'
import Link from 'next/link'
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
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/lore" className="text-zinc-500 hover:text-zinc-700">Lore & Knowledge</Link>
        <span className="text-zinc-300">/</span>
        <span className="text-zinc-900 font-medium">{entry.title}</span>
      </div>

      <div className="mb-6">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">
          {entry.category ?? 'Lore'}{entry.descriptor ? ` · ${entry.descriptor}` : ''}
        </p>
        <h1 className="text-2xl font-bold text-zinc-900">{entry.title}</h1>
      </div>

      {entry.description && (
        <div className="bg-white rounded-lg border border-zinc-200 p-6">
          <p className="text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">{entry.description}</p>
        </div>
      )}
    </div>
  )
}
