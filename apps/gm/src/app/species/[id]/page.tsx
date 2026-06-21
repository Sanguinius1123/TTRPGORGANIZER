import { db } from '@/lib/db'
import { updateSpecies, deleteSpecies } from '@/lib/actions/species'
import { Species } from '@ttrpg/db'
import MentionTextarea from '@/components/MentionTextarea'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const input = 'block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none'
const label = 'block text-sm font-medium text-zinc-700 mb-1'

export default async function SpeciesDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = db()
  const { data: raw } = await supabase.from('species').select('*').eq('id', id).single()
  if (!raw) notFound()
  const species = raw as Species

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/species" className="text-sm text-zinc-500 hover:text-zinc-700">Species</Link>
        <span className="text-zinc-300">/</span>
        <span className="text-sm text-zinc-900 font-medium">{species.name}</span>
      </div>
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">{species.name}</h1>

      <form action={updateSpecies} className="bg-white rounded-lg border border-zinc-200 p-6 space-y-5 mb-8">
        <input type="hidden" name="id" value={species.id} />
        <div>
          <label className={label}>Name</label>
          <input name="name" defaultValue={species.name} required className={input} />
        </div>
        <div>
          <label className={label}>Description</label>
          <MentionTextarea name="description" defaultValue={species.description ?? ''} rows={6} placeholder="Physical traits, cultural tendencies, origins…" className={`${input} resize-none`} />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Save Changes
          </button>
        </div>
      </form>

      <div className="border-t border-zinc-200 pt-6">
        <form action={deleteSpecies}>
          <input type="hidden" name="id" value={species.id} />
          <button type="submit" className="rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100">
            Delete Species
          </button>
        </form>
      </div>
    </div>
  )
}
