import { db } from '@/lib/db'
import { Session } from '@ttrpg/db'
import Link from 'next/link'
import { getActiveCampaignId } from '@/lib/activeCampaign'
import { redirect } from 'next/navigation'

function stripMentions(text: string): string {
  return text.replace(/\[\[[^\]]+\|([^\]]+)\]\]/g, '$1')
}

export default async function SessionsPage() {
  const campaignId = await getActiveCampaignId()
  if (!campaignId) redirect('/')
  const supabase = db()

  const results = await Promise.all([
    supabase.from('sessions').select('*').eq('campaign_id', campaignId).order('session_number', { ascending: false }),
    supabase.from('factions').select('id, name').eq('campaign_id', campaignId).order('name'),
  ])

  const sessions = (results[0].data ?? []) as Session[]
  const factions = (results[1].data ?? []) as Array<{ id: string; name: string }>
  const factionById = Object.fromEntries(factions.map(f => [f.id, f]))

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Sessions</h1>
          <p className="text-sm text-slate-500 mt-1">{sessions.length} sessions logged</p>
        </div>
        <Link href="/sessions/new" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          Log Session
        </Link>
      </div>

      {!sessions.length ? (
        <div className="rounded-lg border border-dashed border-slate-600 p-12 text-center">
          <p className="text-slate-500 text-sm">No sessions logged yet.</p>
          <Link href="/sessions/new" className="mt-3 inline-block text-sm font-medium text-indigo-400 hover:text-indigo-300">
            Log the first one →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            const faction = s.faction_id ? factionById[s.faction_id] : null
            return (
              <Link
                key={s.id}
                href={`/sessions/${s.id}`}
                className="flex items-start gap-4 bg-slate-800 rounded-lg border border-slate-700 p-4 hover:border-indigo-300 hover:shadow-sm transition-all"
              >
                <span className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 font-bold text-sm">
                  {s.session_number}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-slate-100">{s.title ?? `Session ${s.session_number}`}</p>
                    {faction && (
                      <span className="inline-flex items-center rounded-full bg-indigo-900/40 px-2 py-0.5 text-xs font-medium text-indigo-300">
                        {faction.name}
                      </span>
                    )}
                  </div>
                  {s.summary && (
                    <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{stripMentions(s.summary)}</p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
