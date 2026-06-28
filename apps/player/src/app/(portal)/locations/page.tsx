import { createClient } from '@/lib/supabase/server'
import { FilterBar } from '@/components/FilterBar'
import { ClickableRow, SubLink } from '@/components/TableRow'
import { Suspense } from 'react'
import { getPlayerCampaignId } from '@/lib/playerCampaign'

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

type SearchParams = Promise<{ type?: string; status?: string; parent?: string }>

export default async function LocationsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const campaignId = await getPlayerCampaignId()
  const supabase = await createClient()

  const [locResult, parentResult] = await Promise.all([
    (() => {
      let q = supabase.from('locations').select('*, parent:parent_location_id(id, name)').eq('visible', true).eq('mystery', false).neq('waypoint', true)
      if (campaignId) q = q.eq('campaign_id', campaignId)
      q = q.order('name')
      if (params.type) q = q.ilike('type', `%${params.type}%`)
      if (params.status) q = q.ilike('status', `%${params.status}%`)
      if (params.parent === '__root__') q = q.is('parent_location_id', null)
      else if (params.parent) q = q.eq('parent_location_id', params.parent)
      return q
    })(),
    (() => {
      let q = supabase.from('locations').select('id, name, type').eq('visible', true).eq('mystery', false).neq('waypoint', true).not('name', 'is', null)
      if (campaignId) q = q.eq('campaign_id', campaignId)
      return q.order('name')
    })(),
  ])

  const locations = (locResult.data ?? []) as unknown as LocationRow[]
  const parentOptions = (parentResult.data ?? []) as Array<{ id: string; name: string; type: string | null }>

  const filters = [
    { type: 'select' as const, name: 'type', label: 'Type', options: LOCATION_TYPES.map(t => ({ value: t, label: t })) },
    { type: 'text' as const, name: 'status', label: 'Status', placeholder: 'active, ruins…' },
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Locations</h1>
        <p className="text-sm text-slate-500 mt-1">{locations.length} {locations.length === 1 ? 'entry' : 'entries'}</p>
      </div>

      <Suspense fallback={null}>
        <FilterBar filters={filters} />
      </Suspense>

      {locations.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-600 p-12 text-center">
          <p className="text-slate-500 text-sm">No locations match the current filters.</p>
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
              </tr>
            </thead>
            <tbody>
              {locations.map(loc => (
                <ClickableRow key={loc.id} href={`/locations/${loc.id}`} className="border-b border-slate-700/50 last:border-0 hover:bg-slate-800">
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
                </ClickableRow>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
