import { createCampaign } from '@/lib/actions/campaigns'
import Link from 'next/link'

const input = 'block w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none'
const label = 'block text-sm font-medium text-slate-300 mb-1'

export default function NewCampaignPage() {
  return (
    <div className="p-8 max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="text-sm text-slate-400 hover:text-slate-300">Dashboard</Link>
        <span className="text-slate-600">/</span>
        <span className="text-sm text-slate-100 font-medium">New Campaign</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-100 mb-6">New Campaign</h1>
      <form action={createCampaign} className="space-y-5">
        <div>
          <label className={label}>Name <span className="text-red-500">*</span></label>
          <input spellCheck name="name" required autoFocus className={input} />
        </div>
        <div>
          <label className={label}>Description</label>
          <textarea spellCheck name="description" rows={4} className={`${input} resize-none`} />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Create Campaign
          </button>
          <Link href="/" className="rounded-md border border-slate-600 bg-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-600">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
