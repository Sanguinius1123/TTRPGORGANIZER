'use client'
import { useInternalNode, getStraightPath, EdgeLabelRenderer, BaseEdge, type EdgeProps } from '@xyflow/react'

export function FloatingCircleEdge({
  id, source, target, style, label,
}: EdgeProps) {
  const sourceNode = useInternalNode(source)
  const targetNode = useInternalNode(target)

  if (!sourceNode?.measured || !targetNode?.measured) return null

  const sw = (sourceNode.measured.width ?? 48) / 2
  const sh = (sourceNode.measured.height ?? 48) / 2
  const tw = (targetNode.measured.width ?? 48) / 2
  const th = (targetNode.measured.height ?? 48) / 2

  const sx = sourceNode.internals.positionAbsolute.x + sw
  const sy = sourceNode.internals.positionAbsolute.y + sh
  const tx = targetNode.internals.positionAbsolute.x + tw
  const ty = targetNode.internals.positionAbsolute.y + th

  const dx = tx - sx
  const dy = ty - sy
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist === 0) return null

  const ux = dx / dist
  const uy = dy / dist

  // Start point: source circle boundary toward target
  const x1 = sx + ux * sw
  const y1 = sy + uy * sh

  // End point: target circle boundary toward source
  const x2 = tx - ux * tw
  const y2 = ty - uy * th

  const [edgePath, labelX, labelY] = getStraightPath({ sourceX: x1, sourceY: y1, targetX: x2, targetY: y2 })

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              background: 'rgba(15,23,42,0.9)',
              border: '1px solid #334155',
              borderRadius: 4,
              padding: '2px 6px',
              fontSize: 11,
              color: '#94a3b8',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
            className="nodrag nopan"
          >
            {String(label)}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
