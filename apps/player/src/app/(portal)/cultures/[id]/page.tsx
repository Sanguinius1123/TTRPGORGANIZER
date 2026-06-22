import { createClient } from '@/lib/supabase/server'
import { Culture } from '@ttrpg/db'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function CultureDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: raw } = await supabase.from('cultures').select('*').eq('id', id).single()
  if (!raw) notFound()
  const culture = raw as Culture

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/lore?tab=cultures" className="text-zinc-500 hover:text-zinc-700">Cultures</Link>
        <span className="text-zinc-300">/</span>
        <span className="text-zinc-900 font-medium">{culture.name}</span>
      </div>

      <div className="mb-6">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">Culture</p>
        <h1 className="text-2xl font-bold text-zinc-900">{culture.name}</h1>
      </div>

      {culture.description && (
        <div className="bg-white rounded-lg border border-zinc-200 p-6">
          <p className="text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">{culture.description}</p>
        </div>
      )}
    </div>
  )
}
