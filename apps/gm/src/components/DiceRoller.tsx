'use client'

import { useState, useEffect, useTransition } from 'react'
import { rollDiceGm, rollDicePlayer, getRecentRolls, getRecentRollsPlayer } from '@/lib/actions/diceRolls'
import type { DiceRoll } from '@ttrpg/db'

interface DiceRollerProps {
  mode: 'gm' | 'player'
  campaignId: string | null
  pcId?: string
  pcName?: string
}

function formatResult(roll: DiceRoll): string {
  const rollsStr = roll.individual_rolls.join(', ')
  return `🎲 ${roll.dice_notation} = ${roll.total} [${rollsStr}]`
}

export function DiceRoller({ mode, campaignId, pcId, pcName }: DiceRollerProps) {
  const [minimized, setMinimized] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [notation, setNotation] = useState('')
  const [description, setDescription] = useState('')
  const [secret, setSecret] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<DiceRoll | null>(null)
  const [recentRolls, setRecentRolls] = useState<DiceRoll[]>([])
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('dice-roller-minimized')
    if (saved !== null) {
      setMinimized(saved === 'true')
    } else {
      setMinimized(false)
    }

    if (campaignId) {
      const fetchRolls = mode === 'gm' ? getRecentRolls : getRecentRollsPlayer
      fetchRolls(campaignId).then(rolls => setRecentRolls(rolls))
    }
  }, [campaignId, mode])

  const toggleMinimized = () => {
    const next = !minimized
    setMinimized(next)
    localStorage.setItem('dice-roller-minimized', String(next))
  }

  const handleRoll = () => {
    if (!notation.trim() || !campaignId) return
    setError(null)

    const formData = new FormData()
    formData.set('notation', notation)
    formData.set('description', description)

    startTransition(async () => {
      const result =
        mode === 'gm'
          ? await rollDiceGm(formData, secret)
          : await rollDicePlayer(formData, pcId ?? '', pcName ?? 'Player', secret)

      if (result.error) {
        setError(result.error)
      } else if (result.roll) {
        const roll = result.roll
        setLastResult(roll)
        // Hidden rolls only appear in local state for the roller that made them;
        // non-hidden rolls are shown in the shared log.
        if (!roll.hidden) {
          setRecentRolls(prev => [roll, ...prev].slice(0, 20))
        }
        setNotation('')
        setDescription('')
        setSecret(false)
      }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleRoll()
  }

  if (!mounted) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {minimized ? (
        <button
          onClick={toggleMinimized}
          className="w-10 h-10 rounded-full bg-slate-800 border border-slate-600 hover:bg-slate-700 flex items-center justify-center text-xl cursor-pointer"
          title="Open Dice Roller"
        >
          🎲
        </button>
      ) : (
        <div className="w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <span className="text-sm font-semibold text-slate-200">Dice Roller</span>
            <button
              onClick={toggleMinimized}
              className="text-slate-400 hover:text-slate-200 text-lg leading-none"
            >
              ×
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-3">
            {/* Notation input */}
            <input
              type="text"
              value={notation}
              onChange={e => setNotation(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="2d6, 1d20+5, d8…"
              className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-400"
              disabled={isPending}
            />

            {/* Description input */}
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What's this roll for? (optional)"
              className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-400"
              disabled={isPending}
            />

            {/* Secret / Private toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={secret}
                onChange={e => setSecret(e.target.checked)}
                disabled={isPending}
                className="w-3.5 h-3.5 accent-indigo-500"
              />
              <span className="text-xs text-slate-400">
                {mode === 'gm' ? '🔒 Secret roll (hidden from players)' : '🔒 Private roll (GM only)'}
              </span>
            </label>

            {/* Roll button */}
            <button
              onClick={handleRoll}
              disabled={isPending || !notation.trim() || !campaignId}
              className="w-full py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {isPending ? 'Rolling…' : 'Roll'}
            </button>

            {/* Error */}
            {error && (
              <p className="text-xs text-red-400">{error}</p>
            )}

            {/* Last result */}
            {lastResult && (
              <div className={`px-3 py-2 rounded-lg ${lastResult.hidden ? 'bg-slate-800 border border-amber-800/50' : 'bg-slate-800'}`}>
                <p className="text-base font-semibold text-indigo-300">
                  {formatResult(lastResult)}
                  {lastResult.hidden && <span className="ml-2 text-xs text-amber-500">🔒 hidden</span>}
                </p>
                {lastResult.description && (
                  <p className="text-xs text-slate-400 mt-0.5">{lastResult.description}</p>
                )}
              </div>
            )}

            {/* Recent rolls */}
            {recentRolls.length > 0 && (
              <>
                <div className="border-t border-slate-700" />
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {recentRolls.slice(0, 8).map(roll => (
                    <div key={roll.id} className="flex flex-wrap items-baseline gap-x-2 text-xs text-slate-400">
                      <span className="font-medium text-slate-300">{roll.rolled_by_name}</span>
                      {/* GM sees 🔒 on hidden rolls */}
                      {(roll as DiceRoll & { hidden?: boolean }).hidden && (
                        <span className="text-amber-500">🔒</span>
                      )}
                      <span>{roll.dice_notation} = {roll.total}</span>
                      {roll.description && (
                        <span className="text-slate-500 truncate max-w-full">· {roll.description}</span>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
