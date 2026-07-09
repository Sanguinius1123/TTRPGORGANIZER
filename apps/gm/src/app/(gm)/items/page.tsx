import { db } from '@/lib/db'
import { Item } from '@ttrpg/db'
import { FilterBar } from '@/components/FilterBar'
import { ClickableRow, SubLink } from '@/components/TableRow'
import { CATEGORY_LABELS, ITEM_CATEGORIES, type ItemCategory } from '@/lib/itemCategories'
import Link from 'next/link'
import { Suspense } from 'react'
import { getActiveCampaignId } from '@/lib/activeCampaign'
import { redirect } from 'next/navigation'

function isItemCategory(value: string | null): value is ItemCategory {
  return value != null && (ITEM_CATEGORIES as readonly string[]).includes(value)
}

type SearchParams = Promise<{ category?: string }>

export default async function ItemsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const campaignId = await getActiveCampaignId()
  if (!campaignId) redirect('/')
  const supabase = db()

  let q = supabase.from('items').select('*').eq('campaign_id', campaignId).order('name')
  if (params.category) q = q.eq('category', params.category)

  const { data: rawItems } = await q
  const items = (rawItems ?? []) as Item[]

  const filters = [
    {
      type: 'select' as const,
      name: 'category',
      label: 'Category',
      options: ITEM_CATEGORIES.map(c => ({ value: c, label: CATEGORY_LABELS[c] })),
    },
  ]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Items</h1>
          <p className="text-sm text-slate-500 mt-1">{items.length} entries</p>
        </div>
        <Link href="/items/new" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          New Item
        </Link>
      </div>

      <Suspense fallback={null}>
        <FilterBar filters={filters} />
      </Suspense>

      {!items.length ? (
        <div className="rounded-lg border border-dashed border-slate-600 p-12 text-center">
          <p className="text-slate-500 text-sm">No items match the current filters.</p>
          <Link href="/items/new" className="mt-3 inline-block text-sm font-medium text-indigo-400 hover:text-indigo-300">
            Create the first one →
          </Link>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800">
                <th className="text-left px-4 py-3 font-medium text-slate-400">Name</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400">Category</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400">Base Price</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <ClickableRow key={item.id} href={`/items/${item.id}`} className="border-b border-slate-700/50 last:border-0 hover:bg-slate-700/50">
                  <td className="px-4 py-3">
                    <SubLink href={`/items/${item.id}`} className="font-medium text-slate-100 hover:text-indigo-400">
                      {item.name}
                    </SubLink>
                    {item.descriptor && (
                      <span className="text-slate-500 text-xs ml-2">{item.descriptor}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isItemCategory(item.category) ? (
                      <span className="rounded-full bg-indigo-900/40 px-2 py-0.5 text-xs text-indigo-300 border border-indigo-700">
                        {CATEGORY_LABELS[item.category]}
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
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
