import { createClient } from '@/lib/supabase/server'
import type { Location, LocationConnection, MapTypeRule } from '@ttrpg/db'
import { MapView } from './MapView'

export default async function MapPage({ searchParams }: { searchParams: Promise<{ focus?: string }> }) {
  const { focus } = await searchParams
  const supabase = await createClient()

  const results = await Promise.all([
    supabase.from('locations').select('*').eq('visible', true).is('parent_location_id', null).not('map_x', 'is', null).order('name'),
    supabase.from('location_connections').select('*'),
    supabase.from('map_type_rules').select('*').is('parent_type', null).maybeSingle(),
    supabase.from('map_type_rules').select('*'),
  ])

  const locations = (results[0].data ?? []) as Location[]
  const allConnections = (results[1].data ?? []) as LocationConnection[]
  const rootRule = results[2].data as MapTypeRule | null
  const typeRules = (results[3].data ?? []) as MapTypeRule[]

  const visibleIds = new Set(locations.map(l => l.id))
  const connections = allConnections.filter(
    c => visibleIds.has(c.from_location_id) && visibleIds.has(c.to_location_id)
  ) as LocationConnection[]

  return (
    <div className="h-full">
      <MapView
        locations={locations}
        connections={connections}
        distanceScale={rootRule?.distance_scale ?? 100}
        travelUnit={rootRule?.travel_unit ?? 'units'}
        typeRules={typeRules}
        focusNodeId={focus ?? null}
      />
    </div>
  )
}
