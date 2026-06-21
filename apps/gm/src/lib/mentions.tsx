import Link from 'next/link'
import React from 'react'

const ROUTE: Record<string, string> = {
  location:     'locations',
  npc:          'npcs',
  faction:      'factions',
  item:         'items',
  session:      'sessions',
  lore:         'lore',
  'plot-thread':'plot-threads',
  pc:           'player-characters',
}

const COLOR: Record<string, string> = {
  location:     'text-blue-600',
  npc:          'text-purple-600',
  faction:      'text-orange-600',
  item:         'text-green-600',
  session:      'text-zinc-600',
  lore:         'text-amber-600',
  'plot-thread':'text-red-600',
  pc:           'text-indigo-600',
}

const PATTERN = /\[\[([\w-]+):([a-f0-9-]+)\|([^\]]+)\]\]/g

export function renderMentions(text: string | null | undefined): React.ReactNode {
  if (!text) return null

  const parts: React.ReactNode[] = []
  let last = 0
  let match: RegExpExecArray | null
  const re = new RegExp(PATTERN.source, 'g')

  while ((match = re.exec(text)) !== null) {
    const [full, type, id, name] = match

    if (match.index > last) parts.push(text.slice(last, match.index))

    const route = ROUTE[type]
    const color = COLOR[type] ?? 'text-indigo-600'

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
