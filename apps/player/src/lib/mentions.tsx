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
const BLEED_CHARS    = '#@!░▒▓?$&%'

function rndStr(len: number, chars: string): string {
  return Array.from(
    { length: Math.max(4, len) },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join('')
}

function hiddenMention(name: string, key: number): React.ReactNode {
  const len = name.length
  const pick = Math.floor(Math.random() * 4)

  switch (pick) {
    case 0:
      return (
        <span key={key} className="font-mono text-slate-500/70 select-none cursor-not-allowed tracking-tight" title="[Classified]" aria-label="[Classified]">
          {rndStr(len, GLITCH_BLOCK)}
        </span>
      )
    case 1:
      return (
        <span key={key} className="font-mono text-slate-400/50 select-none cursor-not-allowed tracking-tight" title="[Classified]" aria-label="[Classified]">
          {rndStr(len, GLITCH_ALPHA)}
        </span>
      )
    case 2:
      return (
        <span key={key} className="inline-flex items-center font-mono text-xs text-red-400/60 bg-red-950/25 border border-red-900/40 rounded px-1.5 py-0.5 select-none cursor-not-allowed mx-0.5" title="[Classified]" aria-label="[Classified]">
          REDACTED
        </span>
      )
    default:
      return (
        <span key={key} className="font-mono text-slate-500/60 select-none cursor-not-allowed tracking-widest" title="[Classified]" aria-label="[Classified]">
          {rndStr(Math.max(3, Math.floor(len * 0.7)), GLITCH_SYMBOLS)}
        </span>
      )
  }
}

// Scramble `intensity` proportion (0–1) of the non-space chars in a word.
function scrambleWord(word: string, intensity: number): string {
  if (intensity <= 0) return word
  const chars = Array.from(word)
  const indices = chars.map((c, i) => /\S/.test(c) ? i : -1).filter(i => i >= 0)
  const count = Math.ceil(indices.length * intensity)
  // Shuffle and take first `count` indices to scramble
  const shuffled = indices.slice().sort(() => Math.random() - 0.5)
  for (let i = 0; i < count; i++) {
    chars[shuffled[i]] = BLEED_CHARS[Math.floor(Math.random() * BLEED_CHARS.length)]
  }
  return chars.join('')
}

// Intensity contributed by a single hidden tag at a given word-distance.
function distIntensity(dist: number): number {
  if (dist === 1) return 0.75 + Math.random() * 0.25   // 75–100 %
  if (dist === 2) return 0.50 + Math.random() * 0.25   // 50–75 %
  if (dist === 3) return 0.25 + Math.random() * 0.25   // 25–50 %
  if (dist === 4) return       Math.random() * 0.25    //  0–25 %
  return 0
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
 * visibleIds — confirmed-visible entity IDs (from buildVisibleMentionSet).
 *              Omit to treat all mentions as visible.
 *
 * Hidden mentions are fully scrambled. Surrounding words receive a gradient
 * corruption that fades with distance (additive when multiple hidden tags are
 * nearby, capped at 100 %):
 *   distance 1 → 75–100 %    distance 2 → 50–75 %
 *   distance 3 → 25–50 %     distance 4 →  0–25 %
 */
export function renderMentions(
  text: string | null | undefined,
  visibleIds?: Set<string> | null,
): React.ReactNode {
  if (!text) return null

  // ── Pass 1: parse mention tokens ──────────────────────────────────────────
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

  // Fast path: nothing hidden — render as plain text / links
  if (!parts.some(p => p.k === 'hidden')) {
    return <>{parts.map(p => p.k === 'text' ? p.str : (p as VisiblePart).node)}</>
  }

  // ── Pass 2: flatten into positional tokens ────────────────────────────────
  // Each word and each hidden tag gets a sequential `pos` index.
  // Spaces and visible mentions don't consume a position (don't affect distance).
  type FlatWord    = { kind: 'word';    text: string; pos: number }
  type FlatSpace   = { kind: 'space';   text: string }
  type FlatHidden  = { kind: 'hidden';  name: string; key: number; pos: number }
  type FlatVisible = { kind: 'visible'; node: React.ReactNode }
  type Flat = FlatWord | FlatSpace | FlatHidden | FlatVisible

  const flat: Flat[] = []
  let pos = 0

  for (const part of parts) {
    if (part.k === 'text') {
      const chunks = part.str.split(/(\s+)/)
      for (const chunk of chunks) {
        if (!chunk) continue
        if (/^\s+$/.test(chunk)) flat.push({ kind: 'space', text: chunk })
        else                      flat.push({ kind: 'word', text: chunk, pos: pos++ })
      }
    } else if (part.k === 'hidden') {
      flat.push({ kind: 'hidden', name: part.name, key: part.key, pos: pos++ })
    } else {
      flat.push({ kind: 'visible', node: part.node })
    }
  }

  // Positions of all hidden tags
  const hiddenPositions = flat
    .filter((t): t is FlatHidden => t.kind === 'hidden')
    .map(t => t.pos)

  // ── Pass 3: render with per-word scramble gradient ────────────────────────
  let rk = 0

  const nodes: React.ReactNode[] = flat.map(token => {
    if (token.kind === 'space')   return token.text
    if (token.kind === 'visible') return token.node
    if (token.kind === 'hidden')  return hiddenMention(token.name, token.key)

    // Word: sum intensity contributions from every hidden tag, cap at 1
    const intensity = Math.min(
      1,
      hiddenPositions.reduce((sum, hp) => sum + distIntensity(Math.abs(token.pos - hp)), 0),
    )

    if (intensity <= 0) return token.text

    return (
      <span
        key={rk++}
        className="font-mono select-none"
        style={{ opacity: 0.35 + (1 - intensity) * 0.65 }}
        title={token.text}
      >
        {scrambleWord(token.text, intensity)}
      </span>
    )
  })

  return <>{nodes}</>
}
