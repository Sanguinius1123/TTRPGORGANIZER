'use client'

import { useState, useEffect } from 'react'
import {
  ITEM_CATEGORIES, CATEGORY_LABELS, CATEGORY_FIELDS,
  type ItemCategory, type FieldDef,
} from '@/lib/itemCategories'

export type { ItemCategory, FieldDef }
export { ITEM_CATEGORIES, CATEGORY_LABELS, CATEGORY_FIELDS }

const input = 'block w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none'
const label = 'block text-sm font-medium text-slate-300 mb-1'
const textarea = 'block w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none resize-none'

interface ItemCategorySectionProps {
  initialCategory?: string | null
  initialDescriptor?: string | null
  initialProperties?: Record<string, unknown>
}

function isItemCategory(value: string): value is ItemCategory {
  return (ITEM_CATEGORIES as readonly string[]).includes(value)
}

export default function ItemCategorySection({
  initialCategory,
  initialDescriptor,
  initialProperties,
}: ItemCategorySectionProps) {
  const [category, setCategory] = useState<string>(initialCategory ?? '')
  const [descriptor, setDescriptor] = useState<string>(initialDescriptor ?? '')
  const [props, setProps] = useState<Record<string, string>>(() => {
    const p = initialProperties ?? {}
    return Object.fromEntries(Object.entries(p).map(([k, v]) => [k, String(v ?? '')]))
  })
  const [serialized, setSerialized] = useState<string>(() => JSON.stringify(initialProperties ?? {}))

  useEffect(() => {
    setSerialized(JSON.stringify(props))
  }, [props])

  function handlePropChange(key: string, value: string) {
    setProps(prev => ({ ...prev, [key]: value }))
  }

  function handleCategoryChange(next: string) {
    setCategory(next)
    setProps({})
  }

  const fields: FieldDef[] = category && isItemCategory(category) ? CATEGORY_FIELDS[category] : []

  return (
    <>
      <input type="hidden" name="properties" value={serialized} />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Category</label>
          <select
            name="category"
            value={category}
            onChange={e => handleCategoryChange(e.target.value)}
            className={input}
          >
            <option value="">— None —</option>
            {ITEM_CATEGORIES.map(c => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Descriptor</label>
          <input
            name="descriptor"
            value={descriptor}
            onChange={e => setDescriptor(e.target.value)}
            placeholder="Material, origin, enchantment…"
            className={input}
            spellCheck
          />
        </div>
      </div>

      {fields.length > 0 ? (
        <div className="rounded-lg border-l-2 border-indigo-600 bg-slate-800/60 p-4 space-y-4">
          <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            {CATEGORY_LABELS[category as ItemCategory]} Properties
          </p>
          <div className="grid grid-cols-2 gap-4">
            {fields.map(field => {
              const isWide = field.type === 'textarea'
              return (
                <div key={field.key} className={isWide ? 'col-span-2' : 'col-span-1'}>
                  <label className={label}>{field.label}</label>
                  {field.type === 'text' && (
                    <input
                      type="text"
                      value={props[field.key] ?? ''}
                      onChange={e => handlePropChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className={input}
                      spellCheck
                    />
                  )}
                  {field.type === 'select' && (
                    <select
                      value={props[field.key] ?? ''}
                      onChange={e => handlePropChange(field.key, e.target.value)}
                      className={input}
                    >
                      <option value="">— None —</option>
                      {field.options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}
                  {field.type === 'textarea' && (
                    <textarea
                      value={props[field.key] ?? ''}
                      onChange={e => handlePropChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      rows={field.rows}
                      className={textarea}
                      spellCheck
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ) : category === '' ? (
        <p className="text-xs text-slate-500">Select a category to see additional fields.</p>
      ) : null}
    </>
  )
}
