import { db } from '@/lib/db'
import { createEncounter } from '@/lib/actions/encounters'
import MentionTextarea from '@/components/MentionTextarea'
import Link from 'next/link'

const input = 'block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none'
const label = 'block text-sm font-medium text-zinc-700 mb-1'

export default async function NewEncounterPage() {
  const supabase = db()
  const results = await Promise.all([
    supabase.from('locations').select('id, name').order('name'),
    supabase.from('sessions').select('id, session_number, title').order('session_number', { ascending: false }),
  ])
  const locations = results[0].data as Array<{ id: string; name: string }> | null
  const sessions = results[1].data as Array<{ id: string; session_number: number; title: string | null }> | null

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/encounters" className="text-sm text-zinc-500 hover:text-zinc-700">Encounters</Link>
        <span className="text-zinc-300">/</span>
        <span className="text-sm text-zinc-900 font-medium">New</span>
      </div>
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">New Encounter</h1>

      <form action={createEncounter} className="space-y-5">
        <div>
          <label className={label}>Title <span className="text-red-500">*</span></label>
          <input name="title" required className={input} autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Location</label>
            <select name="location_id" className={input}>
              <option value="">— None —</option>
              {locations?.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Session</label>
            <select name="session_id" className={input}>
              <option value="">— None (prep) —</option>
              {sessions?.map((s) => (
                <option key={s.id} value={s.id}>#{s.session_number}{s.title ? ` — ${s.title}` : ''}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className={label}>Status</label>
          <select name="status" className={input} defaultValue="prep">
            <option value="prep">Prep</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div>
          <label className={label}>Notes</label>
          <MentionTextarea name="notes" rows={5} placeholder="Encounter setup, tactics, terrain, objectives…" className={`${input} resize-none`} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Create Encounter
          </button>
          <Link href="/encounters" className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
