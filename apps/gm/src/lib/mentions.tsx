import Link from 'next/link'
import React from 'react'

export const MENTION_PATTERN = /\[\[([\w-]+):([a-f0-9-]+)\|([^\]]+)\]\]/g

/** Strip mention tokens to plain name text — for list-page previews where links aren't needed. */
export function stripMentions(text: string | null | undefined): string {
  if (!text) return ''
  return text.replace(/\[\[[\w-]+:[a-f0-9-]+\|([^\]]+)\]\]/g, '$1')
}

export function extractMentions(texts: (string | null | undefined)[]): Array<{ type: string; id: string }> {
  const out: Array<{ type: string; id: string }> = []
  const re = new RegExp(MENTION_PATTERN.source, 'g')
  for (const text of texts) {
    if (!text) continue
    let m: RegExpExecArray | null
    while ((m = re.exec(text)) !== null) out.push({ type: m[1], id: m[2] })
  }
  return out
}

const ROUTE: Record<string, string> = {
  location:     'locations',
  npc:          'npcs',
  faction:      'factions',
  item:         'items',
  session:      'sessions',
  lore:         'lore',
  'plot-thread':'plot-threads',
  pc:           'player-characters',
  species:      'species',
  culture:      'cultures',
}

const COLOR: Record<string, string> = {
  location:     'text-blue-600',
  npc:          'text-purple-600',
  faction:      'text-orange-600',
  item:         'text-green-600',
  session:      'text-slate-400',
  lore:         'text-amber-600',
  'plot-thread':'text-red-600',
  pc:           'text-indigo-400',
  species:      'text-teal-600',
  culture:      'text-cyan-600',
}

const PATTERN = /\[\[([\w-]+):([a-f0-9-]+)\|([^\]]+)\]\]/g

const PLAY_ROUTE: Record<string, string> = {
  location:     'locations',
  npc:          'npcs',
  faction:      'factions',
  lore:         'lore',
  'plot-thread':'plot-threads',
  pc:           'player-characters',
  species:      'species',
  culture:      'cultures',
  session:      'sessions',
}

// visibleIds is accepted for compatibility with player portal callers (ignored here — GM sees all)
export function renderMentions(text: string | null | undefined, visibleIds?: Set<string> | null): React.ReactNode {
  if (!text) return null

  const parts: React.ReactNode[] = []
  let last = 0
  let match: RegExpExecArray | null
  const re = new RegExp(PATTERN.source, 'g')

  while ((match = re.exec(text)) !== null) {
    const [full, type, id, name] = match

    if (match.index > last) parts.push(text.slice(last, match.index))

    const route = ROUTE[type]
    const color = COLOR[type] ?? 'text-indigo-400'

    parts.push(
      <Link
        key={match.index}
        href={route ? `/${route}/${id}` : '#'}
        className={`font-semibold ${color} hover:underline`}
      >
        {name}
      </Link>
    )

    last = match.index + full.length
  }

  if (last < text.length) parts.push(text.slice(last))

  return parts.length > 0 ? <>{parts}</> : text
}

/** Player portal variant — routes to /play/... and redacts hidden entities with █ blocks. */
export function renderMentionsPlayer(text: string | null | undefined, visibleIds?: Set<string> | null): React.ReactNode {
  if (!text) return null

  const parts: React.ReactNode[] = []
  let last = 0
  let match: RegExpExecArray | null
  const re = new RegExp(PATTERN.source, 'g')

  while ((match = re.exec(text)) !== null) {
    const [full, type, id, name] = match

    if (match.index > last) parts.push(text.slice(last, match.index))

    const route = PLAY_ROUTE[type]
    const color = COLOR[type] ?? 'text-indigo-400'
    const isVisible = !visibleIds || visibleIds.has(id)

    if (!isVisible || !route) {
      parts.push(
        <span key={match.index} className="font-mono text-slate-600 select-none" title="Unknown">
          {'█'.repeat(Math.min(name.length, 10))}
        </span>
      )
    } else {
      parts.push(
        <Link
          key={match.index}
          href={`/play/${route}/${id}`}
          className={`font-semibold ${color} hover:underline`}
        >
          {name}
        </Link>
      )
    }

    last = match.index + full.length
  }

  if (last < text.length) parts.push(text.slice(last))

  return parts.length > 0 ? <>{parts}</> : text
}
