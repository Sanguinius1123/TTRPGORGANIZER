import { db } from '@/lib/db'
import { createFaction } from '@/lib/actions/factions'
import Link from 'next/link'

const input = 'block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none'
const label = 'block text-sm font-medium text-zinc-700 mb-1'

export default async function NewFactionPage() {
  const supabase = db()
  const { data: rawFactions } = await supabase.from('factions').select('id, name').order('name')
  const factions = (rawFactions ?? []) as Array<{ id: string; name: string }>

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/factions" className="text-sm text-zinc-500 hover:text-zinc-700">Factions</Link>
        <span className="text-zinc-300">/</span>
        <span className="text-sm text-zinc-900 font-medium">New</span>
      </div>
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">New Faction</h1>

      <form action={createFaction} className="space-y-5">
        <div>
          <label className={label}>Name <span className="text-red-500">*</span></label>
          <input name="name" required className={input} autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Disposition</label>
            <input name="disposition" placeholder="allied, neutral, hostile…" className={input} />
          </div>
          <div>
            <label className={label}>Parent Faction</label>
            <select name="parent_faction_id" className={input}>
              <option value="">— None —</option>
              {factions.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className={label}>Goal</label>
          <input name="goal" className={input} />
        </div>
        <div>
          <label className={label}>Description</label>
          <textarea name="description" rows={5} className={`${input} resize-none`} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Create Faction
          </button>
          <Link href="/factions" className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
