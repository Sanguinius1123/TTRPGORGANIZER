import { createSession } from '@/lib/actions/sessions'
import Link from 'next/link'

const input = 'block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none'
const label = 'block text-sm font-medium text-zinc-700 mb-1'

export default function NewSessionPage() {
  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/sessions" className="text-sm text-zinc-500 hover:text-zinc-700">Sessions</Link>
        <span className="text-zinc-300">/</span>
        <span className="text-sm text-zinc-900 font-medium">New</span>
      </div>
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">Log Session</h1>

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
          <label className={label}>Summary</label>
          <textarea name="summary" rows={6} className={`${input} resize-none`} />
        </div>
        <div>
          <label className={label}>Loose Threads</label>
          <textarea name="loose_threads" rows={4} placeholder="Unresolved questions, follow-ups, things players may pursue…" className={`${input} resize-none`} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Save Session
          </button>
          <Link href="/sessions" className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
