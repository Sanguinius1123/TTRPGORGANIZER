import { db } from '@/lib/db'
import { updateItem, deleteItem } from '@/lib/actions/items'
import { Item } from '@ttrpg/db'
import MentionTextarea from '@/components/MentionTextarea'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const input = 'block w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none'
const label = 'block text-sm font-medium text-slate-300 mb-1'

const ITEM_TYPES = [
  'Weapon', 'Armour', 'Consumable', 'Tool', 'Currency', 'Relic', 'Document', 'Vehicle', 'Misc',
]

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = db()
  const [itemRes, locsRes] = await Promise.all([
    supabase.from('items').select('*').eq('id', id).single(),
    supabase.from('locations').select('id, name').order('name'),
  ])
  if (!itemRes.data) notFound()
  const item = itemRes.data as Item
  const locations = (locsRes.data ?? []) as Array<{ id: string; name: string | null }>

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/items" className="text-sm text-slate-400 hover:text-slate-300">Items</Link>
        <span className="text-slate-600">/</span>
        <span className="text-sm text-slate-100 font-medium">{item.name}</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-100 mb-6">{item.name}</h1>

      <form action={updateItem} className="bg-slate-800 rounded-lg border border-slate-700 p-6 space-y-5 mb-8">
        <input type="hidden" name="id" value={item.id} />
        <div>
          <label className={label}>Name</label>
          <input name="name" defaultValue={item.name} required className={input} spellCheck />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Type</label>
            <select key={item.item_type ?? ''} name="item_type" defaultValue={item.item_type ?? ''} className={input}>
              <option value="">— None —</option>
              {ITEM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>Descriptor</label>
            <input name="descriptor" defaultValue={item.descriptor ?? ''} placeholder="Material, origin, enchantment…" className={input} spellCheck />
          </div>
        </div>
        <div>
          <label className={label}>Base Price</label>
          <input name="base_price" type="number" min="0" defaultValue={item.base_price ?? ''} className={input} />
        </div>
        <div>
          <label className={label}>Current Location</label>
          <select key={item.location_id ?? ''} name="location_id" defaultValue={item.location_id ?? ''} className={input}>
            <option value="">— Unknown —</option>
            {locations.map(l => <option key={l.id} value={l.id}>{l.name ?? '(unnamed)'}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Description</label>
          <MentionTextarea name="description" defaultValue={item.description ?? ''} rows={4} className={`${input} resize-none`} />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Save Changes
          </button>
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
