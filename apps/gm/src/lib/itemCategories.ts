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
    { key: 'effect',   label: 'Effect',         type: 'textarea', rows: 3, placeholder: 'What does it do?' },
    { key: 'charges',  label: 'Charges / Uses', type: 'text',     placeholder: '1 use, 3 charges' },
    { key: 'duration', label: 'Duration',       type: 'text',     placeholder: 'Instantaneous, 1 hour, Permanent' },
  ],
  tool: [
    { key: 'tool_type', label: 'Tool Type',        type: 'text',     placeholder: "Thieves' tools, Medical kit, Navigation" },
    { key: 'skill',     label: 'Associated Skill', type: 'text',     placeholder: 'Medicine, Engineering, Sleight of Hand' },
    { key: 'notes',     label: 'Notes',            type: 'textarea', rows: 2, placeholder: 'What it unlocks or grants' },
  ],
  valuables: [
    { key: 'valuable_type', label: 'Type',    type: 'select', options: ['Coin', 'Gemstone', 'Art Object', 'Jewelry', 'Material', 'Other'] },
    { key: 'quality',       label: 'Quality', type: 'text',   placeholder: 'Flawless, Fine, Flawed, Common' },
    { key: 'origin',        label: 'Origin',  type: 'text',   placeholder: 'Imperial mint, Elven craftsmanship' },
  ],
  relic: [
    { key: 'power_level', label: 'Power Level',      type: 'select',  options: ['Minor', 'Major', 'Legendary'] },
    { key: 'effect',      label: 'Powers / Effects', type: 'textarea', rows: 3, placeholder: '' },
    { key: 'attunement',  label: 'Attunement',       type: 'text',    placeholder: 'Requires attunement, Wizard only, None' },
    { key: 'origin',      label: 'Origin / Lore',    type: 'textarea', rows: 2, placeholder: '' },
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
