'use client'
import { useState } from 'react'

interface Option { value: string; label: string }

export function FilterableSelect({ name, options, placeholder = 'Search…', emptyLabel = '— select —' }: {
  name: string
  options: Option[]
  placeholder?: string
  emptyLabel?: string
}) {
  const [query, setQuery] = useState('')
  const filtered = query.trim()
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options

  return (
    <div className="space-y-1">
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md bg-slate-700 border border-slate-600 px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-400"
      />
      <select
        name={name}
        className="w-full rounded-md bg-slate-700 border border-slate-600 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-400"
      >
        <option value="">{emptyLabel}</option>
        {filtered.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}
