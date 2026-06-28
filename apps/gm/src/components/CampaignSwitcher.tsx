'use client'
import { useRef } from 'react'
import { switchCampaign } from '@/lib/actions/campaigns'

interface Props {
  campaigns: Array<{ id: string; name: string }>
  activeCampaignId: string
}

export function CampaignSwitcher({ campaigns, activeCampaignId }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  return (
    <form ref={formRef} action={async (fd: FormData) => { await switchCampaign(fd.get('campaign_id') as string) }}>
      <select
        name="campaign_id"
        defaultValue={activeCampaignId}
        onChange={() => formRef.current?.requestSubmit()}
        className="text-sm rounded-md border border-slate-600 px-3 py-1.5 text-slate-200 bg-slate-700 focus:outline-none focus:border-indigo-400"
      >
        {campaigns.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </form>
  )
}
