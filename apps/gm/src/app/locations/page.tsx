import { db } from '@/lib/db'
import { toggleLocationVisibility } from '@/lib/actions/locations'
import { FilterBar } from '@/components/FilterBar'
import { ClickableRow, SubLink, StopPropCell } from '@/components/TableRow'
import Link from 'next/link'
import { Suspense } from 'react'

interface LocationRow {
  id: string
  name: string
  type: string | null
  status: string | null
  visible: boolean
  parent: { id: string; name: string } | null
}

type SearchParams = Promise<{ type?: string; status?: string; visible?: string }>

export default async function LocationsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const supabase = db()

  let q = supabase.from('locations').select('*, parent:parent_location_id(id, name)').order('name')
  if (params.type) q = q.ilike('type', `%${params.type}%`)
  if (params.status) q = q.ilike('status', `%${params.status}%`)
  if (params.visible === 'true') q = q.eq('visible', true)
  else if (params.visible === 'false') q = q.eq('visible', false)

  const { data: raw } = await q
  const locations = (raw ?? []) as unknown as LocationRow[]

  const filters = [
    { type: 'text' as const, name: 'type', label: 'Type', placeholder: 'settlement, planet…' },
    { type: 'text' as const, name: 'status', label: 'Status', placeholder: 'active, ruins…' },
    { type: 'select' as const, name: 'visible', label: 'Visibility', options: [{ value: 'true', label: 'Visible' }, { value: 'false', label: 'Hidden' }] },
  ]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Locations</h1>
          <p className="text-sm text-zinc-500 mt-1">{locations.length} entries</p>
        </div>
        <Link href="/locations/new" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          New Location
        </Link>
      </div>

      <Suspense fallback={null}>
        <FilterBar filters={filters} />
      </Suspense>

      {!locations.length ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center">
          <p className="text-zinc-500 text-sm">No locations match the current filters.</p>
          <Link href="/locations/new" className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700">
            Create the first one →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Parent</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Visible</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((loc) => (
                <ClickableRow key={loc.id} href={`/locations/${loc.id}`} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <SubLink href={`/locations/${loc.id}`} className="font-medium text-zinc-900 hover:text-indigo-600">
                      {loc.name}
                    </SubLink>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{loc.type ?? '—'}</td>
                  <td className="px-4 py-3">
                    {loc.parent
                      ? <SubLink href={`/locations/${loc.parent.id}`} className="text-zinc-500 hover:text-indigo-600">{loc.parent.name}</SubLink>
                      : <span className="text-zinc-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{loc.status ?? '—'}</td>
                  <StopPropCell className="px-4 py-3">
                    <form action={toggleLocationVisibility}>
                      <input type="hidden" name="id" value={loc.id} />
                      <input type="hidden" name="visible" value={String(loc.visible)} />
                      <button type="submit" className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium cursor-pointer transition-colors ${
                        loc.visible ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }`}>
                        {loc.visible ? 'Visible' : 'Hidden'}
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
