import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Location, LocationConnection, MapTypeRule } from '@ttrpg/db'
import { MapView } from '../MapView'
import Link from 'next/link'

export default async function PlayerSubMapPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ focus?: string }> }) {
  const { id } = await params
  const { focus } = await searchParams
  const supabase = await createClient()

  const { data: rawLoc } = await supabase
    .from('locations')
    .select('*')
    .eq('id', id)
    .eq('visible', true)
    .single()
  if (!rawLoc) notFound()
  const location = rawLoc as Location

  const results = await Promise.all([
    supabase
      .from('locations')
      .select('*')
      .eq('parent_location_id', id)
      .eq('visible', true)
      .not('map_x', 'is', null)
      .order('name'),
    supabase.from('location_connections').select('*'),
    supabase.from('map_type_rules').select('*'),
  ])

  const childLocations = (results[0].data ?? []) as Location[]
  const allConnections = (results[1].data ?? []) as LocationConnection[]
  const typeRules = (results[2].data ?? []) as MapTypeRule[]

  const myRule = typeRules.find(r => r.parent_type === location.type) ?? null

  const visibleIds = new Set(childLocations.map(l => l.id))
  const connections = allConnections.filter(
    c => visibleIds.has(c.from_location_id) && visibleIds.has(c.to_location_id)
  ) as LocationConnection[]

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border-b border-slate-700 text-sm">
        <Link href="/map" className="text-slate-400 hover:text-slate-200 transition-colors">Map</Link>
        <span className="text-slate-600">›</span>
        <span className="text-slate-100 font-medium">{location.name ?? '(unnamed)'}</span>
      </div>
      <div className="flex-1 overflow-hidden">
        <MapView
          locations={childLocations}
          connections={connections}
          distanceScale={myRule?.distance_scale ?? 100}
          travelUnit={myRule?.travel_unit ?? 'units'}
          typeRules={typeRules}
          locationId={id}
          parentLocationId={location.parent_location_id}
          focusNodeId={focus ?? null}
        />
      </div>
    </div>
  )
}
