import { db } from '@/lib/db'
import { LoreEntry } from '@ttrpg/db'
import { toggleLoreVisibility } from '@/lib/actions/lore'
import { FilterBar } from '@/components/FilterBar'
import { ClickableRow, SubLink, StopPropCell } from '@/components/TableRow'
import Link from 'next/link'
import { Suspense } from 'react'

const LORE_CATEGORIES = [
  'History', 'Myth & Legend', 'Religion & Faith', 'Magic / Technology',
  'Culture & Society', 'Politics & Law', 'Cosmology', 'Bestiary',
  'Languages & Scripts', 'Artifacts & Relics', 'Geography & Astronomy', 'Economy & Trade',
]

type SearchParams = Promise<{ category?: string; visible?: string }>

export default async function LorePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const supabase = db()

  let q = supabase.from('lore_entries').select('*').order('category').order('title')
  if (params.category) q = q.ilike('category', `%${params.category}%`)
  if (params.visible === 'true') q = q.eq('visible', true)
  else if (params.visible === 'false') q = q.eq('visible', false)

  const { data: rawEntries } = await q
  const entries = (rawEntries ?? []) as LoreEntry[]

  const filters = [
    { type: 'select' as const, name: 'category', label: 'Category', options: LORE_CATEGORIES.map(c => ({ value: c, label: c })) },
    { type: 'select' as const, name: 'visible', label: 'Visibility', options: [{ value: 'true', label: 'Visible' }, { value: 'false', label: 'Hidden' }] },
  ]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Lore & Knowledge</h1>
          <p className="text-sm text-zinc-500 mt-1">{entries.length} entries</p>
        </div>
        <Link href="/lore/new" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          New Entry
        </Link>
      </div>

      <Suspense fallback={null}>
        <FilterBar filters={filters} />
      </Suspense>

      {!entries.length ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center">
          <p className="text-zinc-500 text-sm">No lore entries match the current filters.</p>
          <Link href="/lore/new" className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700">
            Create the first one →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Title</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Category</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Visible</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <ClickableRow key={entry.id} href={`/lore/${entry.id}`} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <SubLink href={`/lore/${entry.id}`} className="font-medium text-zinc-900 hover:text-indigo-600">
                      {entry.title}
                    </SubLink>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {entry.category ?? '—'}
                    {entry.descriptor && <span className="text-zinc-400 ml-1">· {entry.descriptor}</span>}
                  </td>
                  <StopPropCell className="px-4 py-3">
                    <form action={toggleLoreVisibility}>
                      <input type="hidden" name="id" value={entry.id} />
                      <input type="hidden" name="visible" value={String(entry.visible)} />
                      <button type="submit" className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium cursor-pointer transition-colors ${
                        entry.visible ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }`}>
                        {entry.visible ? 'Visible' : 'Hidden'}
                      </button>
                    </form>
                  </StopPropCell>
                </ClickableRow>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
