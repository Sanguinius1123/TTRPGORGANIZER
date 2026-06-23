import { createClient } from '@/lib/supabase/server'
import type { Location, LocationConnection, MapConfig } from '@ttrpg/db'
import { MapView } from './MapView'

export default async function MapPage({ searchParams }: { searchParams: Promise<{ focus?: string }> }) {
  const { focus } = await searchParams
  const supabase = await createClient()

  const results = await Promise.all([
    supabase.from('locations').select('*').or('visible.eq.true,waypoint.eq.true').is('parent_location_id', null).not('map_x', 'is', null).order('name'),
    supabase.from('location_connections').select('*'),
    supabase.from('map_configs').select('*').is('location_id', null).maybeSingle(),
  ])

  const locations = (results[0].data ?? []) as Location[]
  const allConnections = (results[1].data ?? []) as LocationConnection[]
  const mapConfig = results[2].data as MapConfig | null

  const visibleIds = new Set(locations.map(l => l.id))
  const connections = allConnections.filter(
    c => visibleIds.has(c.from_location_id) && visibleIds.has(c.to_location_id)
  ) as LocationConnection[]

  return (
    <div className="h-full">
      <MapView
        locations={locations}
        connections={connections}
        distanceScale={mapConfig?.distance_scale ?? 100}
        travelUnit={mapConfig?.travel_unit ?? 'units'}
        focusNodeId={focus ?? null}
      />
    </div>
  )
}
