'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useRouter } from 'next/navigation'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  Handle,
  Position,
  ConnectionMode,
  type Node,
  type Edge,
  type NodeProps,
  type OnNodeDrag,
  type NodeMouseHandler,
  type Connection,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { Location, LocationConnection, MapConfig } from '@ttrpg/db'
import { FloatingCircleEdge } from './FloatingCircleEdge'
import {
  updateLocationPosition,
  removeLocationFromMap,
  placeLocationOnMap,
  createWaypoint,
  toggleLocationSubmap,
  toggleLocationMystery,
  setLocationVisibility,
  createMapLocation,
  updateLocationWaypoint,
} from '@/lib/actions/locations'
import {
  createLocationConnection,
  deleteLocationConnection,
  updateConnectionTravelTime,
  updateConnectionBidirectional,
} from '@/lib/actions/connections'
import { upsertMapConfig } from '@/lib/actions/mapConfigs'
import { calcTravelCost, TERRAIN_COLORS, TERRAIN_LIST, PATH_MODIFIER_LIST, SCALE_TYPES } from '@/lib/mapUtils'

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
  visible: boolean
  rawLoc: Location
  waypoint: boolean
  terrain: string | null
  pathModifiers: string[]
  nodeColor: string
}

type MapCtx = {
  removeNode: (id: string, rawLoc: Location) => void
  onNodeClickInternal: (id: string, data: LocationData) => void
}

const MapContext = createContext<MapCtx>({
  removeNode: () => {},
  onNodeClickInternal: () => {},
})

const HANDLE_POSITIONS = [
  { id: 'n',  top: -3, left: 21 },
  { id: 'ne', top: 3,  left: 39 },
  { id: 'e',  top: 21, left: 45 },
  { id: 'se', top: 39, left: 39 },
  { id: 's',  top: 45, left: 21 },
  { id: 'sw', top: 39, left: 3  },
  { id: 'w',  top: 21, left: -3 },
  { id: 'nw', top: 3,  left: 3  },
]

function LocationNode({ id, data, positionAbsoluteX, positionAbsoluteY, selected }: NodeProps) {
  const d = data as LocationData
  const { removeNode, onNodeClickInternal } = useContext(MapContext)
  const [hovered, setHovered] = useState(false)
  const color = d.nodeColor || TYPE_COLORS[d.locType ?? ''] || '#64748b'
  const symbol = TYPE_SYMBOLS[d.locType ?? ''] || '●'

  return (
    <div
      style={{ position: 'relative', width: 48, height: 48 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group"
    >
      {/* Label above */}
      <div style={{
        position: 'absolute',
        top: -22,
        left: '50%',
        transform: 'translateX(-50%)',
        whiteSpace: 'nowrap',
        fontSize: '11px',
        color: '#e2e8f0',
        pointerEvents: 'none',
        fontWeight: 500,
      }}>
        {d.name ?? '(unnamed)'}
      </div>

      {d.rawLoc.type === 'POI' && d.rawLoc.descriptor && (
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
          {d.rawLoc.descriptor}
        </div>
      )}

      {/* Circle */}
      <div
        onDoubleClick={() => onNodeClickInternal(id, d)}
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          border: `2px ${d.visible ? 'solid' : 'dashed'} ${color}`,
          backgroundColor: `${color}22`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          opacity: d.visible ? 1 : 0.5,
          cursor: 'pointer',
          position: 'relative',
          outline: selected ? '2px solid #818cf8' : undefined,
          outlineOffset: selected ? '4px' : undefined,
        }}
      >
        {symbol}
        {d.rawLoc.mystery && (
          <div
            style={{
              position: 'absolute',
              top: -5,
              right: -5,
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: '#7c3aed',
              border: '1px solid #a78bfa',
              fontSize: 9,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            ?
          </div>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); removeNode(id, d.rawLoc) }}
          onDoubleClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: -6,
            right: -6,
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: '#1e293b',
            border: '1px solid #475569',
            fontSize: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
            cursor: 'pointer',
          }}
          className="opacity-0 group-hover:opacity-100 hover:!bg-red-900 hover:!text-red-300 transition-opacity"
          title="Remove from map"
        >
          ×
        </button>
      </div>

      {/* Handles */}
      {HANDLE_POSITIONS.map(({ id: hid, top, left }) => (
        <Handle
          key={hid}
          id={hid}
          type="source"
          position={Position.Top}
          style={{
            position: 'absolute',
            top,
            left,
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#64748b',
            border: '1px solid #94a3b8',
            opacity: 0,
            transition: 'opacity 0.15s',
          }}
          className="group-hover:!opacity-100"
        />
      ))}

      {/* Tooltip */}
      {hovered && (
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
          <div style={{ color: '#64748b', fontSize: 10 }}>x: {Math.round(positionAbsoluteX ?? 0)}, y: {Math.round(positionAbsoluteY ?? 0)}</div>
        </div>
      )}
    </div>
  )
}

function WaypointNode({ id, data, positionAbsoluteX, positionAbsoluteY }: NodeProps) {
  const d = data as LocationData
  const { removeNode } = useContext(MapContext)
  const [hovered, setHovered] = useState(false)
  const color = TERRAIN_COLORS[d.terrain ?? ''] || '#64748b'

  return (
    <div
      style={{ position: 'relative', width: 16, height: 16 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group"
    >
      <div style={{
        width: 16,
        height: 16,
        borderRadius: '50%',
        backgroundColor: color,
        border: '1px solid rgba(255,255,255,0.3)',
        cursor: 'pointer',
        position: 'relative',
      }}>
        <button
          onClick={(e) => { e.stopPropagation(); removeNode(id, d.rawLoc) }}
          onDoubleClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: -5,
            right: -5,
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: '#1e293b',
            border: '1px solid #475569',
            fontSize: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
            cursor: 'pointer',
          }}
          className="opacity-0 group-hover:opacity-100 hover:!bg-red-900 hover:!text-red-300 transition-opacity"
          title="Remove waypoint"
        >
          ×
        </button>
      </div>

      {[
        { id: 'n', top: -3, left: 5 },
        { id: 'e', top: 5,  left: 13 },
        { id: 's', top: 13, left: 5 },
        { id: 'w', top: 5,  left: -3 },
      ].map(({ id: hid, top, left }) => (
        <Handle
          key={hid}
          id={hid}
          type="source"
          position={Position.Top}
          style={{
            position: 'absolute',
            top,
            left,
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: '#64748b',
            border: '1px solid #94a3b8',
            opacity: 0,
            transition: 'opacity 0.15s',
          }}
          className="group-hover:!opacity-100"
        />
      ))}

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
          minWidth: 80,
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

const nodeTypes = { locationNode: LocationNode, waypointNode: WaypointNode }
const edgeTypes = { floatingCircle: FloatingCircleEdge }

function toNode(loc: Location): Node {
  if (loc.waypoint) {
    return {
      id: loc.id,
      type: 'waypointNode',
      position: { x: loc.map_x ?? 0, y: loc.map_y ?? 0 },
      data: {
        name: null,
        locType: null,
        visible: loc.visible,
        rawLoc: loc,
        waypoint: true,
        terrain: loc.terrain ?? null,
        pathModifiers: loc.path_modifiers ?? [],
        nodeColor: TERRAIN_COLORS[loc.terrain ?? ''] || '#64748b',
      } as LocationData,
    }
  }
  return {
    id: loc.id,
    type: 'locationNode',
    position: { x: loc.map_x ?? 0, y: loc.map_y ?? 0 },
    data: {
      name: loc.name,
      locType: loc.type,
      visible: loc.visible,
      rawLoc: loc,
      waypoint: false,
      terrain: loc.terrain ?? null,
      pathModifiers: loc.path_modifiers ?? [],
      nodeColor: TYPE_COLORS[loc.type ?? ''] || '#64748b',
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

export interface MapCanvasProps {
  placed: Location[]
  unplaced: Location[]
  connections: LocationConnection[]
  distanceScale: number
  travelUnit: string
  parentId: string | null
  mapConfig: MapConfig | null
  mapLocationId: string | null
  focusNodeId?: string | null
  campaignId: string
}

type EdgePanel = {
  conn: LocationConnection
}

type NodeMenu = {
  screenX: number
  screenY: number
  nodeId: string
  nodeData: LocationData
}

type ConfigPanel = {
  screenX: number
  screenY: number
}

function MapCanvasInner({
  placed, unplaced, connections, distanceScale, travelUnit, parentId,
  mapConfig, mapLocationId, focusNodeId, campaignId,
}: MapCanvasProps) {
  const router = useRouter()
  const { screenToFlowPosition, fitView } = useReactFlow()
  const currentScale = mapConfig?.map_scale ?? 'galaxy'
  const scaleTypes = SCALE_TYPES[currentScale] ?? SCALE_TYPES.galaxy
  const otherTypes = scaleTypes.filter(t => t !== 'POI')
  const [unplacedList, setUnplacedList] = useState(unplaced)
  const [showHidden, setShowHidden] = useState(true)
  const [creationMenu, setCreationMenu] = useState<{
    screenX: number
    screenY: number
    flowX: number
    flowY: number
    step: 'pick-type' | 'enter-name' | 'pick-terrain'
    selectedType?: string
  } | null>(null)
  const [waypointTerrain, setWaypointTerrain] = useState<string>(TERRAIN_LIST[0] ?? '')
  const [waypointPaths, setWaypointPaths] = useState<string[]>([])
  const [edgePanel, setEdgePanel] = useState<EdgePanel | null>(null)
  const [edgeTravelTime, setEdgeTravelTime] = useState('')
  const [edgeBidirectional, setEdgeBidirectional] = useState(true)
  const [localConnections, setLocalConnections] = useState<LocationConnection[]>(connections)
  const [locationsState, setLocationsState] = useState<Map<string, Location>>(
    () => new Map(placed.map(l => [l.id, l]))
  )
  const [configPanel, setConfigPanel] = useState<ConfigPanel | null>(null)
  const [showSubMenu, setShowSubMenu] = useState(false)
  const [nodeMenu, setNodeMenu] = useState<NodeMenu | null>(null)

  // Local config state (pre-save)
  const [localConfig, setLocalConfig] = useState<{ mapScale: string; travelUnit: string; distanceScale: number }>({
    mapScale: mapConfig?.map_scale ?? '',
    travelUnit: mapConfig?.travel_unit ?? travelUnit,
    distanceScale: mapConfig?.distance_scale ?? distanceScale,
  })

  // Close all menus on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCreationMenu(null)
        setEdgePanel(null)
        setConfigPanel(null)
        setNodeMenu(null)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Center on a specific node when arriving from a sub-map
  useEffect(() => {
    if (!focusNodeId) return
    const timer = setTimeout(() => {
      fitView({ nodes: [{ id: focusNodeId }], duration: 500, padding: 1.5 })
    }, 150)
    return () => clearTimeout(timer)
  }, [focusNodeId, fitView])

  const effectiveDistanceScale = localConfig.distanceScale
  const effectiveTravelUnit = localConfig.travelUnit || travelUnit

  const recomputeEdges = useCallback((locs: Map<string, Location>, conns: LocationConnection[]) => {
    return conns.map(c => toEdge(c, locs, effectiveDistanceScale, effectiveTravelUnit))
  }, [effectiveDistanceScale, effectiveTravelUnit])

  const initialNodes = useMemo(() => placed.map(l => toNode(l)), [placed])
  const initialEdges = useMemo(
    () => recomputeEdges(locationsState, localConnections),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onNodeDragStop = useCallback<OnNodeDrag<Node>>((_event, node) => {
    void updateLocationPosition(node.id, node.position.x, node.position.y)
    setLocationsState(prev => {
      const next = new Map(prev)
      const existing = next.get(node.id)
      if (existing) {
        next.set(node.id, { ...existing, map_x: node.position.x, map_y: node.position.y })
      }
      setEdges(recomputeEdges(next, localConnections))
      return next
    })
  }, [recomputeEdges, localConnections, setEdges])

  const onNodeClickInternal = useCallback((id: string, data: LocationData) => {
    if (currentScale !== 'local' && data.rawLoc.has_submap) {
      router.push(`/map/${id}`)
    } else {
      router.push(`/locations/${id}`)
    }
  }, [router, currentScale])

  const removeNode = useCallback(async (id: string, rawLoc: Location) => {
    setNodes(prev => prev.filter(n => n.id !== id))
    setLocationsState(prev => { const next = new Map(prev); next.delete(id); return next })
    if (!rawLoc.waypoint) {
      setUnplacedList(prev =>
        [...prev, rawLoc].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
      )
    }
    await removeLocationFromMap(id)
  }, [setNodes])

  const handlePlace = useCallback(async (loc: Location) => {
    const x = 80 + Math.random() * 400
    const y = 80 + Math.random() * 300
    const updatedLoc = { ...loc, map_x: x, map_y: y }
    setNodes(prev => [...prev, toNode(updatedLoc)])
    setLocationsState(prev => new Map(prev).set(loc.id, updatedLoc))
    setUnplacedList(prev => prev.filter(l => l.id !== loc.id))
    await placeLocationOnMap(loc.id, x, y)
  }, [setNodes])

  const onConnect = useCallback(async (params: Connection) => {
    if (!params.source || !params.target) return
    const tempId = `temp-${Date.now()}`
    const tempConn: LocationConnection = {
      id: tempId,
      from_location_id: params.source,
      to_location_id: params.target,
      bidirectional: true,
      travel_time: null,
      travel_time_manual: false,
      travel_cost: null,
      notes: null,
      created_at: new Date().toISOString(),
    }
    setLocalConnections(prev => [...prev, tempConn])
    setEdges(prev => [...prev, toEdge(tempConn, locationsState, effectiveDistanceScale, effectiveTravelUnit)])

    const realConn = await createLocationConnection(params.source, params.target, true)
    setLocalConnections(prev => prev.map(c => c.id === tempId ? realConn : c))
    setEdges(prev => prev.map(e => e.id === tempId ? toEdge(realConn, locationsState, effectiveDistanceScale, effectiveTravelUnit) : e))
  }, [locationsState, effectiveDistanceScale, effectiveTravelUnit, setEdges])

  const onPaneContextMenu = useCallback((e: React.MouseEvent | MouseEvent) => {
    e.preventDefault()
    const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY })
    setNodeMenu(null)
    setConfigPanel(null)
    setCreationMenu({ screenX: e.clientX, screenY: e.clientY, flowX: pos.x, flowY: pos.y, step: 'pick-type' })
  }, [screenToFlowPosition])

  const onNodeContextMenu = useCallback<NodeMouseHandler>((e, node) => {
    e.preventDefault()
    e.stopPropagation()
    const d = node.data as LocationData
    setCreationMenu(null)
    setConfigPanel(null)
    setNodeMenu({ screenX: e.clientX, screenY: e.clientY, nodeId: node.id, nodeData: d })
  }, [])

  const addWaypoint = useCallback(async () => {
    if (!creationMenu) return
    const result = await createWaypoint(
      creationMenu.flowX,
      creationMenu.flowY,
      waypointTerrain || null,
      mapLocationId,
      campaignId
    )
    const newLoc: Location = {
      id: result.id,
      name: null,
      type: null,
      descriptor: null,
      status: null,
      area: null,
      description: null,
      parent_location_id: mapLocationId,
      image_url: null,
      visible: true,
      map_x: creationMenu.flowX,
      map_y: creationMenu.flowY,
      waypoint: true,
      terrain: waypointTerrain || null,
      path_modifiers: waypointPaths,
      has_submap: false,
      mystery: false,
      gm_notes: null,
      campaign_id: campaignId,
      created_at: new Date().toISOString(),
    }
    setNodes(prev => [...prev, toNode(newLoc)])
    setLocationsState(prev => new Map(prev).set(result.id, newLoc))
    setCreationMenu(null)
  }, [creationMenu, waypointTerrain, waypointPaths, parentId, setNodes])

  const onEdgeClick = useCallback((_e: React.MouseEvent, edge: Edge) => {
    const conn = localConnections.find(c => c.id === edge.id)
    if (!conn) return
    setEdgePanel({ conn })
    setEdgeTravelTime(conn.travel_time ?? '')
    setEdgeBidirectional(conn.bidirectional)
  }, [localConnections])

  // Use onPaneClick to detect double-click on empty canvas (go up to parent map)
  // React Flow's onPaneClick already filters out node/edge clicks, so this is reliable
  const lastPaneClickTime = useRef<number>(0)
  const onPaneClick = useCallback(() => {
    setCreationMenu(null)
    setEdgePanel(null)
    setConfigPanel(null)
    setNodeMenu(null)
    const now = Date.now()
    if (now - lastPaneClickTime.current < 300 && mapLocationId) {
      const parentRoute = parentId ? `/map/${parentId}` : '/map'
      router.push(`${parentRoute}?focus=${mapLocationId}`)
      lastPaneClickTime.current = 0
    } else {
      lastPaneClickTime.current = now
    }
  }, [mapLocationId, parentId, router])

  const saveEdgeTravelTime = useCallback(async (value: string) => {
    if (!edgePanel) return
    const id = edgePanel.conn.id
    const manual = value.trim() !== ''
    await updateConnectionTravelTime(id, manual ? value : null, manual)
    setLocalConnections(prev =>
      prev.map(c => c.id === id ? { ...c, travel_time: manual ? value : null, travel_time_manual: manual } : c)
    )
    setEdges(prev => prev.map(e => {
      if (e.id !== id) return e
      const updatedConn = localConnections.find(c => c.id === id)
      if (!updatedConn) return e
      return toEdge(
        { ...updatedConn, travel_time: manual ? value : null, travel_time_manual: manual },
        locationsState,
        effectiveDistanceScale,
        effectiveTravelUnit
      )
    }))
  }, [edgePanel, localConnections, locationsState, effectiveDistanceScale, effectiveTravelUnit, setEdges])

  const saveEdgeBidirectional = useCallback(async (val: boolean) => {
    if (!edgePanel) return
    const id = edgePanel.conn.id
    await updateConnectionBidirectional(id, val)
    setEdgeBidirectional(val)
    setLocalConnections(prev => prev.map(c => c.id === id ? { ...c, bidirectional: val } : c))
    setEdges(prev => prev.map(e => {
      if (e.id !== id) return e
      return {
        ...e,
        }
    }))
  }, [edgePanel, setEdges])

  const deleteEdge = useCallback(async () => {
    if (!edgePanel) return
    const id = edgePanel.conn.id
    setEdges(prev => prev.filter(e => e.id !== id))
    setLocalConnections(prev => prev.filter(c => c.id !== id))
    setEdgePanel(null)
    await deleteLocationConnection(id)
  }, [edgePanel, setEdges])

  const exportPng = useCallback(async () => {
    const { toPng } = await import('html-to-image')
    const el = document.querySelector('.react-flow') as HTMLElement | null
    if (!el) return
    const dataUrl = await toPng(el)
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = 'map.png'
    a.click()
  }, [])

  const handleSaveConfig = useCallback(async () => {
    await upsertMapConfig(
      mapLocationId,
      localConfig.mapScale,
      localConfig.travelUnit,
      localConfig.distanceScale,
    )
    setConfigPanel(null)
  }, [mapLocationId, localConfig])

  const handleToggleSubmap = useCallback(async (nodeId: string, newValue: boolean) => {
    // Optimistically update local state
    setLocationsState(prev => {
      const next = new Map(prev)
      const existing = next.get(nodeId)
      if (existing) {
        next.set(nodeId, { ...existing, has_submap: newValue })
      }
      return next
    })
    setNodes(prev => prev.map(n => {
      if (n.id !== nodeId) return n
      const d = n.data as LocationData
      return {
        ...n,
        data: {
          ...d,
          rawLoc: { ...d.rawLoc, has_submap: newValue },
        },
      }
    }))
    if (nodeMenu) {
      setNodeMenu(prev => prev ? {
        ...prev,
        nodeData: {
          ...prev.nodeData,
          rawLoc: { ...prev.nodeData.rawLoc, has_submap: newValue },
        },
      } : null)
    }
    await toggleLocationSubmap(nodeId, newValue)
  }, [nodeMenu, setNodes])

  const handleToggleMystery = useCallback(async (nodeId: string, newValue: boolean) => {
    setLocationsState(prev => {
      const next = new Map(prev)
      const existing = next.get(nodeId)
      if (existing) next.set(nodeId, { ...existing, mystery: newValue })
      return next
    })
    setNodes(prev => prev.map(n => {
      if (n.id !== nodeId) return n
      const d = n.data as LocationData
      return { ...n, data: { ...d, rawLoc: { ...d.rawLoc, mystery: newValue } } }
    }))
    setNodeMenu(prev => prev ? {
      ...prev,
      nodeData: { ...prev.nodeData, rawLoc: { ...prev.nodeData.rawLoc, mystery: newValue } },
    } : null)
    await toggleLocationMystery(nodeId, newValue)
  }, [setNodes])

  const handleToggleVisibility = useCallback(async (nodeId: string, newValue: boolean) => {
    setLocationsState(prev => {
      const next = new Map(prev)
      const existing = next.get(nodeId)
      if (existing) next.set(nodeId, { ...existing, visible: newValue })
      return next
    })
    setNodes(prev => prev.map(n => {
      if (n.id !== nodeId) return n
      const d = n.data as LocationData
      return { ...n, data: { ...d, visible: newValue, rawLoc: { ...d.rawLoc, visible: newValue } } }
    }))
    setNodeMenu(prev => prev ? {
      ...prev,
      nodeData: { ...prev.nodeData, visible: newValue, rawLoc: { ...prev.nodeData.rawLoc, visible: newValue } },
    } : null)
    await setLocationVisibility(nodeId, newValue)
  }, [setNodes])

  const handleUpdatePathModifiers = useCallback(async (nodeId: string, modifiers: string[]) => {
    const loc = locationsState.get(nodeId)
    setLocationsState(prev => {
      const next = new Map(prev)
      const existing = next.get(nodeId)
      if (existing) next.set(nodeId, { ...existing, path_modifiers: modifiers })
      setEdges(recomputeEdges(next, localConnections))
      return next
    })
    setNodes(prev => prev.map(n => {
      if (n.id !== nodeId) return n
      const d = n.data as LocationData
      return { ...n, data: { ...d, pathModifiers: modifiers, rawLoc: { ...d.rawLoc, path_modifiers: modifiers } } }
    }))
    setNodeMenu(prev => prev ? {
      ...prev,
      nodeData: { ...prev.nodeData, pathModifiers: modifiers, rawLoc: { ...prev.nodeData.rawLoc, path_modifiers: modifiers } },
    } : null)
    await updateLocationWaypoint(nodeId, loc?.terrain ?? null, modifiers)
  }, [locationsState, setNodes, setEdges, recomputeEdges, localConnections])

  const visibleNodes = useMemo(() =>
    showHidden ? nodes : nodes.filter(n => (n.data as LocationData).visible),
    [nodes, showHidden]
  )

  const filteredUnplaced = unplacedList.filter(l => !l.waypoint)

  return (
    <MapContext.Provider value={{ removeNode, onNodeClickInternal }}>
      <div className="flex h-full" style={{ position: 'relative' }}>
        {/* Unplaced sidebar */}
        <div className="w-56 shrink-0 bg-slate-900 border-r border-slate-700 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Unplaced</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {filteredUnplaced.length} location{filteredUnplaced.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
            {filteredUnplaced.length === 0 ? (
              <p className="px-2 py-4 text-xs text-slate-500 text-center">All locations placed</p>
            ) : (
              filteredUnplaced.map(loc => (
                <div key={loc.id} className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-slate-800">
                  <div className="min-w-0 mr-2">
                    <div className="text-sm text-slate-300 truncate">{loc.name ?? '(unnamed)'}</div>
                    {loc.type && <div className="text-[11px] text-slate-500">{loc.type}</div>}
                  </div>
                  <button
                    onClick={() => handlePlace(loc)}
                    className="shrink-0 text-xs text-indigo-400 hover:text-indigo-300 border border-indigo-800 hover:border-indigo-600 px-2 py-0.5 rounded transition-colors"
                  >
                    Place
                  </button>
                </div>
              ))
            )}
          </div>
          <div className="px-4 py-3 border-t border-slate-700 space-y-2">
            <button
              onClick={() => setShowHidden(v => !v)}
              className="w-full text-xs text-slate-400 hover:text-slate-200 border border-slate-600 hover:border-slate-500 rounded px-2 py-1.5 transition-colors"
            >
              {showHidden ? 'Hide Hidden' : 'Show Hidden'}
            </button>
            <button
              onClick={exportPng}
              className="w-full text-xs text-slate-400 hover:text-slate-200 border border-slate-600 hover:border-slate-500 rounded px-2 py-1.5 transition-colors"
            >
              Export PNG
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 h-full bg-slate-950" style={{ position: 'relative' }}>
          <ReactFlow
            nodes={visibleNodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeDragStop={onNodeDragStop}
            onConnect={onConnect}
            onEdgeClick={onEdgeClick}
            onPaneContextMenu={onPaneContextMenu}
            onNodeContextMenu={onNodeContextMenu}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            connectionMode={ConnectionMode.Loose}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            proOptions={{ hideAttribution: true }}
            deleteKeyCode={null}
          >
            <Background variant={BackgroundVariant.Dots} color="#1e293b" gap={24} />
            <Controls style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6 }} />
            <MiniMap
              nodeColor={(node) => {
                const d = node.data as LocationData
                if (d.waypoint) return TERRAIN_COLORS[d.terrain ?? ''] || '#475569'
                return d.visible ? (d.nodeColor || '#475569') : '#1e293b'
              }}
              maskColor="rgba(15, 23, 42, 0.7)"
              style={{ background: '#1e293b', border: '1px solid #334155' }}
            />
          </ReactFlow>

          {/* Creation menu */}
          {creationMenu && (
            <div style={{
              position: 'fixed',
              left: creationMenu.screenX,
              top: Math.min(creationMenu.screenY, window.innerHeight - 180),
              zIndex: 1000,
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 8,
              padding: 12,
              minWidth: 200,
              boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
            }}>
              {creationMenu.step === 'pick-type' && (
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Add location
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                    {/* POI — always first */}
                    <button
                      onClick={() => { setShowSubMenu(false); setCreationMenu(m => m ? { ...m, step: 'enter-name', selectedType: 'POI' } : null) }}
                      style={{ textAlign: 'left', padding: '5px 8px', borderRadius: 4, background: 'transparent', border: 'none', color: '#cbd5e1', fontSize: 13, cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#334155')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      POI
                    </button>

                    {/* Anonymous waypoint — second */}
                    {currentScale !== 'local' && (
                      <button
                        onClick={() => { setShowSubMenu(false); setCreationMenu(m => m ? { ...m, step: 'pick-terrain' } : null) }}
                        style={{ textAlign: 'left', padding: '5px 8px', borderRadius: 4, background: 'transparent', border: 'none', color: '#64748b', fontSize: 13, cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#334155')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        Anonymous waypoint
                      </button>
                    )}

                    {/* More types — hover submenu */}
                    {otherTypes.length > 0 && (
                      <div
                        style={{ position: 'relative' }}
                        onMouseEnter={() => setShowSubMenu(true)}
                        onMouseLeave={() => setShowSubMenu(false)}
                      >
                        <button
                          style={{
                            width: '100%', textAlign: 'left', padding: '5px 8px', borderRadius: 4,
                            background: showSubMenu ? '#334155' : 'transparent',
                            border: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          }}
                        >
                          <span>More types</span>
                          <span style={{ fontSize: 10 }}>▶</span>
                        </button>
                        {showSubMenu && (
                          <div style={{
                            position: 'absolute',
                            left: creationMenu.screenX > window.innerWidth - 420 ? 'auto' : '100%',
                            right: creationMenu.screenX > window.innerWidth - 420 ? '100%' : 'auto',
                            top: 0,
                            background: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: 8,
                            padding: 8,
                            minWidth: 180,
                            boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
                            zIndex: 1001,
                            maxHeight: 'calc(100vh - 40px)',
                            overflowY: 'auto',
                          }}>
                            {otherTypes.map(t => (
                              <button
                                key={t}
                                onClick={() => { setShowSubMenu(false); setCreationMenu(m => m ? { ...m, step: 'enter-name', selectedType: t } : null) }}
                                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '5px 8px', borderRadius: 4, background: 'transparent', border: 'none', color: '#cbd5e1', fontSize: 13, cursor: 'pointer' }}
                                onMouseEnter={e => (e.currentTarget.style.background = '#334155')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div style={{ height: 1, background: '#334155', margin: '4px 0' }} />
                    <button
                      onClick={() => { setShowSubMenu(false); setCreationMenu(null); setConfigPanel({ screenX: creationMenu.screenX, screenY: creationMenu.screenY }) }}
                      style={{ textAlign: 'left', padding: '5px 8px', borderRadius: 4, background: 'transparent', border: 'none', color: '#64748b', fontSize: 13, cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#334155')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      Config…
                    </button>
                  </div>
                </div>
              )}

              {creationMenu.step === 'enter-name' && (
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>
                    New {creationMenu.selectedType}
                  </div>
                  <form onSubmit={async (e) => {
                    e.preventDefault()
                    const nameVal = (e.currentTarget.elements.namedItem('locName') as HTMLInputElement).value.trim()
                    if (!nameVal) return
                    const loc = await createMapLocation(nameVal, creationMenu!.selectedType!, creationMenu!.flowX, creationMenu!.flowY, mapLocationId, campaignId)
                    const newLoc = loc as Location
                    setNodes(prev => [...prev, toNode(newLoc)])
                    setLocationsState(prev => new Map(prev).set(newLoc.id, newLoc))
                    setCreationMenu(null)
                  }}>
                    <input
                      spellCheck
                      name="locName"
                      autoFocus
                      placeholder="Name…"
                      style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #475569', background: '#0f172a', color: '#f1f5f9', fontSize: 13, marginBottom: 8, boxSizing: 'border-box' }}
                    />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button type="submit" style={{ flex: 1, padding: '5px 0', borderRadius: 4, background: '#4f46e5', border: 'none', color: '#fff', fontSize: 13, cursor: 'pointer' }}>
                        Create
                      </button>
                      <button type="button" onClick={() => setCreationMenu(m => m ? { ...m, step: 'pick-type' } : null)}
                        style={{ padding: '5px 10px', borderRadius: 4, background: '#334155', border: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>
                        ←
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {creationMenu.step === 'pick-terrain' && (
                <div>
                  <div className="text-xs font-semibold text-slate-300 mb-2">Add Waypoint</div>
                  <div className="mb-2">
                    <label className="text-xs text-slate-400 block mb-1">Terrain</label>
                    <select
                      value={waypointTerrain}
                      onChange={e => setWaypointTerrain(e.target.value)}
                      className="w-full rounded bg-slate-700 border border-slate-600 px-2 py-1 text-xs text-slate-100 outline-none"
                    >
                      <option value="">— None —</option>
                      {TERRAIN_LIST.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="text-xs text-slate-400 block mb-1">Path Modifiers</label>
                    <div className="space-y-0.5">
                      {PATH_MODIFIER_LIST.map(p => (
                        <label key={p} className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={waypointPaths.includes(p)}
                            onChange={e => setWaypointPaths(prev =>
                              e.target.checked ? [...prev, p] : prev.filter(x => x !== p)
                            )}
                            className="accent-indigo-500"
                          />
                          {p}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={addWaypoint}
                      className="flex-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded px-2 py-1"
                    >
                      Add Waypoint
                    </button>
                    <button
                      onClick={() => setCreationMenu(null)}
                      className="text-xs text-slate-400 hover:text-slate-200 border border-slate-600 rounded px-2 py-1"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Config panel */}
          {configPanel && (
            <div
              style={{
                position: 'fixed',
                top: configPanel.screenY,
                left: configPanel.screenX,
                background: '#1e293b',
                border: '1px solid #475569',
                borderRadius: 8,
                padding: 12,
                zIndex: 1000,
                minWidth: 220,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-300">Map Config</span>
                <button onClick={() => setConfigPanel(null)} className="text-slate-400 hover:text-slate-200 text-sm">×</button>
              </div>
              <div className="mb-2">
                <label className="text-xs text-slate-400 block mb-1">Map Scale</label>
                <select
                  value={localConfig.mapScale}
                  onChange={e => {
                    const scale = e.target.value
                    const unitDefaults: Record<string, { travelUnit: string; distanceScale: number }> = {
                      galaxy: { travelUnit: 'LY',  distanceScale: 50 },
                      system: { travelUnit: 'AU',  distanceScale: 20 },
                      body:   { travelUnit: 'km',  distanceScale: 10 },
                      local:  { travelUnit: 'min', distanceScale: 5  },
                    }
                    const defaults = unitDefaults[scale]
                    setLocalConfig(prev => ({
                      ...prev,
                      mapScale: scale,
                      travelUnit:    prev.travelUnit    || (defaults?.travelUnit    ?? prev.travelUnit),
                      distanceScale: prev.distanceScale || (defaults?.distanceScale ?? prev.distanceScale),
                    }))
                  }}
                  className="w-full rounded bg-slate-700 border border-slate-600 px-2 py-1 text-xs text-slate-100 outline-none"
                >
                  <option value="">— none —</option>
                  <option value="galaxy">Galaxy</option>
                  <option value="system">System</option>
                  <option value="body">Body</option>
                  <option value="local">Local</option>
                </select>
              </div>
              <div className="mb-2">
                <label className="text-xs text-slate-400 block mb-1">Travel Unit</label>
                <input
                  spellCheck
                  value={localConfig.travelUnit}
                  onChange={e => setLocalConfig(prev => ({ ...prev, travelUnit: e.target.value }))}
                  placeholder="light years, days, AU…"
                  className="w-full rounded bg-slate-700 border border-slate-600 px-2 py-1 text-xs text-slate-100 outline-none focus:border-indigo-400"
                />
              </div>
              <div className="mb-3">
                <label className="text-xs text-slate-400 block mb-1">Distance Scale</label>
                <input
                  type="number"
                  min={1}
                  value={localConfig.distanceScale}
                  onChange={e => setLocalConfig(prev => ({ ...prev, distanceScale: Number(e.target.value) }))}
                  className="w-full rounded bg-slate-700 border border-slate-600 px-2 py-1 text-xs text-slate-100 outline-none focus:border-indigo-400"
                />
              </div>
              <button
                onClick={handleSaveConfig}
                className="w-full text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded px-2 py-1.5"
              >
                Save
              </button>
            </div>
          )}

          {/* Node context menu */}
          {nodeMenu && (
            <div
              style={{
                position: 'fixed',
                top: nodeMenu.screenY,
                left: nodeMenu.screenX,
                background: '#1e293b',
                border: '1px solid #475569',
                borderRadius: 8,
                padding: 8,
                zIndex: 1000,
                minWidth: 180,
              }}
            >
              <div className="text-[11px] text-slate-500 mb-2 truncate px-1">
                {nodeMenu.nodeData.waypoint ? 'Waypoint' : (nodeMenu.nodeData.name ?? '(unnamed)')}
              </div>
              <div className="flex flex-col gap-1">
                {!nodeMenu.nodeData.waypoint && (
                  <button
                    onClick={() => { setNodeMenu(null); router.push(`/locations/${nodeMenu.nodeId}`) }}
                    className="text-xs text-left text-slate-200 hover:text-white hover:bg-slate-700 rounded px-2 py-1.5 transition-colors"
                  >
                    Details
                  </button>
                )}
                {currentScale !== 'local' && (
                  <>
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer hover:bg-slate-700 rounded px-2 py-1.5">
                      <input
                        type="checkbox"
                        checked={nodeMenu.nodeData.rawLoc.visible}
                        onChange={() => handleToggleVisibility(nodeMenu.nodeId, !nodeMenu.nodeData.rawLoc.visible)}
                        className="accent-emerald-500"
                      />
                      Visible to players
                    </label>
                    {!nodeMenu.nodeData.waypoint && (
                      <>
                        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer hover:bg-slate-700 rounded px-2 py-1.5">
                          <input
                            type="checkbox"
                            checked={nodeMenu.nodeData.rawLoc.has_submap}
                            onChange={() => handleToggleSubmap(nodeMenu.nodeId, !nodeMenu.nodeData.rawLoc.has_submap)}
                            className="accent-indigo-500"
                          />
                          Has sub-map
                        </label>
                        <button
                          onClick={() => { setNodeMenu(null); router.push(`/map/${nodeMenu.nodeId}`) }}
                          disabled={!nodeMenu.nodeData.rawLoc.has_submap}
                          className="text-xs text-left text-slate-200 hover:text-white hover:bg-slate-700 rounded px-2 py-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Open Sub-map
                        </button>
                        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer hover:bg-slate-700 rounded px-2 py-1.5">
                          <input
                            type="checkbox"
                            checked={nodeMenu.nodeData.rawLoc.mystery}
                            onChange={() => handleToggleMystery(nodeMenu.nodeId, !nodeMenu.nodeData.rawLoc.mystery)}
                            className="accent-purple-500"
                          />
                          Mystery
                        </label>
                      </>
                    )}
                  </>
                )}
                {(currentScale === 'body' || currentScale === 'local') && PATH_MODIFIER_LIST.length > 0 && (
                  <div className="mt-1 pt-1 border-t border-slate-700">
                    <div className="text-[10px] text-slate-500 px-2 py-1 uppercase tracking-wide">Path Modifiers</div>
                    {PATH_MODIFIER_LIST.map(p => (
                      <label key={p} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer hover:bg-slate-700 rounded px-2 py-1">
                        <input
                          type="checkbox"
                          checked={nodeMenu.nodeData.pathModifiers.includes(p)}
                          onChange={e => {
                            const next = e.target.checked
                              ? [...nodeMenu.nodeData.pathModifiers, p]
                              : nodeMenu.nodeData.pathModifiers.filter(x => x !== p)
                            handleUpdatePathModifiers(nodeMenu.nodeId, next)
                          }}
                          className="accent-indigo-500"
                        />
                        {p}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Edge panel */}
          {edgePanel && (
            <div style={{
              position: 'absolute',
              top: 16,
              right: 16,
              background: '#1e293b',
              border: '1px solid #475569',
              borderRadius: 8,
              padding: 12,
              zIndex: 100,
              minWidth: 200,
            }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-300">Connection</span>
                <button onClick={() => setEdgePanel(null)} className="text-slate-400 hover:text-slate-200 text-sm">×</button>
              </div>
              <div className="mb-2">
                <label className="text-xs text-slate-400 block mb-1">Travel Time</label>
                <input
                  spellCheck
                  value={edgeTravelTime}
                  onChange={e => setEdgeTravelTime(e.target.value)}
                  onBlur={e => saveEdgeTravelTime(e.target.value)}
                  placeholder="e.g. 3 days (manual override)"
                  className="w-full rounded bg-slate-700 border border-slate-600 px-2 py-1 text-xs text-slate-100 outline-none focus:border-indigo-400"
                />
                <p className="text-[10px] text-slate-500 mt-0.5">Leave empty to use auto-calculation</p>
              </div>
              <label className="flex items-center gap-2 mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={edgeBidirectional}
                  onChange={e => saveEdgeBidirectional(e.target.checked)}
                  className="accent-indigo-500"
                />
                <span className="text-xs text-slate-300">Bidirectional</span>
              </label>
              <button
                onClick={deleteEdge}
                className="w-full text-xs text-red-400 hover:text-red-300 border border-red-900 hover:border-red-700 rounded px-2 py-1"
              >
                Delete Connection
              </button>
            </div>
          )}
        </div>
      </div>
    </MapContext.Provider>
  )
}

export function MapCanvas(props: MapCanvasProps) {
  return (
    <ReactFlowProvider>
      <MapCanvasInner {...props} />
    </ReactFlowProvider>
  )
}
