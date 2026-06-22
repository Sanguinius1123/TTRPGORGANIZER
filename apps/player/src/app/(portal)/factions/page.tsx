import { createClient } from '@/lib/supabase/server'
import { Faction } from '@ttrpg/db'
import Link from 'next/link'

export default async function FactionsPage() {
  const supabase = await createClient()
  const { data: raw } = await supabase
    .from('factions')
    .select('*')
    .eq('visible', true)
    .order('name')
  const factions = (raw ?? []) as Faction[]

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">Factions</h1>
      {factions.length === 0 ? (
        <p className="text-zinc-500 text-sm">No factions have been revealed yet.</p>
      ) : (
        <div className="space-y-3">
          {factions.map(f => (
            <Link
              key={f.id}
              href={`/factions/${f.id}`}
              className="block rounded-lg bg-white border border-zinc-200 px-5 py-4 hover:border-indigo-300 transition-colors"
            >
              <p className="font-semibold text-zinc-900">{f.name}</p>
              {f.disposition && <p className="text-xs text-zinc-400 mt-0.5">{f.disposition}</p>}
              {f.goal && <p className="text-sm text-zinc-600 mt-1">{f.goal}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
