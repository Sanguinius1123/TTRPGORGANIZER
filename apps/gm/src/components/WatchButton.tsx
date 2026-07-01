'use client'
import { useState, useTransition } from 'react'
import { toggleWatch } from '@/lib/actions/watches'

export function WatchButton({ pcId, entityType, entityId, initialWatching }: {
  pcId: string; entityType: string; entityId: string; initialWatching: boolean
}) {
  const [watching, setWatching] = useState(initialWatching)
  const [pending, startTransition] = useTransition()

  function handleClick() {
    const next = !watching
    setWatching(next)
    startTransition(() => toggleWatch(pcId, entityType, entityId, !next))
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      title={watching ? 'Remove from watchlist' : 'Add to watchlist'}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
        watching
          ? 'bg-indigo-900/50 border border-indigo-700 text-indigo-300 hover:bg-indigo-900/70'
          : 'bg-slate-700 border border-slate-600 text-slate-400 hover:text-slate-100 hover:bg-slate-600'
      }`}
    >
      <svg className="w-3.5 h-3.5" fill={watching ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
      {watching ? 'Watching' : 'Watch'}
    </button>
  )
}
