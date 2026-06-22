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
        <Link href="/lore?tab=species" className="text-slate-500 hover:text-slate-300">Species / Ancestry</Link>
        <span className="text-slate-600">/</span>
        <span className="text-slate-100 font-medium">{species.name}</span>
      </div>

      <div className="mb-6">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Species / Ancestry</p>
        <h1 className="text-2xl font-bold text-slate-100">{species.name}</h1>
      </div>

      {species.description && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{species.description}</p>
        </div>
      )}
    </div>
  )
}
