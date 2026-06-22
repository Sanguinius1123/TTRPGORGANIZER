import { db } from '@/lib/db'
import { createSession } from '@/lib/actions/sessions'
import MentionTextarea from '@/components/MentionTextarea'
import Link from 'next/link'

const input = 'block w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none'
const label = 'block text-sm font-medium text-slate-300 mb-1'

export default async function NewSessionPage() {
  const supabase = db()
  const { data: raw } = await supabase.from('factions').select('id, name').order('name')
  const factions = (raw ?? []) as Array<{ id: string; name: string }>

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/sessions" className="text-sm text-slate-400 hover:text-slate-300">Sessions</Link>
        <span className="text-slate-600">/</span>
        <span className="text-sm text-slate-100 font-medium">New</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-100 mb-6">Log Session</h1>

      <form action={createSession} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Session # <span className="text-red-500">*</span></label>
            <input name="session_number" type="number" min="1" required className={input} autoFocus />
          </div>
          <div>
            <label className={label}>Title</label>
            <input name="title" className={input} />
          </div>
        </div>
        <div>
          <label className={label}>Party / Faction</label>
          <select name="faction_id" className={input}>
            <option value="">— None —</option>
            {factions.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Summary</label>
          <MentionTextarea name="summary" rows={6} className={`${input} resize-none`} />
        </div>
        <div>
          <label className={label}>Loose Threads</label>
          <MentionTextarea name="loose_threads" rows={4} placeholder="Unresolved questions, follow-ups, things players may pursue…" className={`${input} resize-none`} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Save Session
          </button>
          <Link href="/sessions" className="rounded-md border border-slate-600 bg-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-600">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
