'use client'
import { BoardPosting } from '@ttrpg/db'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export type PostingCardMode = 'gm' | 'player'

// ── Difficulty dot ────────────────────────────────────────────────────────────
const DIFFICULTY_COLOR: Record<string, string> = {
  unknown:  'bg-slate-500',
  trivial:  'bg-green-500',
  challenging: 'bg-yellow-400',
  deadly:   'bg-orange-500',
  suicide:  'bg-red-600',
}

const DIFFICULTY_LABEL: Record<string, string> = {
  unknown:  'Unknown',
  trivial:  'Trivial',
  challenging: 'Challenging',
  deadly:   'Deadly',
  suicide:  'Suicide Mission',
}

// ── Border priority: hidden-goal > deadline > player-created > standard ───────
function borderClass(posting: BoardPosting, isGmHidden: boolean): string {
  if (isGmHidden) return 'border-slate-600 border-dashed'
  if (posting.hidden_goal) return 'border-purple-500'
  if (posting.deadline) return 'border-amber-500'
  if (posting.created_by_pc_id) return 'border-teal-600'
  return 'border-slate-600'
}

function cardBg(posting: BoardPosting, isGmHidden: boolean): string {
  if (isGmHidden) return 'bg-slate-800/50'
  if (posting.hidden_goal) return 'bg-purple-950/30'
  return 'bg-slate-800'
}

interface Props {
  posting: BoardPosting
  mode: PostingCardMode
  draggable?: boolean
  onClick: (posting: BoardPosting) => void
  /** current player's pc id — needed to show/hide player-hidden goals */
  activePcId?: string | null
  originLocationName?: string | null
}

export function PostingCard({ posting, mode, draggable = false, onClick, activePcId, originLocationName }: Props) {
  const isGmHidden = !posting.visible
  const isHiddenGoal = posting.hidden_goal

  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: posting.id, disabled: !draggable })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const dotColor = DIFFICULTY_COLOR[posting.difficulty] ?? DIFFICULTY_COLOR.unknown

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(draggable ? { ...attributes, ...listeners } : {})}
      onClick={() => onClick(posting)}
      className={`
        relative border-2 rounded-lg p-3 cursor-pointer select-none
        transition-all hover:brightness-110 active:scale-95
        ${borderClass(posting, isGmHidden)}
        ${cardBg(posting, isGmHidden)}
      `}
    >
      {/* Difficulty dot */}
      <span className={`absolute top-3 left-3 w-2.5 h-2.5 rounded-full ${dotColor}`} title={DIFFICULTY_LABEL[posting.difficulty] ?? 'Unknown'} />

      {/* GM badge for hidden */}
      {mode === 'gm' && isGmHidden && (
        <span className="absolute top-2 right-2 text-[10px] font-semibold text-slate-400 bg-slate-700 rounded px-1">
          HIDDEN
        </span>
      )}
      {mode === 'gm' && isHiddenGoal && (
        <span className="absolute top-2 right-2 text-[10px] font-semibold text-purple-300 bg-purple-900/50 rounded px-1">
          SECRET
        </span>
      )}

      {/* Title */}
      <p className="pl-4 pr-1 text-sm font-semibold text-slate-100 leading-snug line-clamp-2">
        {posting.title}
      </p>

      {/* Origin location (Available tab) */}
      {originLocationName && (
        <p className="pl-4 mt-0.5 text-[11px] text-slate-500 truncate">{originLocationName}</p>
      )}

      {/* Deadline */}
      {posting.deadline && (
        <p className="mt-1.5 text-[11px] text-amber-400 font-medium truncate">⏳ {posting.deadline}</p>
      )}

      {/* Reward */}
      {posting.reward && (
        <p className="mt-0.5 text-[11px] text-slate-400 truncate">🎁 {posting.reward}</p>
      )}

      {/* Player-created indicator */}
      {posting.created_by_pc_id && !isHiddenGoal && (
        <p className="mt-1 text-[10px] text-teal-400">Party goal</p>
      )}
      {isHiddenGoal && activePcId === posting.created_by_pc_id && (
        <p className="mt-1 text-[10px] text-purple-400">Your secret goal</p>
      )}
      {isHiddenGoal && mode === 'gm' && (
        <p className="mt-1 text-[10px] text-purple-400">Secret goal</p>
      )}
    </div>
  )
}

// ── Drag overlay version (no sortable, used as DragOverlay child) ─────────────
export function PostingCardOverlay({ posting, mode }: { posting: BoardPosting; mode: PostingCardMode }) {
  const isGmHidden = !posting.visible
  const dotColor = DIFFICULTY_COLOR[posting.difficulty] ?? DIFFICULTY_COLOR.unknown

  return (
    <div className={`
      relative border-2 rounded-lg p-3 cursor-grabbing rotate-2 shadow-2xl
      ${borderClass(posting, isGmHidden)}
      ${cardBg(posting, isGmHidden)}
    `}>
      <span className={`absolute top-3 left-3 w-2.5 h-2.5 rounded-full ${dotColor}`} />
      <p className="pl-4 text-sm font-semibold text-slate-100 leading-snug line-clamp-2">{posting.title}</p>
    </div>
  )
}
