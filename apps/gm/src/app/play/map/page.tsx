import { createAnonClient } from '@/lib/supabase/server'
import type { Location, LocationConnection, MapConfig } from '@ttrpg/db'
import { MapView } from './MapView'

export default async function MapPage({ searchParams }: { searchParams: Promise<{ focus?: string }> }) {
  const { focus } = await searchParams
  const supabase = await createAnonClient()

  const [locsRes, configRes] = await Promise.all([
    supabase.from('locations').select('*').eq('visible', true).is('parent_location_id', null).not('map_x', 'is', null).order('name'),
    supabase.from('map_configs').select('*').is('location_id', null).maybeSingle(),
  ])

  const locations = (locsRes.data ?? []) as Location[]
  const mapConfig = configRes.data as MapConfig | null

  const idList = locations.map(l => l.id)
  const connections: LocationConnection[] = idList.length > 0
    ? ((await supabase.from('location_connections').select('*').or(`from_location_id.in.(${idList.join(',')}),to_location_id.in.(${idList.join(',')})`)).data ?? []) as LocationConnection[]
    : []

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
