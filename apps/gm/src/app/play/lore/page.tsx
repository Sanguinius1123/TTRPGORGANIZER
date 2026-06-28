import { createAnonClient } from '@/lib/supabase/server'
import { LoreEntry, Species, Culture } from '@ttrpg/db'
import { ClickableRow, SubLink } from '@/components/TableRow'
import Link from 'next/link'
import { getPlayCampaignId } from '@/lib/playCampaign'

const LORE_CATEGORIES = [
  'History', 'Myth & Legend', 'Religion & Faith', 'Magic / Technology',
  'Culture & Society', 'Politics & Law', 'Cosmology', 'Bestiary',
  'Languages & Scripts', 'Artifacts & Relics', 'Geography & Astronomy', 'Economy & Trade',
]

type SearchParams = Promise<{ tab?: string; category?: string }>

export default async function LorePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const campaignId = await getPlayCampaignId()
  const tab = params.tab ?? 'lore'
  const supabase = await createAnonClient()

  const results = await Promise.all([
    campaignId
      ? supabase.from('lore_entries').select('*').eq('visible', true).eq('campaign_id', campaignId).order('category').order('title')
      : supabase.from('lore_entries').select('*').eq('visible', true).order('category').order('title'),
    campaignId
      ? supabase.from('species').select('*').eq('campaign_id', campaignId).order('name')
      : supabase.from('species').select('*').order('name'),
    campaignId
      ? supabase.from('cultures').select('*').eq('campaign_id', campaignId).order('name')
      : supabase.from('cultures').select('*').order('name'),
  ])

  const allEntries = (results[0].data ?? []) as LoreEntry[]
  const allSpecies = (results[1].data ?? []) as Species[]
  const allCultures = (results[2].data ?? []) as Culture[]

  const entries = params.category
    ? allEntries.filter(e => e.category === params.category)
    : allEntries

  const tabs = [
    { key: 'lore',     label: 'Lore & Knowledge',  count: allEntries.length },
    { key: 'species',  label: 'Species / Ancestry', count: allSpecies.length },
    { key: 'cultures', label: 'Cultures',            count: allCultures.length },
  ]

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Lore & Knowledge</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-slate-700">
        {tabs.map(t => (
          <Link
            key={t.key}
            href={`/play/lore?tab=${t.key}`}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? 'border-indigo-400 text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-200'
            }`}
          >
            {t.label}
            <span className="ml-1.5 text-xs text-slate-500">({t.count})</span>
          </Link>
        ))}
      </div>

      {/* Lore tab */}
      {tab === 'lore' && (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            <Link
              href="/play/lore?tab=lore"
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                !params.category ? 'bg-slate-600 text-white border-slate-600' : 'border-slate-600 text-slate-400 hover:bg-slate-800'
              }`}
            >
              All
            </Link>
            {LORE_CATEGORIES.map(cat => (
              <Link
                key={cat}
                href={`/play/lore?tab=lore&category=${encodeURIComponent(cat)}`}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  params.category === cat ? 'bg-slate-600 text-white border-slate-600' : 'border-slate-600 text-slate-400 hover:bg-slate-800'
                }`}
              >
                {cat}
              </Link>
            ))}
          </div>
          {entries.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-600 p-12 text-center">
              <p className="text-slate-500 text-sm">No lore entries have been revealed yet.</p>
            </div>
          ) : (
            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-800">
                    <th className="text-left px-4 py-3 font-medium text-slate-400">Title</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-400">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map(entry => (
                    <ClickableRow key={entry.id} href={`/play/lore/${entry.id}`} className="border-b border-slate-700/50 last:border-0 hover:bg-slate-800">
                      <td className="px-4 py-3">
                        <SubLink href={`/play/lore/${entry.id}`} className="font-medium text-slate-100 hover:text-indigo-400">
                          {entry.title}
                        </SubLink>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {entry.category ?? '—'}
                        {entry.descriptor && <span className="text-slate-500 ml-1">· {entry.descriptor}</span>}
                      </td>
                    </ClickableRow>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Species tab */}
      {tab === 'species' && (
        allSpecies.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-600 p-12 text-center">
            <p className="text-slate-500 text-sm">No species entries yet.</p>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800">
                  <th className="text-left px-4 py-3 font-medium text-slate-400">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-400">Description</th>
                </tr>
              </thead>
              <tbody>
                {allSpecies.map(s => (
                  <ClickableRow key={s.id} href={`/play/species/${s.id}`} className="border-b border-slate-700/50 last:border-0 hover:bg-slate-800">
                    <td className="px-4 py-3">
                      <SubLink href={`/play/species/${s.id}`} className="font-medium text-slate-100 hover:text-indigo-400">
                        {s.name}
                      </SubLink>
                    </td>
                    <td className="px-4 py-3 text-slate-500 truncate max-w-xs">{s.description ?? '—'}</td>
                  </ClickableRow>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Cultures tab */}
      {tab === 'cultures' && (
        allCultures.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-600 p-12 text-center">
            <p className="text-slate-500 text-sm">No culture entries yet.</p>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800">
                  <th className="text-left px-4 py-3 font-medium text-slate-400">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-400">Description</th>
                </tr>
              </thead>
              <tbody>
                {allCultures.map(c => (
                  <ClickableRow key={c.id} href={`/play/cultures/${c.id}`} className="border-b border-slate-700/50 last:border-0 hover:bg-slate-800">
                    <td className="px-4 py-3">
                      <SubLink href={`/play/cultures/${c.id}`} className="font-medium text-slate-100 hover:text-indigo-400">
                        {c.name}
                      </SubLink>
                    </td>
                    <td className="px-4 py-3 text-slate-500 truncate max-w-xs">{c.description ?? '—'}</td>
                  </ClickableRow>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  )
}
