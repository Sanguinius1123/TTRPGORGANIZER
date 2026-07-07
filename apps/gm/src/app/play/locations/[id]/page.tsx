import { createAnonClient } from '@/lib/supabase/server'
import { Location, Shop } from '@ttrpg/db'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { renderMentions } from '@/lib/mentions'
import { buildVisibleMentionSet } from '@/lib/mentionVisibility'
import { getActivePcId } from '@/lib/activePC'
import { WatchButton } from '@/components/WatchButton'

export default async function LocationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createAnonClient()
  const activePcId = await getActivePcId()

  const results = await Promise.all([
    supabase.from('locations').select('id, name, type, descriptor, status, area, description, parent_location_id, image_url, visible, map_x, map_y, waypoint, terrain, path_modifiers, has_submap, mystery, campaign_id, created_at').eq('id', id).eq('visible', true).eq('mystery', false).single(),
    supabase.from('locations').select('id, name').eq('parent_location_id', id).eq('visible', true).eq('mystery', false).neq('waypoint', true).order('name'),
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

  const visibleIds = await buildVisibleMentionSet(supabase, [location.description, location.area])

  let isWatching = false
  if (activePcId) {
    const { data: watchData } = await supabase.from('pc_watches')
      .select('id').eq('pc_id', activePcId).eq('entity_type', 'location').eq('entity_id', id).maybeSingle()
    isWatching = !!watchData
  }

  // Load inventory for each shop (two-step to filter items by visible)
  interface InvRow { id: string; shop_id: string; item_id: string; price_override: number | null }
  interface ShopInvItem { id: string; invId: string; shopId: string; name: string; base_price: number | null; price_override: number | null }
  let shopInventory: ShopInvItem[] = []
  if (shops.length > 0) {
    const shopIds = shops.map(s => s.id)
    const { data: rawInv } = await supabase
      .from('shop_inventory')
      .select('id, shop_id, item_id, price_override')
      .in('shop_id', shopIds)
      .eq('available', true)
    const invRows = (rawInv ?? []) as InvRow[]
    if (invRows.length > 0) {
      const itemIds = invRows.map(r => r.item_id)
      const { data: rawItems } = await supabase
        .from('items')
        .select('id, name, base_price')
        .in('id', itemIds)
        .eq('visible', true)
      const visibleItems = (rawItems ?? []) as Array<{ id: string; name: string; base_price: number | null }>
      const itemById = Object.fromEntries(visibleItems.map(item => [item.id, item]))
      shopInventory = invRows
        .filter(r => itemById[r.item_id])
        .map(r => ({
          id: r.item_id,
          invId: r.id,
          shopId: r.shop_id,
          name: itemById[r.item_id].name,
          base_price: itemById[r.item_id].base_price,
          price_override: r.price_override,
        }))
    }
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/play/locations" className="text-slate-500 hover:text-slate-300">Locations</Link>
        {parent && (
          <>
            <span className="text-slate-600">/</span>
            <Link href={`/play/locations/${parent.id}`} className="text-slate-500 hover:text-slate-300">{parent.name}</Link>
          </>
        )}
        <span className="text-slate-600">/</span>
        <span className="text-slate-100 font-medium">{location.name ?? '(unnamed)'}</span>
      </div>

      <div className="mb-6">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
          {location.type ?? 'Location'}{location.descriptor ? ` · ${location.descriptor}` : ''}
        </p>
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-slate-100">{location.name ?? '(unnamed)'}</h1>
          {activePcId && <WatchButton pcId={activePcId} entityType="location" entityId={id} initialWatching={isWatching} />}
        </div>
      </div>

      <div className="space-y-6">
        {(location.status || location.area) && (
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
              {location.status && (
                <div>
                  <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Status</dt>
                  <dd className="text-sm text-slate-100">{location.status}</dd>
                </div>
              )}
              {location.area && (
                <div>
                  <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Area</dt>
                  <dd className="text-sm text-slate-100">{renderMentions(location.area, visibleIds)}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {location.description && (
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Description</h2>
            <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{renderMentions(location.description, visibleIds)}</p>
          </div>
        )}

        {subLocations.length > 0 && (
          <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            <div className="px-6 py-3 border-b border-slate-700/50 bg-slate-800">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Areas & Sub-locations</h2>
            </div>
            <ul className="divide-y divide-slate-700/50">
              {subLocations.map(sub => (
                <li key={sub.id}>
                  <Link href={`/play/locations/${sub.id}`} className="flex items-center justify-between px-6 py-3 hover:bg-slate-800 transition-colors">
                    <span className="text-sm font-medium text-indigo-400 hover:underline">{sub.name ?? '(unnamed)'}</span>
                    <span className="text-slate-600 text-xs">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {shops.length > 0 && (
          <div className="space-y-4">
            {shops.map((shop) => {
              const inv = shopInventory.filter(r => r.shopId === shop.id)
              return (
                <div key={shop.id} className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                  <div className="px-6 py-3 border-b border-slate-700/50 bg-slate-800">
                    <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{shop.name}</h2>
                  </div>
                  {inv.length === 0 ? (
                    <p className="px-6 py-4 text-sm text-slate-500">Nothing available.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700/50">
                          <th className="text-left px-6 py-2.5 font-medium text-slate-500">Item</th>
                          <th className="text-right px-6 py-2.5 font-medium text-slate-500">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inv.map(row => (
                          <tr key={row.invId} className="border-b border-slate-700/50 last:border-0 hover:bg-slate-700/50">
                            <td className="px-6 py-3 text-slate-100">{row.name}</td>
                            <td className="px-6 py-3 text-right text-slate-500">
                              {row.price_override ?? row.base_price ?? '—'}
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
