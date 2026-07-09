import { db } from '@/lib/db'
import { updateItem, deleteItem, toggleItemVisibility } from '@/lib/actions/items'
import { Item } from '@ttrpg/db'
import MentionTextarea from '@/components/MentionTextarea'
import ItemCategorySection from '@/components/ItemCategorySection'
import { CATEGORY_LABELS, CATEGORY_FIELDS, type ItemCategory, ITEM_CATEGORIES } from '@/lib/itemCategories'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getActiveCampaignId } from '@/lib/activeCampaign'
import { SubmitButton } from '@/components/SubmitButton'

const input = 'block w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none'
const label = 'block text-sm font-medium text-slate-300 mb-1'

const ITEM_TYPES = [
  'Weapon', 'Armour', 'Consumable', 'Tool', 'Currency', 'Relic', 'Document', 'Vehicle', 'Misc',
]

function isItemCategory(value: string | null): value is ItemCategory {
  return value != null && (ITEM_CATEGORIES as readonly string[]).includes(value)
}

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const campaignId = await getActiveCampaignId()
  const supabase = db()
  const [itemRes, locsRes] = await Promise.all([
    supabase.from('items').select('*').eq('id', id).single(),
    campaignId
      ? supabase.from('locations').select('id, name').eq('campaign_id', campaignId).order('name')
      : supabase.from('locations').select('id, name').order('name'),
  ])
  if (!itemRes.data) notFound()
  const item = itemRes.data as Item
  const locations = (locsRes.data ?? []) as Array<{ id: string; name: string | null }>

  const category = isItemCategory(item.category) ? item.category : null
  const props = (item.properties ?? {}) as Record<string, unknown>
  const categoryFields = category ? CATEGORY_FIELDS[category] : []
  const filledFields = categoryFields.filter(f => {
    const v = props[f.key]
    return v != null && v !== ''
  })

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/items" className="text-sm text-slate-400 hover:text-slate-300">Items</Link>
        <span className="text-slate-600">/</span>
        <span className="text-sm text-slate-100 font-medium">{item.name}</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{item.name}</h1>
          {item.descriptor && (
            <p className="text-sm text-slate-400 mt-1">{item.descriptor}</p>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {item.item_type && (
              <span className="rounded-full bg-slate-700 px-2.5 py-0.5 text-xs text-slate-300 border border-slate-600">
                {item.item_type}
              </span>
            )}
            {category && (
              <span className="rounded-full bg-indigo-900/40 px-2.5 py-0.5 text-xs text-indigo-300 border border-indigo-700">
                {CATEGORY_LABELS[category]}
              </span>
            )}
          </div>
        </div>
        <form action={async () => { 'use server'; await toggleItemVisibility(id, !item.visible) }}>
          <button type="submit" className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
            item.visible
              ? 'bg-green-900/40 text-green-400 border-green-700 hover:bg-green-900/60'
              : 'bg-slate-700 text-slate-400 border-slate-600 hover:bg-slate-600'
          }`}>
            {item.visible ? 'Visible to players' : 'Hidden from players'}
          </button>
        </form>
      </div>

      {category && filledFields.length > 0 && (
        <div className="rounded-lg border border-indigo-800/50 bg-indigo-950/30 p-4 mb-6 space-y-2">
          <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-3">
            {CATEGORY_LABELS[category]} Properties
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            {filledFields.map(f => (
              <div key={f.key} className={f.type === 'textarea' ? 'col-span-2' : 'col-span-1'}>
                <span className="text-xs text-slate-500">{f.label}</span>
                <p className="text-sm text-slate-200 whitespace-pre-wrap">{String(props[f.key] ?? '')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <form action={updateItem} className="bg-slate-800 rounded-lg border border-slate-700 p-6 space-y-5 mb-8">
        <input type="hidden" name="id" value={item.id} />
        <div>
          <label className={label}>Name</label>
          <input name="name" defaultValue={item.name} required className={input} spellCheck />
        </div>
        <div>
          <label className={label}>Description</label>
          <MentionTextarea name="description" defaultValue={item.description ?? ''} rows={4} className={`${input} resize-none`} />
        </div>

        <ItemCategorySection
          initialCategory={item.category}
          initialDescriptor={item.descriptor}
          initialProperties={props}
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Type</label>
            <select key={item.item_type ?? ''} name="item_type" defaultValue={item.item_type ?? ''} className={input}>
              <option value="">— None —</option>
              {ITEM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>Base Price</label>
            <input name="base_price" type="number" min="0" defaultValue={item.base_price ?? ''} className={input} />
          </div>
        </div>
        <div>
          <label className={label}>Current Location</label>
          <select key={item.location_id ?? ''} name="location_id" defaultValue={item.location_id ?? ''} className={input}>
            <option value="">— Unknown —</option>
            {locations.map(l => <option key={l.id} value={l.id}>{l.name ?? '(unnamed)'}</option>)}
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <SubmitButton label="Save Changes" />
        </div>
      </form>

      <div className="border-t border-slate-700 pt-6">
        <form action={deleteItem}>
          <input type="hidden" name="id" value={item.id} />
          <button type="submit" className="rounded-md bg-red-900/30 border border-red-700 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-900/50">
            Delete Item
          </button>
        </form>
      </div>
    </div>
  )
}
