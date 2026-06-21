import { db } from '@/lib/db'
import { Culture } from '@ttrpg/db'
import { ClickableRow, SubLink } from '@/components/TableRow'
import Link from 'next/link'

function stripMentions(text: string): string {
  return text.replace(/\[\[[^\]]+\|([^\]]+)\]\]/g, '$1')
}

export default async function CulturesPage() {
  const supabase = db()
  const { data: raw } = await supabase.from('cultures').select('*').order('name')
  const cultures = (raw ?? []) as Culture[]

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Cultures</h1>
        <Link href="/cultures/new" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          New Culture
        </Link>
      </div>

      {cultures.length === 0 ? (
        <p className="text-sm text-zinc-400">No cultures yet. Add one to populate dropdowns on NPCs, PCs, and factions.</p>
      ) : (
        <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="text-left px-4 py-2.5 font-medium text-zinc-600">Name</th>
                <th className="text-left px-4 py-2.5 font-medium text-zinc-600">Description</th>
              </tr>
            </thead>
            <tbody>
              {cultures.map((c) => (
                <ClickableRow key={c.id} href={`/cultures/${c.id}`} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                  <td className="px-4 py-2.5">
                    <SubLink href={`/cultures/${c.id}`} className="font-medium text-zinc-900 hover:text-indigo-600">{c.name}</SubLink>
                  </td>
                  <td className="px-4 py-2.5 text-zinc-500 max-w-xs truncate">
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
