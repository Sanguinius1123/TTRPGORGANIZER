import { createClient } from '@/lib/supabase/server'
import { Species } from '@ttrpg/db'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function SpeciesDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: raw } = await supabase.from('species').select('*').eq('id', id).single()
  if (!raw) notFound()
  const species = raw as Species

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/lore?tab=species" className="text-zinc-500 hover:text-zinc-700">Species / Ancestry</Link>
        <span className="text-zinc-300">/</span>
        <span className="text-zinc-900 font-medium">{species.name}</span>
      </div>

      <div className="mb-6">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">Species / Ancestry</p>
        <h1 className="text-2xl font-bold text-zinc-900">{species.name}</h1>
      </div>

      {species.description && (
        <div className="bg-white rounded-lg border border-zinc-200 p-6">
          <p className="text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">{species.description}</p>
        </div>
      )}
    </div>
  )
}
