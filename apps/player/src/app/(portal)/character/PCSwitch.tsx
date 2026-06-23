'use client'

import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'

interface PC { id: string; name: string }

export function PCSwitch({ pcs, currentId }: { pcs: PC[]; currentId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = pcs.find(c => c.id === currentId) ?? pcs[0]
  const others   = pcs.filter(c => c.id !== currentId)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (pcs.length <= 1) {
    return <h1 className="text-2xl font-bold text-slate-100">{current?.name}</h1>
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-2xl font-bold text-slate-100 hover:text-indigo-400 transition-colors group"
      >
        {current?.name}
        <svg className={`w-5 h-5 text-slate-500 group-hover:text-indigo-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 min-w-[12rem] bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
          {others.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setOpen(false)
                router.push(c.id === pcs[0].id ? '/' : `/?pc=${c.id}`)
              }}
              className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-slate-100 transition-colors"
            >
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
