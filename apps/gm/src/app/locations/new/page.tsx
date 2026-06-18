import { db } from '@/lib/db'
import { createLocation } from '@/lib/actions/locations'
import Link from 'next/link'

const input = 'block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none'
const label = 'block text-sm font-medium text-zinc-700 mb-1'

export default async function NewLocationPage() {
  const supabase = db()
  const { data: rawLocations } = await supabase.from('locations').select('id, name').order('name')
  const locations = (rawLocations ?? []) as Array<{ id: string; name: string }>

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/locations" className="text-sm text-zinc-500 hover:text-zinc-700">Locations</Link>
        <span className="text-zinc-300">/</span>
        <span className="text-sm text-zinc-900 font-medium">New</span>
      </div>
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">New Location</h1>

      <form action={createLocation} className="space-y-5">
        <div>
          <label className={label}>Name <span className="text-red-500">*</span></label>
          <input name="name" required className={input} autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Type</label>
            <input name="type" placeholder="settlement, ruin, landmark…" className={input} />
          </div>
          <div>
            <label className={label}>Status</label>
            <input name="status" placeholder="active, abandoned, destroyed…" className={input} />
          </div>
        </div>
        <div>
          <label className={label}>Area</label>
          <input name="area" placeholder="Relative position within parent (e.g. near the harbour)" className={input} />
        </div>
        <div>
          <label className={label}>Parent Location</label>
          <select name="parent_location_id" className={input}>
            <option value="">— None —</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Description</label>
          <textarea name="description" rows={5} className={`${input} resize-none`} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Create Location
          </button>
          <Link href="/locations" className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
