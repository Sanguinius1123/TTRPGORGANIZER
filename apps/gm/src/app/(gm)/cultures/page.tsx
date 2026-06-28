import { db } from '@/lib/db'
import { Culture } from '@ttrpg/db'
import { ClickableRow, SubLink } from '@/components/TableRow'
import Link from 'next/link'
import { getActiveCampaignId } from '@/lib/activeCampaign'
import { redirect } from 'next/navigation'

function stripMentions(text: string): string {
  return text.replace(/\[\[[^\]]+\|([^\]]+)\]\]/g, '$1')
}

export default async function CulturesPage() {
  const campaignId = await getActiveCampaignId()
  if (!campaignId) redirect('/')
  const supabase = db()
  const { data: raw } = await supabase.from('cultures').select('*').eq('campaign_id', campaignId).order('name')
  const cultures = (raw ?? []) as Culture[]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Cultures</h1>
        <Link href="/cultures/new" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          New Culture
        </Link>
      </div>

      {cultures.length === 0 ? (
        <p className="text-sm text-slate-500">No cultures yet. Add one to populate dropdowns on NPCs, PCs, and factions.</p>
      ) : (
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800">
                <th className="text-left px-4 py-2.5 font-medium text-slate-400">Name</th>
                <th className="text-left px-4 py-2.5 font-medium text-slate-400">Description</th>
              </tr>
            </thead>
            <tbody>
              {cultures.map((c) => (
                <ClickableRow key={c.id} href={`/cultures/${c.id}`} className="border-b border-slate-700/50 last:border-0 hover:bg-slate-800">
                  <td className="px-4 py-2.5">
                    <SubLink href={`/cultures/${c.id}`} className="font-medium text-slate-100 hover:text-indigo-400">{c.name}</SubLink>
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 max-w-xs truncate">
                    {c.description ? stripMentions(c.description) : '—'}
                  </td>
                </ClickableRow>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
