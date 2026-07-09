'use client'

import { useState, useEffect } from 'react'

const input = 'block w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none'
const label = 'block text-sm font-medium text-slate-300 mb-1'
const textarea = 'block w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none resize-none'

export const ITEM_CATEGORIES = [
  'weapon',
  'armour',
  'consumable',
  'tool',
  'valuables',
  'relic',
  'document',
  'vehicle',
  'misc',
] as const

export type ItemCategory = typeof ITEM_CATEGORIES[number]

export const CATEGORY_LABELS: Record<ItemCategory, string> = {
  weapon:     'Weapon',
  armour:     'Armour',
  consumable: 'Consumable',
  tool:       'Tool',
  valuables:  'Valuables',
  relic:      'Relic',
  document:   'Document',
  vehicle:    'Vehicle',
  misc:       'Misc',
}

interface ItemCategorySectionProps {
  initialCategory?: string | null
  initialDescriptor?: string | null
  initialProperties?: Record<string, unknown>
}

export type FieldDef =
  | { key: string; label: string; type: 'text'; placeholder: string }
  | { key: string; label: string; type: 'select'; options: string[] }
  | { key: string; label: string; type: 'textarea'; rows: number; placeholder: string }

export const CATEGORY_FIELDS: Record<ItemCategory, FieldDef[]> = {
  weapon: [
    { key: 'damage',          label: 'Damage',          type: 'text',   placeholder: '2d6, 1d8+2, 5' },
    { key: 'damage_type',     label: 'Damage Type',     type: 'text',   placeholder: 'Piercing, Slashing, Energy, Explosive' },
    { key: 'attack_modifier', label: 'Attack Modifier', type: 'text',   placeholder: '+2, Advantage, —' },
    { key: 'range',           label: 'Range',           type: 'text',   placeholder: 'Melee, 30 ft / 120 ft, Close' },
    { key: 'hands',           label: 'Hands Required',  type: 'select', options: ['—', 'One-handed', 'Two-handed', 'Versatile'] },
  ],
  armour: [
    { key: 'armor_value',     label: 'Armor Value',     type: 'text',   placeholder: '14 + DEX, +2 AC, 3' },
    { key: 'armor_type',      label: 'Armor Type',      type: 'select', options: ['Light', 'Medium', 'Heavy', 'Shield', 'Other'] },
    { key: 'encumbrance',     label: 'Encumbrance',     type: 'text',   placeholder: 'Heavy, STR 15 required, —' },
    { key: 'stealth_penalty', label: 'Stealth Penalty', type: 'text',   placeholder: 'Disadvantage, -2, None' },
  ],
  consumable: [
    { key: 'effect',   label: 'Effect',        type: 'textarea', rows: 3, placeholder: 'What does it do?' },
    { key: 'charges',  label: 'Charges / Uses', type: 'text',    placeholder: '1 use, 3 charges' },
    { key: 'duration', label: 'Duration',       type: 'text',    placeholder: 'Instantaneous, 1 hour, Permanent' },
  ],
  tool: [
    { key: 'tool_type', label: 'Tool Type',        type: 'text',    placeholder: "Thieves' tools, Medical kit, Navigation" },
    { key: 'skill',     label: 'Associated Skill', type: 'text',    placeholder: 'Medicine, Engineering, Sleight of Hand' },
    { key: 'notes',     label: 'Notes',            type: 'textarea', rows: 2, placeholder: 'What it unlocks or grants' },
  ],
  valuables: [
    { key: 'valuable_type', label: 'Type',    type: 'select', options: ['Coin', 'Gemstone', 'Art Object', 'Jewelry', 'Material', 'Other'] },
    { key: 'quality',       label: 'Quality', type: 'text',   placeholder: 'Flawless, Fine, Flawed, Common' },
    { key: 'origin',        label: 'Origin',  type: 'text',   placeholder: 'Imperial mint, Elven craftsmanship' },
  ],
  relic: [
    { key: 'power_level', label: 'Power Level',     type: 'select',  options: ['Minor', 'Major', 'Legendary'] },
    { key: 'effect',      label: 'Powers / Effects', type: 'textarea', rows: 3, placeholder: '' },
    { key: 'attunement',  label: 'Attunement',      type: 'text',    placeholder: 'Requires attunement, Wizard only, None' },
    { key: 'origin',      label: 'Origin / Lore',   type: 'textarea', rows: 2, placeholder: '' },
  ],
  document: [
    { key: 'document_type', label: 'Document Type',    type: 'select',  options: ['Map', 'Letter', 'Contract', 'Codex', 'Deed', 'Cipher', 'Blueprint', 'Report', 'Other'] },
    { key: 'language',      label: 'Language',         type: 'text',    placeholder: 'Common, Ancient Elvish, Binary, —' },
    { key: 'condition',     label: 'Condition',        type: 'text',    placeholder: 'Pristine, Worn, Damaged, Partial' },
    { key: 'contents',      label: 'Contents Summary', type: 'textarea', rows: 3, placeholder: '' },
  ],
  vehicle: [
    { key: 'vehicle_type', label: 'Travel Medium', type: 'select', options: ['Ground', 'Air', 'Space', 'Water', 'Submersible', 'Subterranean', 'Multi-environment'] },
    { key: 'propulsion',   label: 'Propulsion',    type: 'text',   placeholder: 'Wheels, Hover, Jet, Sail, Burrowing, Wings' },
    { key: 'speed',        label: 'Speed',         type: 'text',   placeholder: '60 mph, Warp 2, 30 ft/round' },
    { key: 'capacity',     label: 'Capacity',      type: 'text',   placeholder: '2 crew + 4 passengers, 50 tons cargo' },
    { key: 'range',        label: 'Range',         type: 'text',   placeholder: '500 miles, Unlimited atmosphere, Interplanetary' },
    { key: 'condition',    label: 'Condition',     type: 'text',   placeholder: 'Operational, Damaged, Wrecked' },
  ],
  misc: [
    { key: 'notes', label: 'Notes', type: 'textarea', rows: 3, placeholder: '' },
  ],
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
