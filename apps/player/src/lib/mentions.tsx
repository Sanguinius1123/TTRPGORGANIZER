import Link from 'next/link'
import React from 'react'

export const MENTION_PATTERN = /\[\[([\w-]+):([a-f0-9-]+)\|([^\]]+)\]\]/g

const ROUTE: Record<string, string | null> = {
  location:     'locations',
  npc:          'npcs',
  faction:      'factions',
  lore:         'lore',
  session:      'sessions',
  pc:           'player-characters',
  species:      'species',
  culture:      'cultures',
  item:         null,
  'plot-thread': null,
}

const COLOR: Record<string, string> = {
  location:     'text-blue-400',
  npc:          'text-purple-400',
  faction:      'text-orange-400',
  lore:         'text-amber-400',
  session:      'text-slate-300',
  pc:           'text-indigo-400',
  species:      'text-teal-400',
  culture:      'text-cyan-400',
}

// ── Glitch helpers ─────────────────────────────────────────────────────────────

const GLITCH_BLOCK   = '░░▒▒▓▓████▀▄■□'
const GLITCH_ALPHA   = '#@!?$%&0X9K3Z7!'
const GLITCH_SYMBOLS = '⌬⌖⍙⌛⌘⎈⌤⍜⌇'

// Shared scramble chars for bleeding into surrounding text
const BLEED_CHARS = '#@!░▒▓?$&%'

function rndStr(len: number, chars: string): string {
  return Array.from(
    { length: Math.max(4, len) },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join('')
}

// Scramble up to `n` non-space chars working inward from the end of a string
function scrambleTail(s: string, n: number): string {
  const arr = Array.from(s)
  let count = 0
  for (let i = arr.length - 1; i >= 0 && count < n; i--) {
    if (arr[i] !== ' ') {
      arr[i] = BLEED_CHARS[Math.floor(Math.random() * BLEED_CHARS.length)]
      count++
    }
  }
  return arr.join('')
}

// Scramble up to `n` non-space chars working inward from the start of a string
function scrambleHead(s: string, n: number): string {
  const arr = Array.from(s)
  let count = 0
  for (let i = 0; i < arr.length && count < n; i++) {
    if (arr[i] !== ' ') {
      arr[i] = BLEED_CHARS[Math.floor(Math.random() * BLEED_CHARS.length)]
      count++
    }
  }
  return arr.join('')
}

function hiddenMention(name: string, key: number): React.ReactNode {
  const len = name.length
  const pick = Math.floor(Math.random() * 4)

  switch (pick) {
    // Block-character noise  ░▒▓█
    case 0:
      return (
        <span
          key={key}
          className="font-mono text-slate-500/70 select-none cursor-not-allowed tracking-tight"
          title="[Classified]"
          aria-label="[Classified]"
        >
          {rndStr(len, GLITCH_BLOCK)}
        </span>
      )

    // Alphanumeric scramble  #@!?$0X9
    case 1:
      return (
        <span
          key={key}
          className="font-mono text-slate-400/50 select-none cursor-not-allowed tracking-tight"
          title="[Classified]"
          aria-label="[Classified]"
        >
          {rndStr(len, GLITCH_ALPHA)}
        </span>
      )

    // [REDACTED] badge
    case 2:
      return (
        <span
          key={key}
          className="inline-flex items-center font-mono text-xs text-red-400/60 bg-red-950/25 border border-red-900/40 rounded px-1.5 py-0.5 select-none cursor-not-allowed mx-0.5"
          title="[Classified]"
          aria-label="[Classified]"
        >
          REDACTED
        </span>
      )

    // Symbol noise  ⌬⌖⍙⌛⌘
    default:
      return (
        <span
          key={key}
          className="font-mono text-slate-500/60 select-none cursor-not-allowed tracking-widest"
          title="[Classified]"
          aria-label="[Classified]"
        >
          {rndStr(Math.max(3, Math.floor(len * 0.7)), GLITCH_SYMBOLS)}
        </span>
      )
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────

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

/**
 * Render text containing [[type:id|name]] mention tokens.
 *
 * visibleIds — confirmed-visible entity IDs (from RLS query via buildVisibleMentionSet).
 *              Omit to treat all mentions as visible.
 *
 * Hidden mentions render with a random glitch style. A few surrounding characters
 * on each side are also scrambled so the corruption "bleeds" into the sentence.
 */
export function renderMentions(
  text: string | null | undefined,
  visibleIds?: Set<string> | null,
): React.ReactNode {
  if (!text) return null

  // ── Pass 1: collect typed parts ────────────────────────────────────────────
  type TextPart    = { k: 'text';    str: string }
  type VisiblePart = { k: 'visible'; node: React.ReactNode }
  type HiddenPart  = { k: 'hidden';  name: string; key: number }
  type Part = TextPart | VisiblePart | HiddenPart

  const parts: Part[] = []
  let last = 0
  const re = new RegExp(MENTION_PATTERN.source, 'g')
  let match: RegExpExecArray | null

  while ((match = re.exec(text)) !== null) {
    const [full, type, id, name] = match
    if (match.index > last) parts.push({ k: 'text', str: text.slice(last, match.index) })

    const isVisible = !visibleIds || visibleIds.has(id)
    const route = ROUTE[type]
    const color = COLOR[type] ?? 'text-indigo-400'

    if (isVisible) {
      parts.push({ k: 'visible', node: route
        ? <Link key={match.index} href={`/${route}/${id}`} className={`font-medium ${color} hover:underline`}>{name}</Link>
        : <span key={match.index} className={`font-medium ${color}`}>{name}</span>
      })
    } else {
      parts.push({ k: 'hidden', name, key: match.index })
    }

    last = match.index + full.length
  }

  if (last < text.length) parts.push({ k: 'text', str: text.slice(last) })

  // ── Pass 2: bleed scramble into text on either side of hidden mentions ─────
  const BLEED = 3
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].k !== 'hidden') continue
    const prev = parts[i - 1]
    const next = parts[i + 1]
    if (prev?.k === 'text') (prev as TextPart).str = scrambleTail((prev as TextPart).str, BLEED)
    if (next?.k === 'text') (next as TextPart).str = scrambleHead((next as TextPart).str, BLEED)
  }

  // ── Pass 3: render ─────────────────────────────────────────────────────────
  const nodes: React.ReactNode[] = parts.map(p => {
    if (p.k === 'text')    return p.str
    if (p.k === 'visible') return p.node
    return hiddenMention(p.name, p.key)
  })

  return <>{nodes}</>
}
