'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
  type NodeMouseHandler,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { Location, LocationConnection } from '@ttrpg/db'
import { calcTravelCost, TERRAIN_COLORS } from '@/lib/mapUtils'
import { FloatingCircleEdge } from './FloatingCircleEdge'

const TYPE_COLORS: Record<string, string> = {
  'Sector': '#4f46e5',
  'Star System': '#d97706',
  'Star / Singularity': '#ea580c',
  'World': '#0369a1',
  'Space Station': '#475569',
  'Wilderness': '#16a34a',
  'Ruin': '#92400e',
  'Settlement': '#1d4ed8',
  'District': '#3b82f6',
  'Fortification': '#dc2626',
  'Residence': '#6b7280',
  'Commerce': '#ca8a04',
  'Tavern / Inn': '#d97706',
  'Place of Worship': '#eab308',
  'Government': '#1e3a8a',
  'Prison': '#7f1d1d',
  'Guild / Organization': '#7c3aed',
  'Workshop': '#92400e',
  'Research / Laboratory': '#0e7490',
  'Medical / Healthcare': '#be185d',
  'Entertainment': '#db2777',
  'Transport Hub': '#ea580c',
  'POI': '#7c3aed',
  'Planetoid': '#78716c',
}

const TYPE_SYMBOLS: Record<string, string> = {
  'Sector': '⬡',
  'Star System': '✦',
  'Star / Singularity': '★',
  'World': '⊕',
  'Space Station': '◻',
  'Wilderness': '♦',
  'Ruin': '△',
  'Settlement': '⌂',
  'District': '▣',
  'Fortification': '▲',
  'Residence': '⌂',
  'Commerce': '◆',
  'Tavern / Inn': '◉',
  'Place of Worship': '✦',
  'Government': '⊞',
  'Prison': '▨',
  'Guild / Organization': '◐',
  'Workshop': '⚙',
  'Research / Laboratory': '⬡',
  'Medical / Healthcare': '✚',
  'Entertainment': '♪',
  'Transport Hub': '⊛',
  'POI': '◈',
  'Planetoid': '●',
}

type LocationData = {
  name: string | null
  locType: string | null
  descriptor: string | null
  terrain: string | null
  pathModifiers: string[]
  nodeColor: string
  waypoint: boolean
  hasSubmap: boolean
  mystery: boolean
}

const hiddenHandle: React.CSSProperties = { opacity: 0, width: 0, height: 0, minWidth: 0, minHeight: 0 }

function LocationNode({ id, data, positionAbsoluteX, positionAbsoluteY, selected }: NodeProps) {
  const d = data as LocationData
  const [hovered, setHovered] = useState(false)

  if (d.waypoint) {
    const wColor = TERRAIN_COLORS[d.terrain ?? ''] || '#64748b'
    return (
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: '50%',
          backgroundColor: wColor,
          border: '1px solid rgba(255,255,255,0.3)',
          cursor: 'default',
          position: 'relative',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <Handle type="source" position={Position.Top} style={hiddenHandle} />
        <Handle type="target" position={Position.Top} style={hiddenHandle} />
        {hovered && (
          <div style={{
            position: 'absolute',
            bottom: '120%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1e293b',
            border: '1px solid #475569',
            borderRadius: 6,
            padding: '4px 8px',
            zIndex: 50,
            pointerEvents: 'none',
            fontSize: 10,
            color: '#e2e8f0',
            whiteSpace: 'nowrap',
          }}>
            {d.terrain && <div>Terrain: {d.terrain}</div>}
            {d.pathModifiers?.length > 0 && <div>{d.pathModifiers.join(', ')}</div>}
            <div style={{ color: '#64748b' }}>x: {Math.round(positionAbsoluteX ?? 0)}, y: {Math.round(positionAbsoluteY ?? 0)}</div>
          </div>
        )}
      </div>
    )
  }

  const color = d.mystery ? '#64748b' : (d.nodeColor || TYPE_COLORS[d.locType ?? ''] || '#64748b')
  const symbol = d.mystery ? '?' : (TYPE_SYMBOLS[d.locType ?? ''] || '●')
  const displayName = d.mystery ? '???' : (d.name ?? '(unnamed)')

  return (
    <div
      style={{ position: 'relative', width: 48, height: 48 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Handle type="source" position={Position.Top} style={hiddenHandle} />
      <Handle type="target" position={Position.Top} style={hiddenHandle} />

      {/* Label above */}
      <div style={{
        position: 'absolute',
        top: -22,
        left: '50%',
        transform: 'translateX(-50%)',
        whiteSpace: 'nowrap',
        fontSize: '11px',
        color: d.mystery ? '#64748b' : '#e2e8f0',
        pointerEvents: 'none',
        fontWeight: 500,
      }}>
        {displayName}
      </div>

      {!d.mystery && d.locType === 'POI' && d.descriptor && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: 20,
          fontSize: 9,
          color: '#64748b',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          textAlign: 'center',
        }}>
          {d.descriptor}
        </div>
      )}

      <div
        onClick={(e) => {
          if (d.mystery) return
          const now = Date.now()
          if (_lastClickId === id && now - _lastClickTime < 350) {
            e.stopPropagation()
            _nodeDoubleClick(id, d.hasSubmap)
            _lastClickTime = 0
            _lastClickId = ''
          } else {
            _lastClickTime = now
            _lastClickId = id
          }
        }}
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          border: `2px ${d.mystery ? 'dashed' : 'solid'} ${color}`,
          backgroundColor: `${color}22`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: d.mystery ? '16px' : '18px',
          cursor: d.mystery ? 'default' : 'pointer',
          opacity: d.mystery ? 0.6 : 1,
          outline: selected ? '2px solid #818cf8' : undefined,
          outlineOffset: selected ? '3px' : undefined,
        }}>
        {symbol}
      </div>

      {hovered && !d.mystery && (
        <div style={{
          position: 'absolute',
          bottom: '110%',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#1e293b',
          border: '1px solid #475569',
          borderRadius: 6,
          padding: '6px 10px',
          minWidth: 120,
          zIndex: 50,
          pointerEvents: 'none',
          fontSize: 11,
          color: '#e2e8f0',
          whiteSpace: 'nowrap',
        }}>
          <div style={{ fontWeight: 600 }}>{d.name ?? '(unnamed)'}</div>
          {d.locType && <div style={{ color: '#94a3b8' }}>{d.locType}</div>}
          {d.terrain && <div style={{ color: '#94a3b8' }}>Terrain: {d.terrain}</div>}
          {d.pathModifiers?.length > 0 && <div style={{ color: '#94a3b8' }}>{d.pathModifiers.join(', ')}</div>}
        </div>
      )}
    </div>
  )
}

const nodeTypes = { locationNode: LocationNode }
const edgeTypes = { floatingCircle: FloatingCircleEdge }

// Module-level refs for navigation and double-click detection.
let _nodeDoubleClick: (id: string, hasSubmap: boolean) => void = () => {}
let _lastClickTime = 0
let _lastClickId = ''

function toNode(loc: Location): Node {
  return {
    id: loc.id,
    type: 'locationNode',
    position: { x: loc.map_x ?? 0, y: loc.map_y ?? 0 },
    data: {
      name: loc.name,
      locType: loc.type,
      descriptor: loc.descriptor ?? null,
      terrain: loc.terrain ?? null,
      pathModifiers: loc.path_modifiers ?? [],
      nodeColor: TYPE_COLORS[loc.type ?? ''] ?? '#64748b',
      waypoint: loc.waypoint,
      hasSubmap: loc.has_submap,
      mystery: loc.mystery,
    } as LocationData,
  }
}

function toEdge(
  conn: LocationConnection,
  locById: Map<string, Location>,
  distanceScale: number,
  travelUnit: string
): Edge {
  let label: string | undefined
  if (conn.travel_time_manual && conn.travel_time) {
    label = conn.travel_time
  } else {
    const a = locById.get(conn.from_location_id)
    const b = locById.get(conn.to_location_id)
    if (a?.map_x != null && a.map_y != null && b?.map_x != null && b?.map_y != null) {
      const cost = calcTravelCost(
        a.map_x, a.map_y, a.terrain ?? null, a.path_modifiers ?? [],
        b.map_x, b.map_y, b.terrain ?? null, b.path_modifiers ?? [],
        distanceScale
      )
      label = cost > 0 ? `${cost} ${travelUnit}` : undefined
    }
  }
  return {
    id: conn.id,
    source: conn.from_location_id,
    target: conn.to_location_id,
    type: 'floatingCircle',
    label,
    style: { stroke: '#475569', strokeWidth: 1.5 },
  }
}

function calcRouteCost(
  route: string[],
  locById: Map<string, Location>,
  connections: LocationConnection[],
  distanceScale: number
): number {
  let total = 0
  for (let i = 0; i < route.length - 1; i++) {
    const conn = connections.find(c =>
      (c.from_location_id === route[i] && c.to_location_id === route[i + 1]) ||
      (c.bidirectional && c.to_location_id === route[i] && c.from_location_id === route[i + 1])
    )
    if (!conn) continue
    if (conn.travel_time_manual && conn.travel_time) {
      total += parseFloat(conn.travel_time) || 0
    } else {
      const a = locById.get(route[i])
      const b = locById.get(route[i + 1])
      if (a?.map_x != null && a.map_y != null && b?.map_x != null && b?.map_y != null) {
        total += calcTravelCost(
          a.map_x, a.map_y, a.terrain ?? null, a.path_modifiers ?? [],
          b.map_x, b.map_y, b.terrain ?? null, b.path_modifiers ?? [],
          distanceScale
        )
      }
    }
  }
  return total
}

export interface MapViewProps {
  locations: Location[]
  connections: LocationConnection[]
  distanceScale: number
  travelUnit: string
  locationId?: string | null
  parentLocationId?: string | null
  focusNodeId?: string | null
}

function MapViewInner({ locations, connections, distanceScale, travelUnit, locationId, parentLocationId, focusNodeId }: MapViewProps) {
  const router = useRouter()
  const { fitView } = useReactFlow()
  const [routePlanning, setRoutePlanning] = useState(false)
  const [route, setRoute] = useState<string[]>([])

  useEffect(() => {
    _nodeDoubleClick = (nodeId: string, hasSubmap: boolean) => {
      if (routePlanning) return
      if (hasSubmap) router.push(`/play/map/${nodeId}`)
      else router.push(`/play/locations/${nodeId}`)
    }
    return () => { _nodeDoubleClick = () => {} }
  }, [routePlanning, router])

  const locById = useMemo(() => new Map(locations.map(l => [l.id, l])), [locations])

  const initialNodes = useMemo(() => locations.map(toNode), [locations])
  const initialEdges = useMemo(
    () => connections.map(c => toEdge(c, locById, distanceScale, travelUnit)),
    [connections, locById, distanceScale, travelUnit]
  )

  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  useEffect(() => {
    if (!focusNodeId) return
    const timer = setTimeout(() => {
      fitView({ nodes: [{ id: focusNodeId }], duration: 500, padding: 1.5 })
    }, 150)
    return () => clearTimeout(timer)
  }, [focusNodeId, fitView])

  // Single click: route planning only
  const onNodeClick = useCallback<NodeMouseHandler<Node>>((_event, node) => {
    const d = node.data as LocationData
    if (d.waypoint || d.mystery || !routePlanning) return
    if (route.length === 0) {
      setRoute([node.id])
      return
    }
    const lastId = route[route.length - 1]
    const connected = connections.some(c =>
      (c.from_location_id === lastId && c.to_location_id === node.id) ||
      (c.bidirectional && c.to_location_id === lastId && c.from_location_id === node.id)
    )
    if (!connected) return
    const existingIdx = route.indexOf(node.id)
    if (existingIdx >= 0) {
      setRoute(route.slice(0, existingIdx + 1))
      return
    }
    setRoute([...route, node.id])
  }, [routePlanning, route, connections])

  // Use onPaneClick to detect double-click on empty canvas (go up to parent map)
  const lastPaneClickTime = useRef<number>(0)
  const onPaneClick = useCallback(() => {
    const now = Date.now()
    if (now - lastPaneClickTime.current < 300 && locationId) {
      const parentRoute = parentLocationId ? `/play/map/${parentLocationId}` : '/play/map'
      router.push(`${parentRoute}?focus=${locationId}`)
      lastPaneClickTime.current = 0
    } else {
      lastPaneClickTime.current = now
    }
  }, [locationId, parentLocationId, router])

  const routeTotal = useMemo(
    () => calcRouteCost(route, locById, connections, distanceScale),
    [route, locById, connections, distanceScale]
  )

  return (
    <div className="h-full flex" style={{ position: 'relative' }}>
      <div className="flex-1 bg-slate-950" style={{ position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          nodesDraggable={false}
          nodesConnectable={false}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
          deleteKeyCode={null}
        >
          <Background variant={BackgroundVariant.Dots} color="#1e293b" gap={24} />
          <Controls showInteractive={false} />

          <MiniMap nodeColor="#6366f1" maskColor="rgba(15, 23, 42, 0.7)" style={{ background: '#1e293b', border: '1px solid #334155' }} />
        </ReactFlow>

        {/* Plan Route toggle */}
        <button
          onClick={() => { setRoutePlanning(v => !v); setRoute([]) }}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 10,
          }}
          className={`text-xs px-3 py-1.5 rounded border transition-colors ${
            routePlanning
              ? 'bg-indigo-600 border-indigo-500 text-white'
              : 'bg-slate-800 border-slate-600 text-slate-300 hover:text-slate-100'
          }`}
        >
          {routePlanning ? 'Cancel Route' : 'Plan Route'}
        </button>
      </div>

      {/* Route panel */}
      {routePlanning && (
        <div className="w-56 shrink-0 bg-slate-900 border-l border-slate-700 flex flex-col">
          <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Route</span>
            <button onClick={() => setRoute([])} className="text-xs text-slate-500 hover:text-slate-300">
              Clear
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
            {route.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">
                Click locations to build a route
              </p>
            ) : (
              route.map((locId, i) => {
                const loc = locById.get(locId)
                const isLast = i === route.length - 1
                if (isLast) {
                  return (
                    <div key={locId} className="text-xs text-slate-200 py-0.5">
                      {loc?.name ?? '(unnamed)'}
                    </div>
                  )
                }
                const nextId = route[i + 1]
                const conn = connections.find(c =>
                  (c.from_location_id === locId && c.to_location_id === nextId) ||
                  (c.bidirectional && c.to_location_id === locId && c.from_location_id === nextId)
                )
                let legCostLabel = ''
                if (conn) {
                  if (conn.travel_time_manual && conn.travel_time) {
                    legCostLabel = conn.travel_time
                  } else {
                    const a = locById.get(locId)
                    const b = locById.get(nextId)
                    if (a?.map_x != null && a.map_y != null && b?.map_x != null && b?.map_y != null) {
                      const cost = calcTravelCost(
                        a.map_x, a.map_y, a.terrain ?? null, a.path_modifiers ?? [],
                        b.map_x, b.map_y, b.terrain ?? null, b.path_modifiers ?? [],
                        distanceScale
                      )
                      legCostLabel = cost > 0 ? `${cost} ${travelUnit}` : ''
                    }
                  }
                }
                return (
                  <div key={locId}>
                    <div className="text-xs text-slate-200 py-0.5">{loc?.name ?? '(unnamed)'}</div>
                    <div className="text-[10px] text-slate-500 pl-2 py-0.5">
                      ↓ {legCostLabel}
                    </div>
                  </div>
                )
              })
            )}
          </div>
          {route.length > 1 && (
            <div className="px-4 py-3 border-t border-slate-700">
              <div className="text-xs text-slate-300 font-medium">
                Total: {routeTotal} {travelUnit}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function MapView(props: MapViewProps) {
  return (
    <ReactFlowProvider>
      <MapViewInner {...props} />
    </ReactFlowProvider>
  )
}
