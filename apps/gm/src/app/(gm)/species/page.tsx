import { db } from '@/lib/db'
import { Species } from '@ttrpg/db'
import { ClickableRow, SubLink } from '@/components/TableRow'
import Link from 'next/link'

function stripMentions(text: string): string {
  return text.replace(/\[\[[^\]]+\|([^\]]+)\]\]/g, '$1')
}

export default async function SpeciesPage() {
  const supabase = db()
  const { data: raw } = await supabase.from('species').select('*').order('name')
  const speciesList = (raw ?? []) as Species[]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Species / Ancestry</h1>
        <Link href="/species/new" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          New Species
        </Link>
      </div>

      {speciesList.length === 0 ? (
        <p className="text-sm text-slate-500">No species yet. Add one to populate dropdowns on NPCs, PCs, and factions.</p>
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
              {speciesList.map((s) => (
                <ClickableRow key={s.id} href={`/species/${s.id}`} className="border-b border-slate-700/50 last:border-0 hover:bg-slate-800">
                  <td className="px-4 py-2.5">
                    <SubLink href={`/species/${s.id}`} className="font-medium text-slate-100 hover:text-indigo-400">{s.name}</SubLink>
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 max-w-xs truncate">
                    {s.description ? stripMentions(s.description) : '—'}
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
