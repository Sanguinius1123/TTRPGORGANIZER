import { createCulture } from '@/lib/actions/cultures'
import MentionTextarea from '@/components/MentionTextarea'
import Link from 'next/link'
import { getActiveCampaignId } from '@/lib/activeCampaign'
import { redirect } from 'next/navigation'

const input = 'block w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none'
const label = 'block text-sm font-medium text-slate-300 mb-1'

export default async function NewCulturePage() {
  const campaignId = await getActiveCampaignId()
  if (!campaignId) redirect('/')
  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/cultures" className="text-sm text-slate-400 hover:text-slate-300">Cultures</Link>
        <span className="text-slate-600">/</span>
        <span className="text-sm text-slate-100 font-medium">New</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-100 mb-6">New Culture</h1>

      <form action={createCulture} className="space-y-5">
        <input type="hidden" name="campaign_id" value={campaignId} />
        <div>
          <label className={label}>Name <span className="text-red-500">*</span></label>
          <input spellCheck name="name" required className={input} autoFocus />
        </div>
        <div>
          <label className={label}>Description</label>
          <MentionTextarea name="description" rows={5} placeholder="Values, customs, traditions, social structure…" className={`${input} resize-none`} />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Create Culture
          </button>
          <Link href="/cultures" className="rounded-md border border-slate-600 bg-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-600">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
