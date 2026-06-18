import { db } from '@/lib/db'
import { updateItem, deleteItem } from '@/lib/actions/items'
import { Item } from '@ttrpg/db'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const input = 'block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none'
const label = 'block text-sm font-medium text-zinc-700 mb-1'

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = db()
  const { data: raw } = await supabase.from('items').select('*').eq('id', id).single()
  if (!raw) notFound()
  const item = raw as Item

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/items" className="text-sm text-zinc-500 hover:text-zinc-700">Items</Link>
        <span className="text-zinc-300">/</span>
        <span className="text-sm text-zinc-900 font-medium">{item.name}</span>
      </div>
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">{item.name}</h1>

      <form action={updateItem} className="bg-white rounded-lg border border-zinc-200 p-6 space-y-5 mb-8">
        <input type="hidden" name="id" value={item.id} />
        <div>
          <label className={label}>Name</label>
          <input name="name" defaultValue={item.name} required className={input} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Type</label>
            <input name="item_type" defaultValue={item.item_type ?? ''} placeholder="weapon, armour, consumable…" className={input} />
          </div>
          <div>
            <label className={label}>Base Price</label>
            <input name="base_price" type="number" min="0" defaultValue={item.base_price ?? ''} className={input} />
          </div>
        </div>
        <div>
          <label className={label}>Description</label>
          <textarea name="description" defaultValue={item.description ?? ''} rows={4} className={`${input} resize-none`} />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Save Changes
          </button>
        </div>
      </form>

      <div className="border-t border-zinc-200 pt-6">
        <form action={deleteItem}>
          <input type="hidden" name="id" value={item.id} />
          <button type="submit" className="rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100">
            Delete Item
          </button>
        </form>
      </div>
    </div>
  )
}
