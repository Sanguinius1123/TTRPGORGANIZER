'use client'
import { useState, useCallback } from 'react'
import { BoardPosting } from '@ttrpg/db'
import {
  DndContext, DragEndEvent, DragOverEvent, DragStartEvent,
  DragOverlay, PointerSensor, useSensor, useSensors, closestCenter,
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext, arrayMove, rectSortingStrategy,
} from '@dnd-kit/sortable'
import { PostingCard, PostingCardOverlay, PostingCardMode } from './PostingCard'
import { PostingDetail } from './PostingDetail'
import { claimPosting, untrackPosting, updateSortOrders } from '@/lib/actions/boardPostings'

type Tab = 'available' | 'active' | 'archive'

interface Props {
  mode: PostingCardMode
  campaignId: string
  activePcId?: string | null
  allPostings: BoardPosting[]
  locationNames: Record<string, string>
  npcNames: Record<string, string>
  factionNames: Record<string, string>
  pcNames: Record<string, string>
}

const ARCHIVE_STATUSES = new Set(['completed', 'expired', 'failed', 'abandoned'])

export function ObjectivesBoard({
  mode, campaignId, activePcId, allPostings,
  locationNames, npcNames, factionNames, pcNames,
}: Props) {
  const [tab, setTab] = useState<Tab>('available')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedPosting, setSelectedPosting] = useState<BoardPosting | null>(null)
  const [localPostings, setLocalPostings] = useState(allPostings)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const { setNodeRef: setActiveDropRef, isOver: isOverActiveTab } = useDroppable({ id: 'tab-active' })
  const { setNodeRef: setAvailableDropRef, isOver: isOverAvailableTab } = useDroppable({ id: 'tab-available' })

  // ── Partition postings ─────────────────────────────────────────────────────
  const visible = (p: BoardPosting) => {
    if (mode === 'gm') return true
    if (!p.visible && !p.created_by_pc_id) return false
    if (p.hidden_goal && p.created_by_pc_id !== activePcId) return false
    return true
  }

  const available = localPostings
    .filter(p => p.status === 'open' && visible(p))
    .sort((a, b) => a.created_at.localeCompare(b.created_at))

  const active = localPostings
    .filter(p => p.status === 'active' && visible(p))
    .sort((a, b) => a.sort_order - b.sort_order)

  const archive = localPostings
    .filter(p => ARCHIVE_STATUSES.has(p.status) && visible(p))
    .sort((a, b) => (b.resolved_at ?? b.created_at).localeCompare(a.resolved_at ?? a.created_at))

  // Group available by location
  const availableByLocation: Record<string, BoardPosting[]> = {}
  const unassigned: BoardPosting[] = []
  for (const p of available) {
    if (p.origin_location_id && locationNames[p.origin_location_id]) {
      const loc = locationNames[p.origin_location_id]
      availableByLocation[loc] = [...(availableByLocation[loc] ?? []), p]
    } else {
      unassigned.push(p)
    }
  }
  if (unassigned.length) availableByLocation['Unassigned'] = unassigned
  const locationGroups = Object.entries(availableByLocation).sort(([a], [b]) => a.localeCompare(b))

  // ── DnD handlers ───────────────────────────────────────────────────────────
  const dragging = localPostings.find(p => p.id === activeId) ?? null

  function handleDragStart(e: DragStartEvent) {
    setActiveId(e.active.id as string)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function handleDragOver(_e: DragOverEvent) { /* tab highlights handled via useDroppable isOver */ }

  async function handleDragEnd(e: DragEndEvent) {
    const { active: dndActive, over } = e
    setActiveId(null)

    if (!dndActive || !over) return

    const draggedId = dndActive.id as string
    const overId    = over.id as string

    // Dropped onto Active tab → claim it (open → active)
    if (overId === 'tab-active') {
      const posting = localPostings.find(p => p.id === draggedId)
      if (posting && posting.status === 'open') {
        setLocalPostings(prev => prev.map(p => p.id === draggedId ? { ...p, status: 'active' } : p))
        setTab('active')
        await claimPosting(draggedId)
      }
      return
    }

    // Dropped onto Available tab → untrack it (active → open, non-player-created only)
    if (overId === 'tab-available') {
      const posting = localPostings.find(p => p.id === draggedId)
      if (posting && posting.status === 'active' && !posting.created_by_pc_id) {
        setLocalPostings(prev => prev.map(p => p.id === draggedId ? { ...p, status: 'open' } : p))
        setTab('available')
        await untrackPosting(draggedId)
      }
      return
    }

    // Reorder within Active tab
    if (tab === 'active' && draggedId !== overId) {
      const ids = active.map(p => p.id)
      const oldIdx = ids.indexOf(draggedId)
      const newIdx = ids.indexOf(overId)
      if (oldIdx === -1 || newIdx === -1) return
      const reordered = arrayMove(active, oldIdx, newIdx)
      // Float-based sort orders
      const updates = reordered.map((p, i) => ({ id: p.id, sort_order: (i + 1) * 1000 }))
      setLocalPostings(prev => {
        const map = new Map(updates.map(u => [u.id, u.sort_order]))
        return prev.map(p => map.has(p.id) ? { ...p, sort_order: map.get(p.id)! } : p)
      })
      await updateSortOrders(updates)
    }
  }

  const tabBtn = (t: Tab, label: string, count: number, isOver?: boolean) => (
    <button
      onClick={() => setTab(t)}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        tab === t
          ? 'border-indigo-400 text-indigo-300'
          : 'border-transparent text-slate-400 hover:text-slate-200'
      } ${isOver ? 'border-amber-400 text-amber-300 bg-amber-950/20' : ''}`}
    >
      {label}
      <span className="ml-2 text-xs bg-slate-700 text-slate-400 rounded-full px-1.5 py-0.5">{count}</span>
    </button>
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full">
        {/* Tab bar — Available and Active are both drop targets */}
        <div className="flex border-b border-slate-700 mb-4 gap-1">
          <div ref={setAvailableDropRef}>
            {tabBtn('available', 'Available', available.length, isOverAvailableTab && !!activeId)}
          </div>
          <div ref={setActiveDropRef}>
            {tabBtn('active', 'Active', active.length, isOverActiveTab && !!activeId)}
          </div>
          {tabBtn('archive', 'Archive', archive.length)}
        </div>

        {/* ── Available tab ────────────────────────────────────────────────── */}
        {tab === 'available' && (
          <div className="flex-1 overflow-y-auto space-y-6">
            {locationGroups.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-12">No available postings.</p>
            )}
            {locationGroups.map(([locName, postings]) => (
              <div key={locName}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 px-1">
                  {locName}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {postings.map(p => (
                    <PostingCard
                      key={p.id}
                      posting={p}
                      mode={mode}
                      draggable={false}
                      onClick={setSelectedPosting}
                      activePcId={activePcId}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Active tab ───────────────────────────────────────────────────── */}
        {tab === 'active' && (
          <SortableContext items={active.map(p => p.id)} strategy={rectSortingStrategy}>
            <div className="flex-1 overflow-y-auto">
              {active.length === 0 && (
                <p className="text-slate-500 text-sm text-center py-12">
                  No active objectives. Drag one here from Available, or add a party goal.
                </p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {active.map(p => (
                  <PostingCard
                    key={p.id}
                    posting={p}
                    mode={mode}
                    draggable
                    onClick={setSelectedPosting}
                    activePcId={activePcId}
                    originLocationName={p.origin_location_id ? locationNames[p.origin_location_id] : null}
                  />
                ))}
              </div>
            </div>
          </SortableContext>
        )}

        {/* ── Archive tab ──────────────────────────────────────────────────── */}
        {tab === 'archive' && (
          <div className="flex-1 overflow-y-auto space-y-2">
            {archive.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-12">No archived objectives yet.</p>
            )}
            {archive.map(p => (
              <div
                key={p.id}
                onClick={() => setSelectedPosting(p)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-800/60 border border-slate-700 cursor-pointer hover:bg-slate-700/60 transition-colors"
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${
                  p.status === 'completed' ? 'bg-green-500' :
                  p.status === 'failed'    ? 'bg-red-500' :
                  p.status === 'expired'   ? 'bg-amber-500' : 'bg-slate-500'
                }`} />
                <span className="flex-1 text-sm text-slate-300">{p.title}</span>
                <span className="text-xs text-slate-500 capitalize">{p.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <DragOverlay>
        {dragging && <PostingCardOverlay posting={dragging} mode={mode} />}
      </DragOverlay>

      {/* Detail modal */}
      {selectedPosting && (
        <PostingDetail
          posting={selectedPosting}
          mode={mode}
          activePcId={activePcId ?? null}
          locationNames={locationNames}
          npcNames={npcNames}
          factionNames={factionNames}
          pcNames={pcNames}
          onClose={() => setSelectedPosting(null)}
          onStatusChange={(id, status) => {
            setLocalPostings(prev => prev.map(p => p.id === id ? { ...p, status } : p))
            setSelectedPosting(null)
          }}
        />
      )}
    </DndContext>
  )
}
