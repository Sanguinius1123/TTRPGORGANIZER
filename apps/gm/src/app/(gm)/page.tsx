import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { CAMPAIGN_COOKIE } from '@/lib/activeCampaign'
import { createCampaign, updateCampaign } from '@/lib/actions/campaigns'
import type { Campaign } from '@ttrpg/db'
import { CampaignSwitcher } from '@/components/CampaignSwitcher'

const sections = [
  { label: 'Locations',         href: '/locations',         table: 'locations'         as const },
  { label: 'NPCs',              href: '/npcs',              table: 'npcs'              as const },
  { label: 'Player Characters', href: '/player-characters', table: 'player_characters' as const },
  { label: 'Factions',          href: '/factions',          table: 'factions'          as const },
  { label: 'Items',             href: '/items',             table: 'items'             as const },
  { label: 'Sessions',          href: '/sessions',          table: 'sessions'          as const },
  { label: 'Encounters',        href: '/encounters',        table: 'encounters'        as const },
  { label: 'Plot Threads',      href: '/plot-threads',      table: 'plot_threads'      as const },
  { label: 'Lore Entries',      href: '/lore',              table: 'lore_entries'      as const },
]

const inputCls = 'block w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none'
const labelCls = 'block text-sm font-medium text-slate-300 mb-1'

export default async function DashboardPage() {
  const supabase = db()
  const { data: rawCampaigns } = await supabase.from('campaigns').select('*').order('created_at')
  const campaigns = (rawCampaigns ?? []) as Campaign[]

  const store = await cookies()
  let activeCampaignId = store.get(CAMPAIGN_COOKIE)?.value ?? null

  if (!activeCampaignId && campaigns.length > 0) {
    activeCampaignId = campaigns[0].id
  }

  if (!activeCampaignId) {
    return (
      <div className="p-8 max-w-lg">
        <h1 className="text-2xl font-bold text-slate-100 mb-2">Welcome</h1>
        <p className="text-sm text-slate-500 mb-8">Create your first campaign to get started.</p>
        <form action={createCampaign} className="space-y-4">
          <div>
            <label className={labelCls}>Campaign Name <span className="text-red-500">*</span></label>
            <input spellCheck name="name" required autoFocus className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea spellCheck name="description" rows={3} className={`${inputCls} resize-none`} />
          </div>
          <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Create Campaign
          </button>
        </form>
      </div>
    )
  }

  const activeCampaign = campaigns.find(c => c.id === activeCampaignId) ?? campaigns[0]

  const counts = await Promise.all(
    sections.map(async ({ table }) => {
      const { count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', activeCampaignId!)
      return count ?? 0
    })
  )

  return (
    <div className="p-8 max-w-4xl space-y-8">

      {/* Campaign header — name + description editable inline */}
      <div className="flex items-start justify-between gap-6">
        <form action={updateCampaign} className="flex-1 min-w-0 space-y-2">
          <input type="hidden" name="id" value={activeCampaign.id} />
          <input
            spellCheck
            name="name"
            defaultValue={activeCampaign.name}
            className="w-full bg-transparent text-2xl font-bold text-slate-100 placeholder-slate-600 focus:outline-none border-b border-transparent focus:border-slate-600 transition-colors pb-0.5"
          />
          <textarea
            spellCheck
            name="description"
            defaultValue={activeCampaign.description ?? ''}
            rows={2}
            placeholder="Add a campaign description…"
            className="w-full bg-transparent text-sm text-slate-400 placeholder-slate-600 focus:outline-none border-b border-transparent focus:border-slate-600 transition-colors resize-none"
          />
          <button type="submit" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
            Save
          </button>
        </form>
        <div className="flex items-center gap-2 shrink-0 pt-1">
          <CampaignSwitcher campaigns={campaigns.map(c => ({ id: c.id, name: c.name }))} activeCampaignId={activeCampaign.id} />
          <Link
            href="/campaigns/new"
            className="rounded-md border border-slate-600 bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-600 whitespace-nowrap"
          >
            + New Campaign
          </Link>
        </div>
      </div>

      {/* Entity counts — compact grid */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">At a glance</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
          {sections.map(({ label, href }, i) => (
            <Link
              key={href}
              href={href}
              className="bg-slate-800 rounded-lg border border-slate-700 px-3 py-3 hover:border-indigo-400 transition-all"
            >
              <p className="text-xl font-bold text-slate-100">{counts[i]}</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-tight">{label}</p>
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}
