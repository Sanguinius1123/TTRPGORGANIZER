'use client'
import { useState, useTransition } from 'react'
import { BoardPosting } from '@ttrpg/db'
import { PostingCardMode } from './PostingCard'
import {
  claimPosting, setPostingStatus, updatePartyNotes,
  togglePostingVisible, publishHiddenGoal,
} from '@/lib/actions/boardPostings'

const ARCHIVE_STATUSES = ['completed', 'failed', 'expired', 'abandoned']

const DIFFICULTY_LABEL: Record<string, string> = {
  unknown: 'Unknown', trivial: 'Trivial', challenging: 'Challenging',
  deadly: 'Deadly', suicide: 'Suicide Mission',
}

const STATUS_COLORS: Record<string, string> = {
  open:      'text-slate-400',
  active:    'text-indigo-300',
  completed: 'text-green-400',
  failed:    'text-red-400',
  expired:   'text-amber-400',
  abandoned: 'text-slate-500',
}

interface Props {
  posting: BoardPosting
  mode: PostingCardMode
  activePcId: string | null
  locationNames: Record<string, string>
  npcNames: Record<string, string>
  factionNames: Record<string, string>
  pcNames: Record<string, string>
  onClose: () => void
  onStatusChange: (id: string, status: string) => void
}

export function PostingDetail({
  posting, mode, activePcId, locationNames, npcNames, factionNames, pcNames,
  onClose, onStatusChange,
}: Props) {
  const [notes, setNotes] = useState(posting.party_notes ?? '')
  const [isPending, startTransition] = useTransition()

  const postedBy = posting.posted_by_npc_id
    ? npcNames[posting.posted_by_npc_id]
    : posting.posted_by_faction_id
    ? factionNames[posting.posted_by_faction_id]
    : posting.posted_by_name
    ? posting.posted_by_name
    : null

  const createdBy = posting.created_by_pc_id ? pcNames[posting.created_by_pc_id] : null

  const canEdit = mode === 'gm' || (posting.created_by_pc_id === activePcId)
  const isArchived = ARCHIVE_STATUSES.includes(posting.status)

  function saveNotes() {
    startTransition(async () => { await updatePartyNotes(posting.id, notes) })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-700">
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${STATUS_COLORS[posting.status] ?? 'text-slate-400'}`}>
              {posting.status}
              {posting.board_label && <span className="ml-2 text-slate-500 normal-case font-normal">· {posting.board_label}</span>}
            </p>
            <h2 className="text-lg font-bold text-slate-100 leading-snug">{posting.title}</h2>
          </div>
          <button onClick={onClose} className="ml-3 text-slate-500 hover:text-slate-300 text-xl leading-none">×</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Meta row */}
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="text-slate-400">Difficulty: <span className="text-slate-200">{DIFFICULTY_LABEL[posting.difficulty] ?? posting.difficulty}</span></span>
            {posting.deadline && <span className="text-amber-400">⏳ {posting.deadline}</span>}
            {posting.reward  && <span className="text-slate-400">Reward: <span className="text-slate-200">{posting.reward}</span></span>}
          </div>

          {/* Origin / posted by */}
          {(posting.origin_location_id || postedBy) && (
            <div className="text-sm text-slate-400 space-y-0.5">
              {posting.origin_location_id && locationNames[posting.origin_location_id] && (
                <p>Location: <span className="text-slate-200">{locationNames[posting.origin_location_id]}</span></p>
              )}
              {postedBy && <p>Posted by: <span className="text-slate-200">{postedBy}</span></p>}
            </div>
          )}

          {/* Player-created attribution */}
          {createdBy && (
            <p className="text-sm text-teal-400">Party goal — added by {createdBy}</p>
          )}

          {/* Description */}
          {posting.description && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Details</p>
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{posting.description}</p>
            </div>
          )}

          {/* Resolution notes (archive) */}
          {posting.resolution_notes && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Resolution</p>
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{posting.resolution_notes}</p>
            </div>
          )}

          {/* Party notes scratchpad */}
          {!isArchived && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Party Notes</p>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                onBlur={saveNotes}
                rows={4}
                placeholder="Shared party scratchpad…"
                className="block w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none resize-none"
              />
              {isPending && <p className="text-xs text-slate-500 mt-1">Saving…</p>}
            </div>
          )}

          {/* GM notes — only shown to GM */}
          {mode === 'gm' && posting.gm_notes && (
            <div className="bg-amber-950/30 border border-amber-800/40 rounded-lg p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-1">GM Notes</p>
              <p className="text-sm text-amber-200/80 whitespace-pre-wrap">{posting.gm_notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-700">
            {/* Claim button (Available → Active) */}
            {posting.status === 'open' && (
              <button
                onClick={() => { startTransition(async () => { await claimPosting(posting.id); onStatusChange(posting.id, 'active') }) }}
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Move to Active
              </button>
            )}

            {/* GM: status controls */}
            {mode === 'gm' && posting.status === 'active' && (
              <>
                {ARCHIVE_STATUSES.map(s => (
                  <button key={s} onClick={() => { startTransition(async () => { await setPostingStatus(posting.id, s); onStatusChange(posting.id, s) }) }}
                    className="rounded-md border border-slate-600 bg-slate-800 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700 capitalize"
                  >{s}</button>
                ))}
              </>
            )}
            {mode === 'gm' && (
              <>
                <button
                  onClick={() => startTransition(async () => { await togglePostingVisible(posting.id, !posting.visible) })}
                  className="rounded-md border border-slate-600 bg-slate-800 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700"
                >
                  {posting.visible ? 'Hide from players' : 'Show to players'}
                </button>
                <a href={`/objectives/${posting.id}`} className="rounded-md border border-slate-600 bg-slate-800 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700">
                  Edit
                </a>
              </>
            )}

            {/* Publish hidden goal */}
            {posting.hidden_goal && (activePcId === posting.created_by_pc_id || mode === 'gm') && (
              <button
                onClick={() => startTransition(async () => { await publishHiddenGoal(posting.id) })}
                className="rounded-md border border-purple-700 bg-purple-950/40 px-3 py-1.5 text-sm text-purple-300 hover:bg-purple-900/40"
              >
                Make public
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
