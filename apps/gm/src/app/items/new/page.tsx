import { createItem } from '@/lib/actions/items'
import Link from 'next/link'

const input = 'block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none'
const label = 'block text-sm font-medium text-zinc-700 mb-1'

export default function NewItemPage() {
  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/items" className="text-sm text-zinc-500 hover:text-zinc-700">Items</Link>
        <span className="text-zinc-300">/</span>
        <span className="text-sm text-zinc-900 font-medium">New</span>
      </div>
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">New Item</h1>

      <form action={createItem} className="space-y-5">
        <div>
          <label className={label}>Name <span className="text-red-500">*</span></label>
          <input name="name" required className={input} autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Type</label>
            <input name="item_type" placeholder="weapon, armour, consumable…" className={input} />
          </div>
          <div>
            <label className={label}>Base Price</label>
            <input name="base_price" type="number" min="0" className={input} />
          </div>
        </div>
        <div>
          <label className={label}>Description</label>
          <textarea name="description" rows={4} className={`${input} resize-none`} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Create Item
          </button>
          <Link href="/items" className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
