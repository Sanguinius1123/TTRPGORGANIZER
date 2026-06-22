import { db } from '@/lib/db'
import { createFaction } from '@/lib/actions/factions'
import MentionTextarea from '@/components/MentionTextarea'
import Link from 'next/link'

const input = 'block w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none'
const label = 'block text-sm font-medium text-slate-300 mb-1'

export default async function NewFactionPage() {
  const supabase = db()
  const results = await Promise.all([
    supabase.from('factions').select('id, name').order('name'),
    supabase.from('species').select('id, name').order('name'),
    supabase.from('cultures').select('id, name').order('name'),
  ])
  const factions = (results[0].data ?? []) as Array<{ id: string; name: string }>
  const speciesList = (results[1].data ?? []) as Array<{ id: string; name: string }>
  const culturesList = (results[2].data ?? []) as Array<{ id: string; name: string }>

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/factions" className="text-sm text-slate-400 hover:text-slate-300">Factions</Link>
        <span className="text-slate-600">/</span>
        <span className="text-sm text-slate-100 font-medium">New</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-100 mb-6">New Faction</h1>

      <form action={createFaction} className="space-y-5">
        <div>
          <label className={label}>Name <span className="text-red-500">*</span></label>
          <input name="name" required className={input} autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Species / Ancestry</label>
            <select name="species" className={input}>
              <option value="">— None —</option>
              {speciesList.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>Culture</label>
            <select name="culture" className={input}>
              <option value="">— None —</option>
              {culturesList.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
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
        <div>
          <label className={label}>Goal</label>
          <MentionTextarea name="goal" rows={2} className={`${input} resize-none`} />
        </div>
        <div>
          <label className={label}>Description</label>
          <MentionTextarea name="description" rows={5} className={`${input} resize-none`} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Create Faction
          </button>
          <Link href="/factions" className="rounded-md border border-slate-600 bg-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-600">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
