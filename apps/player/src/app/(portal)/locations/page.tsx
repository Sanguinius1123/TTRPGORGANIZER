import { createClient } from '@/lib/supabase/server'
import { FilterBar } from '@/components/FilterBar'
import { ClickableRow, SubLink } from '@/components/TableRow'
import { Suspense } from 'react'

const LOCATION_TYPES = [
  'Sector', 'Star System', 'Star / Singularity', 'World', 'Space Station',
  'Wilderness', 'Ruin', 'Settlement', 'District',
  'Fortification', 'Residence', 'Commerce', 'Tavern / Inn', 'Place of Worship',
  'Government', 'Prison', 'Guild / Organization', 'Workshop',
  'Research / Laboratory', 'Medical / Healthcare', 'Entertainment', 'Transport Hub',
]

interface LocationRow {
  id: string
  name: string
  type: string | null
  descriptor: string | null
  status: string | null
  area: string | null
  parent: { id: string; name: string } | null
}

type SearchParams = Promise<{ type?: string; status?: string }>

export default async function LocationsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const supabase = await createClient()

  let q = supabase.from('locations').select('*, parent:parent_location_id(id, name)').eq('visible', true).order('name')
  if (params.type) q = q.ilike('type', `%${params.type}%`)
  if (params.status) q = q.ilike('status', `%${params.status}%`)

  const { data: raw } = await q
  const locations = (raw ?? []) as unknown as LocationRow[]

  const filters = [
    { type: 'select' as const, name: 'type', label: 'Type', options: LOCATION_TYPES.map(t => ({ value: t, label: t })) },
    { type: 'text' as const, name: 'status', label: 'Status', placeholder: 'active, ruins…' },
  ]

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Locations</h1>
        <p className="text-sm text-zinc-500 mt-1">{locations.length} {locations.length === 1 ? 'entry' : 'entries'}</p>
      </div>

      <Suspense fallback={null}>
        <FilterBar filters={filters} />
      </Suspense>

      {locations.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center">
          <p className="text-zinc-500 text-sm">No locations match the current filters.</p>
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
              </tr>
            </thead>
            <tbody>
              {locations.map(loc => (
                <ClickableRow key={loc.id} href={`/locations/${loc.id}`} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <SubLink href={`/locations/${loc.id}`} className="font-medium text-zinc-900 hover:text-indigo-600">
                      {loc.name}
                    </SubLink>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {loc.type ?? '—'}
                    {loc.descriptor && <span className="text-zinc-400 ml-1">· {loc.descriptor}</span>}
                  </td>
                  <td className="px-4 py-3">
                    {loc.parent
                      ? <SubLink href={`/locations/${loc.parent.id}`} className="text-zinc-500 hover:text-indigo-600">{loc.parent.name}</SubLink>
                      : <span className="text-zinc-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{loc.status ?? '—'}</td>
                </ClickableRow>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
