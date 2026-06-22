import { createClient } from '@/lib/supabase/server'
import { Location, Shop, Item } from '@ttrpg/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'

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
    <div className="p-8 max-w-3xl space-y-8">
      <div>
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">
          {location.type ?? 'Location'}{location.descriptor ? ` · ${location.descriptor}` : ''}
        </p>
        <h1 className="text-2xl font-bold text-zinc-900">{location.name}</h1>
        {location.status && <p className="mt-1 text-sm text-zinc-500">{location.status}</p>}
      </div>

      {location.description && (
        <p className="text-zinc-700 whitespace-pre-wrap">{location.description}</p>
      )}

      {subLocations.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">Areas</h2>
          <div className="space-y-1">
            {subLocations.map(sub => (
              <Link key={sub.id} href={`/locations/${sub.id}`} className="block text-sm text-indigo-600 hover:underline">
                {sub.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {shops.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">Shops</h2>
          {shops.map((shop, i) => {
            const inv = (inventories[i]?.data ?? []) as Array<{ id: string; price_override: number | null; items: Item | null }>
            return (
              <div key={shop.id} className="rounded-lg bg-white border border-zinc-200 p-4">
                <p className="font-semibold text-zinc-900 mb-3">{shop.name}</p>
                {inv.length === 0 ? (
                  <p className="text-sm text-zinc-400">Nothing available.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-100">
                        <th className="text-left py-1 font-medium text-zinc-500">Item</th>
                        <th className="text-right py-1 font-medium text-zinc-500">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inv.map(row => (
                        <tr key={row.id} className="border-b border-zinc-50 last:border-0">
                          <td className="py-1.5 text-zinc-800">{row.items?.name ?? '—'}</td>
                          <td className="py-1.5 text-right text-zinc-500">
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
        </section>
      )}
    </div>
  )
}
