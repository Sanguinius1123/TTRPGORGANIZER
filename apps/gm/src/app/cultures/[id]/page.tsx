import { db } from '@/lib/db'
import { updateCulture, deleteCulture } from '@/lib/actions/cultures'
import { Culture } from '@ttrpg/db'
import MentionTextarea from '@/components/MentionTextarea'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const input = 'block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none'
const label = 'block text-sm font-medium text-zinc-700 mb-1'

export default async function CultureDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = db()
  const { data: raw } = await supabase.from('cultures').select('*').eq('id', id).single()
  if (!raw) notFound()
  const culture = raw as Culture

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/cultures" className="text-sm text-zinc-500 hover:text-zinc-700">Cultures</Link>
        <span className="text-zinc-300">/</span>
        <span className="text-sm text-zinc-900 font-medium">{culture.name}</span>
      </div>
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">{culture.name}</h1>

      <form action={updateCulture} className="bg-white rounded-lg border border-zinc-200 p-6 space-y-5 mb-8">
        <input type="hidden" name="id" value={culture.id} />
        <div>
          <label className={label}>Name</label>
          <input name="name" defaultValue={culture.name} required className={input} />
        </div>
        <div>
          <label className={label}>Description</label>
          <MentionTextarea name="description" defaultValue={culture.description ?? ''} rows={6} placeholder="Values, customs, traditions, social structure…" className={`${input} resize-none`} />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Save Changes
          </button>
        </div>
      </form>

      <div className="border-t border-zinc-200 pt-6">
        <form action={deleteCulture}>
          <input type="hidden" name="id" value={culture.id} />
          <button type="submit" className="rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100">
            Delete Culture
          </button>
        </form>
      </div>
    </div>
  )
}
