import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import type { Location, LocationConnection, MapConfig } from '@ttrpg/db'
import { MapCanvas } from '../MapCanvas'
import { Breadcrumb } from '../Breadcrumb'
import Link from 'next/link'
import { getActiveCampaignId } from '@/lib/activeCampaign'

async function getAncestors(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  startId: string | null
): Promise<Array<{ id: string; name: string | null }>> {
  const ancestors: Array<{ id: string; name: string | null }> = []
  let currentId: string | null = startId
  while (currentId) {
    const { data } = await supabase
      .from('locations')
      .select('id, name, parent_location_id')
      .eq('id', currentId)
      .single()
    if (!data) break
    ancestors.unshift({ id: data.id as string, name: data.name as string | null })
    currentId = data.parent_location_id as string | null
  }
  return ancestors
}

export default async function SubMapPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ focus?: string }> }) {
  const { id } = await params
  const { focus } = await searchParams
  const campaignId = await getActiveCampaignId()
  const supabase = db()

  const { data: rawLoc } = await supabase.from('locations').select('*').eq('id', id).single()
  if (!rawLoc) notFound()
  const location = rawLoc as Location

  const results = await Promise.all([
    supabase.from('locations').select('*').eq('parent_location_id', id).order('name'),
    supabase.from('location_connections').select('*'),
    supabase.from('map_configs').select('*').eq('location_id', id).maybeSingle(),
  ])

  const childLocations = (results[0].data ?? []) as Location[]
  const allConnections = (results[1].data ?? []) as LocationConnection[]
  const mapConfig = results[2].data as MapConfig | null

  const placed = childLocations.filter(l => l.map_x !== null && l.map_y !== null)
  const unplaced = childLocations.filter(l => (l.map_x === null || l.map_y === null) && !l.waypoint)

  const placedIds = new Set(placed.map(l => l.id))
  const connections = allConnections.filter(
    c => placedIds.has(c.from_location_id) && placedIds.has(c.to_location_id)
  )

  // Build ancestor chain
  const ancestors = location.parent_location_id
    ? await getAncestors(supabase, location.parent_location_id)
    : []

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between border-b border-slate-700 bg-slate-900 pr-4">
        <Breadcrumb ancestors={ancestors} current={{ id: location.id, name: location.name }} />
        <Link
          href={`/locations/new?parent=${id}`}
          className="text-xs text-indigo-400 hover:text-indigo-300 border border-indigo-800 hover:border-indigo-600 px-2 py-1 rounded transition-colors"
        >
          + New Location
        </Link>
      </div>
      <div className="flex-1 overflow-hidden">
        <MapCanvas
          placed={placed}
          unplaced={unplaced}
          connections={connections}
          distanceScale={mapConfig?.distance_scale ?? 100}
          travelUnit={mapConfig?.travel_unit ?? 'units'}
          parentId={location.parent_location_id}
          mapConfig={mapConfig}
          mapLocationId={id}
          focusNodeId={focus ?? null}
          campaignId={campaignId ?? location.campaign_id}
        />
      </div>
    </div>
  )
}
