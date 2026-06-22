import { createClient } from '@/lib/supabase/server'
import { Species } from '@ttrpg/db'
import { notFound } from 'next/navigation'

export default async function SpeciesDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: raw } = await supabase.from('species').select('*').eq('id', id).single()
  if (!raw) notFound()
  const species = raw as Species

  return (
    <div className="p-8 max-w-2xl space-y-4">
      <div>
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">Species / Ancestry</p>
        <h1 className="text-2xl font-bold text-zinc-900">{species.name}</h1>
      </div>
      {species.description && <p className="text-zinc-700 whitespace-pre-wrap">{species.description}</p>}
    </div>
  )
}
