'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'

export interface SelectFilter {
  type: 'select'
  name: string
  label: string
  options: Array<{ value: string; label: string }>
}

export interface TextFilter {
  type: 'text'
  name: string
  label: string
  placeholder?: string
}

export type FilterDef = SelectFilter | TextFilter

const cls = 'text-sm rounded-md border border-slate-600 px-2 py-1 text-slate-200 bg-slate-700 focus:outline-none focus:border-indigo-400'

export function FilterBar({ filters }: { filters: FilterDef[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const navigate = useCallback((name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(name, value)
    else params.delete(name)
    router.push(`${pathname}?${params.toString()}`)
  }, [router, pathname, searchParams])

  if (!filters.length) return null

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-slate-800 rounded-lg border border-slate-700">
      <span className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Filter</span>
      {filters.map((f) =>
        f.type === 'select' ? (
          <label key={f.name} className="flex items-center gap-1.5 text-xs text-slate-400">
            {f.label}
            <select
              value={searchParams.get(f.name) ?? ''}
              onChange={(e) => navigate(f.name, e.target.value)}
              className={cls}
            >
              <option value="">All</option>
              {f.options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
        ) : (
          <label key={f.name} className="flex items-center gap-1.5 text-xs text-slate-400">
            {f.label}
            <input
              type="text"
              spellCheck
              defaultValue={searchParams.get(f.name) ?? ''}
              placeholder={f.placeholder}
              className={`${cls} w-32`}
              onKeyDown={(e) => {
                if (e.key === 'Enter') navigate(f.name, (e.target as HTMLInputElement).value)
              }}
              onBlur={(e) => navigate(f.name, e.target.value)}
            />
          </label>
        )
      )}
      {Array.from(searchParams.keys()).length > 0 && (
        <button
          onClick={() => router.push(pathname)}
          className="text-xs text-slate-500 hover:text-slate-200 underline"
        >
          Clear
        </button>
      )}
    </div>
  )
}
