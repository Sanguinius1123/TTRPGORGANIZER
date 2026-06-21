import { db } from '@/lib/db'
import { Item } from '@ttrpg/db'
import { FilterBar } from '@/components/FilterBar'
import { ClickableRow, SubLink } from '@/components/TableRow'
import Link from 'next/link'
import { Suspense } from 'react'

type SearchParams = Promise<{ item_type?: string }>

export default async function ItemsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const supabase = db()

  let q = supabase.from('items').select('*').order('name')
  if (params.item_type) q = q.ilike('item_type', `%${params.item_type}%`)

  const { data: rawItems } = await q
  const items = (rawItems ?? []) as Item[]

  const filters = [
    { type: 'text' as const, name: 'item_type', label: 'Type', placeholder: 'weapon, armour…' },
  ]

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

      <Suspense fallback={null}>
        <FilterBar filters={filters} />
      </Suspense>

      {!items.length ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center">
          <p className="text-zinc-500 text-sm">No items match the current filters.</p>
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
                <ClickableRow key={item.id} href={`/items/${item.id}`} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <SubLink href={`/items/${item.id}`} className="font-medium text-zinc-900 hover:text-indigo-600">
                      {item.name}
                    </SubLink>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{item.item_type ?? '—'}</td>
                  <td className="px-4 py-3 text-zinc-500">
                    {item.base_price != null ? item.base_price : '—'}
                  </td>
                </ClickableRow>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
