import { db } from '@/lib/db'
import { createNpc } from '@/lib/actions/npcs'
import MentionTextarea from '@/components/MentionTextarea'
import Link from 'next/link'

const input = 'block w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none'
const label = 'block text-sm font-medium text-slate-300 mb-1'

export default async function NewNpcPage() {
  const supabase = db()
  const results = await Promise.all([
    supabase.from('species').select('id, name').order('name'),
    supabase.from('cultures').select('id, name').order('name'),
  ])
  const speciesList = (results[0].data ?? []) as Array<{ id: string; name: string }>
  const culturesList = (results[1].data ?? []) as Array<{ id: string; name: string }>

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/npcs" className="text-sm text-slate-400 hover:text-slate-300">NPCs</Link>
        <span className="text-slate-600">/</span>
        <span className="text-sm text-slate-100 font-medium">New</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-100 mb-6">New NPC</h1>

      <form action={createNpc} className="space-y-5">
        <div>
          <label className={label}>Name <span className="text-red-500">*</span></label>
          <input spellCheck name="name" required className={input} autoFocus />
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
            <label className={label}>Profession</label>
            <input spellCheck name="profession" className={input} />
          </div>
        </div>
        <div>
          <label className={label}>Culture</label>
          <select name="culture" className={input}>
            <option value="">— None —</option>
            {culturesList.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Background</label>
          <MentionTextarea name="background" rows={4} className={`${input} resize-none`} />
        </div>
        <div>
          <label className={label}>GM Notes <span className="text-xs text-slate-500">(private)</span></label>
          <MentionTextarea name="notes" rows={3} className={`${input} resize-none`} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Create NPC
          </button>
          <Link href="/npcs" className="rounded-md border border-slate-600 bg-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-600">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
