import { db } from '@/lib/db'
import type { Location, LocationConnection, MapConfig } from '@ttrpg/db'
import { MapCanvas } from './MapCanvas'

export default async function MapPage({ searchParams }: { searchParams: Promise<{ focus?: string }> }) {
  const { focus } = await searchParams
  const supabase = db()

  const results = await Promise.all([
    supabase.from('locations').select('*').order('name'),
    supabase.from('location_connections').select('*'),
    supabase.from('map_configs').select('*').is('location_id', null).maybeSingle(),
  ])

  const allLocations = (results[0].data ?? []) as Location[]
  const allConnections = (results[1].data ?? []) as LocationConnection[]
  const mapConfig = results[2].data as MapConfig | null

  const placed = allLocations.filter(l => l.map_x !== null && l.map_y !== null)
  const unplaced = allLocations.filter(l => (l.map_x === null || l.map_y === null) && !l.waypoint)

  const placedIds = new Set(placed.map(l => l.id))
  const connections = allConnections.filter(
    c => placedIds.has(c.from_location_id) && placedIds.has(c.to_location_id)
  )

  return (
    <div className="h-full">
      <MapCanvas
        placed={placed}
        unplaced={unplaced}
        connections={connections}
        distanceScale={mapConfig?.distance_scale ?? 100}
        travelUnit={mapConfig?.travel_unit ?? 'units'}
        parentId={null}
        mapConfig={mapConfig}
        mapLocationId={null}
        focusNodeId={focus ?? null}
      />
    </div>
  )
}
