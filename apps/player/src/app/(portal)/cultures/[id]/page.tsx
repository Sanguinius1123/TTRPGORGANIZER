import { createClient } from '@/lib/supabase/server'
import { Culture } from '@ttrpg/db'
import { notFound } from 'next/navigation'

export default async function CultureDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: raw } = await supabase.from('cultures').select('*').eq('id', id).single()
  if (!raw) notFound()
  const culture = raw as Culture

  return (
    <div className="p-8 max-w-2xl space-y-4">
      <div>
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">Culture</p>
        <h1 className="text-2xl font-bold text-zinc-900">{culture.name}</h1>
      </div>
      {culture.description && <p className="text-zinc-700 whitespace-pre-wrap">{culture.description}</p>}
    </div>
  )
}
