'use client'
import { useState } from 'react'
import { createPlayerPosting } from '@/lib/actions/boardPostings'

interface Props {
  campaignId: string
  pcId: string
}

export function CreatePlayerPostingForm({ campaignId, pcId }: Props) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [hidden, setHidden] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData()
    fd.append('campaign_id', campaignId)
    fd.append('pc_id', pcId)
    fd.append('title', title)
    fd.append('description', description)
    fd.append('hidden_goal', hidden ? 'true' : 'false')
    await createPlayerPosting(fd)
    setTitle(''); setDescription(''); setHidden(false)
    setOpen(false); setLoading(false)
  }

  const input = 'block w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none'

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600"
      >
        Add Party Goal
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-6">
            <h2 className="text-lg font-bold text-slate-100 mb-4">Add Objective</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Title <span className="text-red-500">*</span></label>
                <input value={title} onChange={e => setTitle(e.target.value)} required autoFocus className={input} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className={`${input} resize-none`} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={hidden} onChange={e => setHidden(e.target.checked)}
                  className="rounded border-slate-600 bg-slate-700 text-purple-500" />
                <span className="text-sm text-slate-300">Secret goal <span className="text-purple-400">(only you and the GM can see this)</span></span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading || !title.trim()}
                  className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 disabled:opacity-50">
                  {loading ? 'Adding…' : 'Add Objective'}
                </button>
                <button type="button" onClick={() => setOpen(false)}
                  className="rounded-md border border-slate-600 bg-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-600">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
