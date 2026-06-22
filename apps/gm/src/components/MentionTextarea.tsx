'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Suggestion { type: string; id: string; name: string }

const CHIP_BG: Record<string, string> = {
  location:      'bg-blue-100 text-blue-700',
  npc:           'bg-purple-100 text-purple-700',
  faction:       'bg-orange-100 text-orange-700',
  item:          'bg-green-900/40 text-green-400',
  session:       'bg-teal-100 text-teal-700',
  lore:          'bg-amber-100 text-amber-700',
  'plot-thread': 'bg-red-900/30 text-red-400',
  pc:            'bg-indigo-100 text-indigo-700',
  species:       'bg-rose-100 text-rose-700',
  culture:       'bg-cyan-100 text-cyan-700',
}

const TYPE_LABEL: Record<string, string> = {
  location:      'Location',
  npc:           'NPC',
  faction:       'Faction',
  item:          'Item',
  session:       'Session',
  lore:          'Lore',
  'plot-thread': 'Thread',
  pc:            'PC',
  species:       'Species',
  culture:       'Culture',
}

const TYPE_COLOR: Record<string, string> = {
  location:      'text-blue-600',
  npc:           'text-purple-600',
  faction:       'text-orange-600',
  item:          'text-green-600',
  session:       'text-teal-600',
  lore:          'text-amber-600',
  'plot-thread': 'text-red-600',
  pc:            'text-indigo-400',
  species:       'text-rose-600',
  culture:       'text-cyan-600',
}

const MENTION_ROUTES: Record<string, string> = {
  location:      '/locations',
  npc:           '/npcs',
  faction:       '/factions',
  pc:            '/player-characters',
  item:          '/items',
  lore:          '/lore',
  'plot-thread': '/plot-threads',
  session:       '/sessions',
  species:       '/species',
  culture:       '/cultures',
}

function mentionHref(type: string, id: string): string | null {
  const base = MENTION_ROUTES[type]
  return base ? `${base}/${id}` : null
}

function escHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const CHIP_CLASS = 'inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium mx-0.5 cursor-pointer select-none'

// Convert stored [[type:id|Name]] text into HTML with inline chip spans
function valueToHtml(text: string): string {
  return text
    .split(/(\[\[[^\]]+\]\])/g)
    .map(part => {
      const m = part.match(/^\[\[([^:]+):([^|]+)\|([^\]]+)\]\]$/)
      if (m) {
        const [, type, , name] = m
        const bg = CHIP_BG[type] ?? 'bg-slate-700 text-slate-300'
        return `<span contenteditable="false" data-mention="${part.replace(/"/g, '&quot;')}" class="${CHIP_CLASS} ${bg}">${escHtml(name)}</span>`
      }
      return part.split('\n').map(escHtml).join('<br>')
    })
    .join('')
}

// Walk the contentEditable DOM and serialize back to [[type:id|Name]] format
function htmlToValue(el: HTMLElement): string {
  let out = ''
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      out += node.textContent ?? ''
    } else if (node instanceof HTMLElement) {
      if (node.dataset.mention) {
        out += node.dataset.mention
      } else if (node.tagName === 'BR') {
        out += '\n'
      } else if (node.tagName === 'DIV' || node.tagName === 'P') {
        out += '\n' + htmlToValue(node)
      } else {
        out += htmlToValue(node)
      }
    }
  }
  return out
}

// Guarantee a text node exists at the very end of the editor so the cursor
// can always be placed after a trailing chip.
function ensureTrailingText(el: HTMLElement) {
  if (!el.lastChild || el.lastChild.nodeType !== Node.TEXT_NODE) {
    el.appendChild(document.createTextNode(''))
  }
}

// Returns the @query string before the cursor, or null if not in a mention context
function getAtQuery(editor: HTMLElement): string | null {
  const sel = window.getSelection()
  if (!sel?.rangeCount || !sel.isCollapsed) return null
  const { startContainer, startOffset } = sel.getRangeAt(0)
  if (startContainer.nodeType !== Node.TEXT_NODE) return null
  if (!editor.contains(startContainer)) return null
  const before = (startContainer.textContent ?? '').slice(0, startOffset)
  const atIdx = before.lastIndexOf('@')
  if (atIdx === -1) return null
  const query = before.slice(atIdx + 1)
  if (/[\s\n]/.test(query)) return null
  return query
}

interface Props {
  name: string
  defaultValue?: string | null
  rows?: number
  className?: string
  placeholder?: string
  required?: boolean
}

export default function MentionTextarea({
  name, defaultValue = '', rows = 4, className = '', placeholder,
}: Props) {
  const router    = useRouter()
  const editorRef = useRef<HTMLDivElement>(null)
  const rootRef   = useRef<HTMLDivElement>(null)
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [hiddenValue, setHiddenValue] = useState(defaultValue ?? '')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [activeIdx,   setActiveIdx]   = useState(0)
  const [dropPos, setDropPos] = useState<{ top: number; left: number } | null>(null)

  // Set initial HTML once on mount, then ensure trailing text node
  useEffect(() => {
    const el = editorRef.current
    if (!el) return
    if (defaultValue) el.innerHTML = valueToHtml(defaultValue)
    ensureTrailingText(el)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const sync = useCallback(() => {
    if (editorRef.current) setHiddenValue(htmlToValue(editorRef.current))
  }, [])

  const close = useCallback(() => {
    setSuggestions([])
    setDropPos(null)
    setActiveIdx(0)
  }, [])

  // Insert a chip for the selected suggestion, replacing the @query text
  const pick = useCallback((s: Suggestion) => {
    const editor = editorRef.current
    if (!editor) return
    const sel = window.getSelection()
    if (!sel?.rangeCount) return
    const range = sel.getRangeAt(0)
    if (range.startContainer.nodeType !== Node.TEXT_NODE) return

    const text   = range.startContainer.textContent ?? ''
    const offset = range.startOffset
    const atIdx  = text.slice(0, offset).lastIndexOf('@')
    if (atIdx === -1) return

    // Delete @query text
    const del = document.createRange()
    del.setStart(range.startContainer, atIdx)
    del.setEnd(range.startContainer, offset)
    del.deleteContents()

    // Build chip span
    const chip = document.createElement('span')
    chip.contentEditable = 'false'
    chip.dataset.mention = `[[${s.type}:${s.id}|${s.name}]]`
    chip.className = `${CHIP_CLASS} ${CHIP_BG[s.type] ?? 'bg-slate-700 text-slate-300'}`
    chip.textContent = s.name

    // Insert at the collapsed deletion point (splits the text node)
    del.insertNode(chip)

    // Ensure there's a plain empty text node after the chip for cursor anchoring
    let nextText: Text
    if (chip.nextSibling?.nodeType === Node.TEXT_NODE) {
      nextText = chip.nextSibling as Text
    } else {
      nextText = document.createTextNode('')
      chip.parentNode!.insertBefore(nextText, chip.nextSibling)
    }

    // Place cursor at the start of the text node right after the chip
    const cur = document.createRange()
    cur.setStart(nextText, 0)
    cur.collapse(true)
    sel.removeAllRanges()
    sel.addRange(cur)

    sync()
    close()
    editor.focus()
  }, [sync, close])

  const doFetch = useCallback((query: string) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (query.length < 1) { close(); return }
    timerRef.current = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/mention-search?q=${encodeURIComponent(query)}`)
        const data: Suggestion[] = await res.json()
        if (data.length) {
          setSuggestions(data)
          setActiveIdx(0)
          const sel = window.getSelection()
          if (sel?.rangeCount && editorRef.current) {
            const rect  = sel.getRangeAt(0).getBoundingClientRect()
            const eRect = editorRef.current.getBoundingClientRect()
            setDropPos({ top: rect.bottom - eRect.top + 4, left: Math.max(0, rect.left - eRect.left) })
          }
        } else {
          close()
        }
      } catch { close() }
    }, 120)
  }, [close])

  const onInput = useCallback(() => {
    sync()
    const q = editorRef.current ? getAtQuery(editorRef.current) : null
    if (q !== null) doFetch(q)
    else close()
  }, [sync, doFetch, close])

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (suggestions.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)); return }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); return }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); pick(suggestions[activeIdx]); return }
      if (e.key === 'Escape') { close(); return }
    }

    // Intercept Enter to insert <br> instead of letting the browser create <div> wrappers
    if (e.key === 'Enter') {
      e.preventDefault()
      const sel = window.getSelection()
      if (!sel?.rangeCount) return
      const r = sel.getRangeAt(0)
      r.deleteContents()
      const br = document.createElement('br')
      r.insertNode(br)
      if (!br.nextSibling) br.parentNode!.appendChild(document.createElement('br'))
      r.setStartAfter(br)
      r.collapse(true)
      sel.removeAllRanges()
      sel.addRange(r)
      sync()
      return
    }

    // Backspace: remove chip immediately to the left of the cursor
    if (e.key === 'Backspace') {
      const sel = window.getSelection()
      if (!sel?.rangeCount || !sel.isCollapsed) return
      const r = sel.getRangeAt(0)
      let chip: HTMLElement | null = null

      if (r.startContainer.nodeType === Node.TEXT_NODE) {
        // Cursor at offset 0 of a text node → check the previous sibling
        if (r.startOffset === 0) {
          chip = r.startContainer.previousSibling as HTMLElement | null
        }
      } else {
        // Cursor is positioned inside the editor element itself (child index)
        chip = (r.startContainer as HTMLElement).childNodes[r.startOffset - 1] as HTMLElement | null
      }

      if (chip?.dataset?.mention) {
        e.preventDefault()
        chip.remove()
        sync()
      }
      return
    }

    // Delete: remove chip immediately to the right of the cursor
    if (e.key === 'Delete') {
      const sel = window.getSelection()
      if (!sel?.rangeCount || !sel.isCollapsed) return
      const r = sel.getRangeAt(0)
      let chip: HTMLElement | null = null

      if (r.startContainer.nodeType === Node.TEXT_NODE) {
        const text = r.startContainer.textContent ?? ''
        if (r.startOffset === text.length) {
          chip = r.startContainer.nextSibling as HTMLElement | null
        }
      } else {
        chip = (r.startContainer as HTMLElement).childNodes[r.startOffset] as HTMLElement | null
      }

      if (chip?.dataset?.mention) {
        e.preventDefault()
        chip.remove()
        sync()
      }
    }

    // ArrowRight: jump over a chip to the right in one keystroke
    if (e.key === 'ArrowRight' && !e.shiftKey) {
      const sel = window.getSelection()
      if (!sel?.rangeCount || !sel.isCollapsed) return
      const r = sel.getRangeAt(0)
      let chip: HTMLElement | null = null

      if (r.startContainer.nodeType === Node.TEXT_NODE) {
        if (r.startOffset === (r.startContainer.textContent ?? '').length) {
          const next = r.startContainer.nextSibling
          if (next instanceof HTMLElement && next.dataset.mention) chip = next
        }
      } else {
        const next = (r.startContainer as HTMLElement).childNodes[r.startOffset]
        if (next instanceof HTMLElement && next.dataset.mention) chip = next
      }

      if (chip) {
        e.preventDefault()
        const after = chip.nextSibling
        const cur = document.createRange()
        if (after?.nodeType === Node.TEXT_NODE) {
          cur.setStart(after, 0)
        } else {
          const parent = chip.parentNode!
          cur.setStart(parent, Array.from(parent.childNodes).indexOf(chip as ChildNode) + 1)
        }
        cur.collapse(true)
        sel.removeAllRanges()
        sel.addRange(cur)
      }
    }

    // ArrowLeft: jump over a chip to the left in one keystroke
    if (e.key === 'ArrowLeft' && !e.shiftKey) {
      const sel = window.getSelection()
      if (!sel?.rangeCount || !sel.isCollapsed) return
      const r = sel.getRangeAt(0)
      let chip: HTMLElement | null = null

      if (r.startContainer.nodeType === Node.TEXT_NODE) {
        if (r.startOffset === 0) {
          const prev = r.startContainer.previousSibling
          if (prev instanceof HTMLElement && prev.dataset.mention) chip = prev
        }
      } else {
        const prev = (r.startContainer as HTMLElement).childNodes[r.startOffset - 1]
        if (prev instanceof HTMLElement && prev.dataset.mention) chip = prev
      }

      if (chip) {
        e.preventDefault()
        const before = chip.previousSibling
        const cur = document.createRange()
        if (before?.nodeType === Node.TEXT_NODE) {
          cur.setStart(before, before.textContent?.length ?? 0)
        } else {
          const parent = chip.parentNode!
          cur.setStart(parent, Array.from(parent.childNodes).indexOf(chip as ChildNode))
        }
        cur.collapse(true)
        sel.removeAllRanges()
        sel.addRange(cur)
      }
    }
  }, [suggestions, activeIdx, pick, close, sync])

  // Paste as plain text, converting newlines into <br> elements
  const onPaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    const sel  = window.getSelection()
    if (!sel?.rangeCount) return
    const r = sel.getRangeAt(0)
    r.deleteContents()
    const frag = document.createDocumentFragment()
    text.split('\n').forEach((line, i) => {
      if (i > 0) frag.appendChild(document.createElement('br'))
      if (line)  frag.appendChild(document.createTextNode(line))
    })
    r.insertNode(frag)
    r.collapse(false)
    sel.removeAllRanges()
    sel.addRange(r)
    sync()
  }, [sync])

  // Click on a chip navigates to that entity's page
  const onClick = useCallback((e: React.MouseEvent) => {
    const chip = (e.target as HTMLElement).closest('[data-mention]') as HTMLElement | null
    if (!chip?.dataset.mention) return
    const m = chip.dataset.mention.match(/^\[\[([^:]+):([^|]+)\|/)
    if (!m) return
    const href = mentionHref(m[1], m[2])
    if (href) { e.preventDefault(); router.push(href) }
  }, [router])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [close])

  return (
    <div ref={rootRef} className="relative">
      <input type="hidden" name={name} value={hiddenValue} />
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={onInput}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        onClick={onClick}
        data-placeholder={placeholder}
        className={`${className} mention-editor`}
        style={{ minHeight: `${rows * 1.625}rem` }}
      />
      {suggestions.length > 0 && dropPos && (
        <ul
          className="absolute z-50 bg-slate-800 rounded-lg shadow-lg border border-slate-700 py-1 w-72 max-h-56 overflow-y-auto"
          style={{ top: dropPos.top, left: dropPos.left }}
          onMouseDown={e => e.preventDefault()}
        >
          {suggestions.map((s, i) => (
            <li key={`${s.type}-${s.id}`}>
              <button
                type="button"
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left ${i === activeIdx ? 'bg-indigo-900/40' : 'hover:bg-slate-700/50'}`}
                onMouseDown={e => { e.preventDefault(); pick(s) }}
              >
                <span className={`shrink-0 text-xs font-medium w-14 ${TYPE_COLOR[s.type] ?? 'text-slate-500'}`}>
                  {TYPE_LABEL[s.type] ?? s.type}
                </span>
                <span className="font-medium text-slate-100 truncate">{s.name}</span>
              </button>
            </li>
          ))}
          <li className="px-3 py-1.5 text-xs text-slate-500 border-t border-slate-700/50">
            ↑↓ navigate · Enter select · Esc close
          </li>
        </ul>
      )}
    </div>
  )
}
