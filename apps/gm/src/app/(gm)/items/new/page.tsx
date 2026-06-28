import { createItem } from '@/lib/actions/items'
import MentionTextarea from '@/components/MentionTextarea'
import Link from 'next/link'
import { getActiveCampaignId } from '@/lib/activeCampaign'
import { redirect } from 'next/navigation'

const input = 'block w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none'
const label = 'block text-sm font-medium text-slate-300 mb-1'

const ITEM_TYPES = [
  'Weapon', 'Armour', 'Consumable', 'Tool', 'Currency', 'Relic', 'Document', 'Vehicle', 'Misc',
]

export default async function NewItemPage() {
  const campaignId = await getActiveCampaignId()
  if (!campaignId) redirect('/')
  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/items" className="text-sm text-slate-400 hover:text-slate-300">Items</Link>
        <span className="text-slate-600">/</span>
        <span className="text-sm text-slate-100 font-medium">New</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-100 mb-6">New Item</h1>

      <form action={createItem} className="space-y-5">
        <input type="hidden" name="campaign_id" value={campaignId} />
        <div>
          <label className={label}>Name <span className="text-red-500">*</span></label>
          <input name="name" required className={input} autoFocus spellCheck />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Type</label>
            <select name="item_type" className={input}>
              <option value="">— None —</option>
              {ITEM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>Descriptor</label>
            <input name="descriptor" placeholder="Material, origin, enchantment…" className={input} spellCheck />
          </div>
        </div>
        <div>
          <label className={label}>Base Price</label>
          <input name="base_price" type="number" min="0" className={input} />
        </div>
        <div>
          <label className={label}>Description</label>
          <MentionTextarea name="description" rows={4} className={`${input} resize-none`} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Create Item
          </button>
          <Link href="/items" className="rounded-md border border-slate-600 bg-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-600">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
