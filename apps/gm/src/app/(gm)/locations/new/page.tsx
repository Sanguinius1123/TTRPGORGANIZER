import { db } from '@/lib/db'
import { createLocation } from '@/lib/actions/locations'
import MentionTextarea from '@/components/MentionTextarea'
import Link from 'next/link'
import { getActiveCampaignId } from '@/lib/activeCampaign'
import { redirect } from 'next/navigation'

const input = 'block w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none'
const label = 'block text-sm font-medium text-slate-300 mb-1'

const LOCATION_TYPES = [
  'Sector', 'Star System', 'Star / Singularity', 'Planetoid', 'World', 'Space Station',
  'Wilderness', 'Ruin', 'Settlement', 'District',
  'Fortification', 'Residence', 'Commerce', 'Tavern / Inn', 'Place of Worship',
  'Government', 'Prison', 'Guild / Organization', 'Workshop',
  'Research / Laboratory', 'Medical / Healthcare', 'Entertainment', 'Transport Hub',
  'POI',
]

export default async function NewLocationPage({
  searchParams,
}: {
  searchParams: Promise<{ parent?: string }>
}) {
  const { parent } = await searchParams
  const campaignId = await getActiveCampaignId()
  if (!campaignId) redirect('/')
  const supabase = db()
  const { data: rawLocations } = await supabase.from('locations').select('id, name').eq('campaign_id', campaignId).order('name')
  const locations = (rawLocations ?? []) as Array<{ id: string; name: string | null }>

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/locations" className="text-sm text-slate-400 hover:text-slate-300">Locations</Link>
        <span className="text-slate-600">/</span>
        <span className="text-sm text-slate-100 font-medium">New</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-100 mb-6">New Location</h1>

      <form action={createLocation} className="space-y-5">
        <input type="hidden" name="campaign_id" value={campaignId} />
        <div>
          <label className={label}>Name <span className="text-red-500">*</span></label>
          <input name="name" required className={input} autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Type</label>
            <select name="type" className={input}>
              <option value="">— None —</option>
              {LOCATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>Descriptor</label>
            <input name="descriptor" placeholder="Ocean World, Frontier Colony…" className={input} />
          </div>
        </div>
        <div>
          <label className={label}>Status</label>
          <input name="status" placeholder="active, abandoned, destroyed…" className={input} />
        </div>
        <div>
          <label className={label}>Area</label>
          <input name="area" placeholder="Relative position within parent (e.g. near the harbour)" className={input} />
        </div>
        <div>
          <label className={label}>Parent Location</label>
          <select name="parent_location_id" className={input} defaultValue={parent ?? ''}>
            <option value="">— None —</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>{l.name ?? '(unnamed)'}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Description</label>
          <MentionTextarea name="description" rows={5} className={`${input} resize-none`} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Create Location
          </button>
          <Link href="/locations" className="rounded-md border border-slate-600 bg-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-600">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
