import { db } from '@/lib/db'
import { toggleFactionVisibility } from '@/lib/actions/factions'
import { FilterBar } from '@/components/FilterBar'
import Link from 'next/link'
import { Suspense } from 'react'

interface FactionRow {
  id: string
  name: string
  species: string | null
  culture: string | null
  visible: boolean
  parent: { name: string } | null
}

type SearchParams = Promise<{ species?: string; culture?: string; visible?: string }>

export default async function FactionsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const supabase = db()

  const results = await Promise.all([
    (() => {
      let q = supabase.from('factions').select('*, parent:parent_faction_id(name)').order('name')
      if (params.species) q = q.eq('species', params.species)
      if (params.culture) q = q.eq('culture', params.culture)
      if (params.visible === 'true') q = q.eq('visible', true)
      else if (params.visible === 'false') q = q.eq('visible', false)
      return q
    })(),
    supabase.from('species').select('name').order('name'),
    supabase.from('cultures').select('name').order('name'),
  ])

  const factions = (results[0].data ?? []) as unknown as FactionRow[]
  const speciesOptions = (results[1].data ?? []).map((s: any) => ({ value: s.name, label: s.name }))
  const cultureOptions = (results[2].data ?? []).map((c: any) => ({ value: c.name, label: c.name }))

  const filters = [
    { type: 'select' as const, name: 'species', label: 'Species', options: speciesOptions },
    { type: 'select' as const, name: 'culture', label: 'Culture', options: cultureOptions },
    { type: 'select' as const, name: 'visible', label: 'Visibility', options: [{ value: 'true', label: 'Visible' }, { value: 'false', label: 'Hidden' }] },
  ]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Factions</h1>
          <p className="text-sm text-zinc-500 mt-1">{factions.length} entries</p>
        </div>
        <Link href="/factions/new" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          New Faction
        </Link>
      </div>

      <Suspense fallback={null}>
        <FilterBar filters={filters} />
      </Suspense>

      {!factions.length ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center">
          <p className="text-zinc-500 text-sm">No factions match the current filters.</p>
          <Link href="/factions/new" className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700">
            Create the first one →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Parent Faction</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Species</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Culture</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Visible</th>
              </tr>
            </thead>
            <tbody>
              {factions.map((f) => (
                <tr key={f.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <Link href={`/factions/${f.id}`} className="font-medium text-zinc-900 hover:text-indigo-600">
                      {f.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{f.parent?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-zinc-500">{f.species ?? '—'}</td>
                  <td className="px-4 py-3 text-zinc-500">{f.culture ?? '—'}</td>
                  <td className="px-4 py-3">
                    <form action={toggleFactionVisibility}>
                      <input type="hidden" name="id" value={f.id} />
                      <input type="hidden" name="visible" value={String(f.visible)} />
                      <button type="submit" className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium cursor-pointer transition-colors ${
                        f.visible ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }`}>
                        {f.visible ? 'Visible' : 'Hidden'}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
