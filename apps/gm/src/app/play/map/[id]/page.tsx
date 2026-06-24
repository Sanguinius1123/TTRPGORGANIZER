import { createAnonClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Location, LocationConnection, MapConfig } from '@ttrpg/db'
import { MapView } from '../MapView'
import Link from 'next/link'

export default async function PlayerSubMapPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ focus?: string }> }) {
  const { id } = await params
  const { focus } = await searchParams
  const supabase = await createAnonClient()

  const { data: rawLoc } = await supabase
    .from('locations')
    .select('*')
    .eq('id', id)
    .eq('visible', true)
    .single()
  if (!rawLoc) notFound()
  const location = rawLoc as Location

  const [locsRes, configRes] = await Promise.all([
    supabase.from('locations').select('*').eq('parent_location_id', id).eq('visible', true).not('map_x', 'is', null).order('name'),
    supabase.from('map_configs').select('*').eq('location_id', id).maybeSingle(),
  ])

  const childLocations = (locsRes.data ?? []) as Location[]
  const mapConfig = configRes.data as MapConfig | null

  const idList = childLocations.map(l => l.id)
  const connections: LocationConnection[] = idList.length > 0
    ? ((await supabase.from('location_connections').select('*').or(`from_location_id.in.(${idList.join(',')}),to_location_id.in.(${idList.join(',')})`)).data ?? []) as LocationConnection[]
    : []

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border-b border-slate-700 text-sm">
        <Link href="/play/map" className="text-slate-400 hover:text-slate-200 transition-colors">Map</Link>
        <span className="text-slate-600">›</span>
        <span className="text-slate-100 font-medium">{location.name ?? '(unnamed)'}</span>
      </div>
      <div className="flex-1 overflow-hidden">
        <MapView
          locations={childLocations}
          connections={connections}
          distanceScale={mapConfig?.distance_scale ?? 100}
          travelUnit={mapConfig?.travel_unit ?? 'units'}
          locationId={id}
          parentLocationId={location.parent_location_id}
          focusNodeId={focus ?? null}
        />
      </div>
    </div>
  )
}
