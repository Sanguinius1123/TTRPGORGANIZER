import { db } from '@/lib/db'
import { toggleLocationVisibility } from '@/lib/actions/locations'
import { FilterBar } from '@/components/FilterBar'
import { ClickableRow, SubLink, StopPropCell } from '@/components/TableRow'
import Link from 'next/link'
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
  visible: boolean
  parent: { id: string; name: string } | null
}

type SearchParams = Promise<{ type?: string; status?: string; visible?: string; parent?: string }>

export default async function LocationsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const supabase = db()

  const [locResult, parentResult] = await Promise.all([
    (() => {
      let q = supabase.from('locations').select('*, parent:parent_location_id(id, name)').neq('waypoint', true).order('name')
      if (params.type) q = q.ilike('type', `%${params.type}%`)
      if (params.status) q = q.ilike('status', `%${params.status}%`)
      if (params.visible === 'true') q = q.eq('visible', true)
      else if (params.visible === 'false') q = q.eq('visible', false)
      if (params.parent === '__root__') q = q.is('parent_location_id', null)
      else if (params.parent) q = q.eq('parent_location_id', params.parent)
      return q
    })(),
    supabase.from('locations').select('id, name, type').neq('waypoint', true).not('name', 'is', null).order('name'),
  ])

  const locations = (locResult.data ?? []) as unknown as LocationRow[]
  const parentOptions = (parentResult.data ?? []) as Array<{ id: string; name: string; type: string | null }>

  const filters = [
    { type: 'select' as const, name: 'type', label: 'Type', options: LOCATION_TYPES.map(t => ({ value: t, label: t })) },
    { type: 'text' as const, name: 'status', label: 'Status', placeholder: 'active, ruins…' },
    { type: 'select' as const, name: 'visible', label: 'Visibility', options: [{ value: 'true', label: 'Visible' }, { value: 'false', label: 'Hidden' }] },
    {
      type: 'select' as const, name: 'parent', label: 'Inside',
      options: [
        { value: '__root__', label: '— Root level —' },
        ...parentOptions.map(p => ({ value: p.id, label: p.type ? `${p.name} (${p.type})` : p.name })),
      ],
    },
  ]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Locations</h1>
          <p className="text-sm text-slate-500 mt-1">{locations.length} entries</p>
        </div>
        <Link href="/locations/new" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          New Location
        </Link>
      </div>

      <Suspense fallback={null}>
        <FilterBar filters={filters} />
      </Suspense>

      {!locations.length ? (
        <div className="rounded-lg border border-dashed border-slate-600 p-12 text-center">
          <p className="text-slate-500 text-sm">No locations match the current filters.</p>
          <Link href="/locations/new" className="mt-3 inline-block text-sm font-medium text-indigo-400 hover:text-indigo-300">
            Create the first one →
          </Link>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800">
                <th className="text-left px-4 py-3 font-medium text-slate-400">Name</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400">Type</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400">Parent</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400">Visible</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((loc) => (
                <ClickableRow key={loc.id} href={`/locations/${loc.id}`} className="border-b border-slate-700/50 last:border-0 hover:bg-slate-700/50">
                  <td className="px-4 py-3">
                    <SubLink href={`/locations/${loc.id}`} className="font-medium text-slate-100 hover:text-indigo-400">
                      {loc.name}
                    </SubLink>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {loc.type ?? '—'}
                    {loc.descriptor && <span className="text-slate-500 ml-1">· {loc.descriptor}</span>}
                  </td>
                  <td className="px-4 py-3">
                    {loc.parent
                      ? <SubLink href={`/locations/${loc.parent.id}`} className="text-slate-500 hover:text-indigo-400">{loc.parent.name}</SubLink>
                      : <span className="text-slate-500">—</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{loc.status ?? '—'}</td>
                  <StopPropCell className="px-4 py-3">
                    <form action={toggleLocationVisibility}>
                      <input type="hidden" name="id" value={loc.id} />
                      <input type="hidden" name="visible" value={String(loc.visible)} />
                      <button type="submit" className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium cursor-pointer transition-colors ${
                        loc.visible ? 'bg-green-900/40 text-green-400 hover:bg-green-900/60' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
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
