import { createClient } from '@/lib/supabase/server'
import { Location, Shop, Item } from '@ttrpg/db'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function LocationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const results = await Promise.all([
    supabase.from('locations').select('*').eq('id', id).eq('visible', true).single(),
    supabase.from('locations').select('id, name').eq('parent_location_id', id).eq('visible', true).order('name'),
    supabase.from('shops').select('*').eq('location_id', id),
  ])

  const raw = results[0].data
  if (!raw) notFound()
  const location = raw as Location
  const subLocations = (results[1].data ?? []) as Pick<Location, 'id' | 'name'>[]
  const shops = (results[2].data ?? []) as Shop[]

  // Load parent location for breadcrumb
  let parent: { id: string; name: string } | null = null
  if (location.parent_location_id) {
    const { data: p } = await supabase.from('locations').select('id, name').eq('id', location.parent_location_id).single()
    parent = p as { id: string; name: string } | null
  }

  // Load inventory for each shop
  const inventories = shops.length > 0
    ? await Promise.all(
        shops.map(shop =>
          supabase
            .from('shop_inventory')
            .select('*, items(*)')
            .eq('shop_id', shop.id)
            .eq('available', true)
        )
      )
    : []

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/locations" className="text-zinc-500 hover:text-zinc-700">Locations</Link>
        {parent && (
          <>
            <span className="text-zinc-300">/</span>
            <Link href={`/locations/${parent.id}`} className="text-zinc-500 hover:text-zinc-700">{parent.name}</Link>
          </>
        )}
        <span className="text-zinc-300">/</span>
        <span className="text-zinc-900 font-medium">{location.name}</span>
      </div>

      <div className="mb-6">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">
          {location.type ?? 'Location'}{location.descriptor ? ` · ${location.descriptor}` : ''}
        </p>
        <h1 className="text-2xl font-bold text-zinc-900">{location.name}</h1>
      </div>

      <div className="space-y-6">
        {(location.status || location.area) && (
          <div className="bg-white rounded-lg border border-zinc-200 p-6">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
              {location.status && (
                <div>
                  <dt className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">Status</dt>
                  <dd className="text-sm text-zinc-800">{location.status}</dd>
                </div>
              )}
              {location.area && (
                <div>
                  <dt className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">Area</dt>
                  <dd className="text-sm text-zinc-800">{location.area}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {location.description && (
          <div className="bg-white rounded-lg border border-zinc-200 p-6">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Description</h2>
            <p className="text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">{location.description}</p>
          </div>
        )}

        {subLocations.length > 0 && (
          <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
            <div className="px-6 py-3 border-b border-zinc-100 bg-zinc-50">
              <h2 className="text-xs font-semibold text-zinc-600 uppercase tracking-wide">Areas & Sub-locations</h2>
            </div>
            <ul className="divide-y divide-zinc-100">
              {subLocations.map(sub => (
                <li key={sub.id}>
                  <Link href={`/locations/${sub.id}`} className="flex items-center justify-between px-6 py-3 hover:bg-zinc-50 transition-colors">
                    <span className="text-sm font-medium text-indigo-600 hover:underline">{sub.name}</span>
                    <span className="text-zinc-300 text-xs">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {shops.length > 0 && (
          <div className="space-y-4">
            {shops.map((shop, i) => {
              const inv = (inventories[i]?.data ?? []) as Array<{ id: string; price_override: number | null; items: Item | null }>
              return (
                <div key={shop.id} className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
                  <div className="px-6 py-3 border-b border-zinc-100 bg-zinc-50">
                    <h2 className="text-xs font-semibold text-zinc-600 uppercase tracking-wide">{shop.name}</h2>
                  </div>
                  {inv.length === 0 ? (
                    <p className="px-6 py-4 text-sm text-zinc-400">Nothing available.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-100">
                          <th className="text-left px-6 py-2.5 font-medium text-zinc-500">Item</th>
                          <th className="text-right px-6 py-2.5 font-medium text-zinc-500">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inv.map(row => (
                          <tr key={row.id} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50">
                            <td className="px-6 py-3 text-zinc-800">{row.items?.name ?? '—'}</td>
                            <td className="px-6 py-3 text-right text-zinc-500">
                              {row.price_override ?? row.items?.base_price ?? '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
