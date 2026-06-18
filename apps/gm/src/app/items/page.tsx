import { db } from '@/lib/db'
import { Item } from '@ttrpg/db'
import Link from 'next/link'

export default async function ItemsPage() {
  const supabase = db()
  const { data: rawItems } = await supabase.from('items').select('*').order('name')
  const items = (rawItems ?? []) as Item[]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Items</h1>
          <p className="text-sm text-zinc-500 mt-1">{items.length} entries</p>
        </div>
        <Link href="/items/new" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          New Item
        </Link>
      </div>

      {!items.length ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center">
          <p className="text-zinc-500 text-sm">No items yet.</p>
          <Link href="/items/new" className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700">
            Create the first one →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Base Price</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <Link href={`/items/${item.id}`} className="font-medium text-zinc-900 hover:text-indigo-600">
                      {item.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{item.item_type ?? '—'}</td>
                  <td className="px-4 py-3 text-zinc-500">
                    {item.base_price != null ? item.base_price : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
