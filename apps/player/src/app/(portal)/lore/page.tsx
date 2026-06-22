import { createClient } from '@/lib/supabase/server'
import { LoreEntry, Species, Culture } from '@ttrpg/db'
import Link from 'next/link'

type SearchParams = Promise<{ tab?: string }>

export default async function LorePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const tab = params.tab ?? 'lore'
  const supabase = await createClient()

  const results = await Promise.all([
    supabase.from('lore_entries').select('*').eq('visible', true).order('category').order('title'),
    supabase.from('species').select('*').order('name'),
    supabase.from('cultures').select('*').order('name'),
  ])

  const entries = (results[0].data ?? []) as LoreEntry[]
  const allSpecies = (results[1].data ?? []) as Species[]
  const allCultures = (results[2].data ?? []) as Culture[]

  const tabs = [
    { key: 'lore',     label: 'Lore & Knowledge', count: entries.length },
    { key: 'species',  label: 'Species / Ancestry', count: allSpecies.length },
    { key: 'cultures', label: 'Cultures',            count: allCultures.length },
  ]

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">Lore & Knowledge</h1>

      <div className="flex gap-1 mb-6 border-b border-zinc-200">
        {tabs.map(t => (
          <Link
            key={t.key}
            href={`/lore?tab=${t.key}`}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            {t.label}
            <span className="ml-1.5 text-xs text-zinc-400">({t.count})</span>
          </Link>
        ))}
      </div>

      {tab === 'lore' && (
        entries.length === 0 ? (
          <p className="text-zinc-500 text-sm">No lore entries have been revealed yet.</p>
        ) : (
          <div className="space-y-2">
            {entries.map(entry => (
              <Link
                key={entry.id}
                href={`/lore/${entry.id}`}
                className="block rounded-lg bg-white border border-zinc-200 px-4 py-3 hover:border-indigo-300 transition-colors"
              >
                <p className="font-medium text-zinc-900">{entry.title}</p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {entry.category ?? '—'}
                  {entry.descriptor && ` · ${entry.descriptor}`}
                </p>
              </Link>
            ))}
          </div>
        )
      )}

      {tab === 'species' && (
        allSpecies.length === 0 ? (
          <p className="text-zinc-500 text-sm">No species entries yet.</p>
        ) : (
          <div className="space-y-2">
            {allSpecies.map(s => (
              <Link
                key={s.id}
                href={`/species/${s.id}`}
                className="block rounded-lg bg-white border border-zinc-200 px-4 py-3 hover:border-indigo-300 transition-colors"
              >
                <p className="font-medium text-zinc-900">{s.name}</p>
                {s.description && <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">{s.description}</p>}
              </Link>
            ))}
          </div>
        )
      )}

      {tab === 'cultures' && (
        allCultures.length === 0 ? (
          <p className="text-zinc-500 text-sm">No culture entries yet.</p>
        ) : (
          <div className="space-y-2">
            {allCultures.map(c => (
              <Link
                key={c.id}
                href={`/cultures/${c.id}`}
                className="block rounded-lg bg-white border border-zinc-200 px-4 py-3 hover:border-indigo-300 transition-colors"
              >
                <p className="font-medium text-zinc-900">{c.name}</p>
                {c.description && <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">{c.description}</p>}
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  )
}
