import { db } from '@/lib/db'
import type { MapTypeRule } from '@ttrpg/db'
import Link from 'next/link'
import { upsertMapTypeRule, deleteMapTypeRule } from '@/lib/actions/mapTypeRules'

const LOCATION_TYPES = [
  'Sector', 'Star System', 'Star / Singularity', 'World', 'Space Station',
  'Wilderness', 'Ruin', 'Settlement', 'District', 'Fortification', 'Residence',
  'Commerce', 'Tavern / Inn', 'Place of Worship', 'Government', 'Prison',
  'Guild / Organization', 'Workshop', 'Research / Laboratory',
  'Medical / Healthcare', 'Entertainment', 'Transport Hub',
] as const

const input = 'block w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none'
const label = 'block text-sm font-medium text-slate-300 mb-1'

export default async function MapRulesPage() {
  const supabase = db()
  const { data: rawRules } = await supabase.from('map_type_rules').select('*').order('parent_type')
  const rules = (rawRules ?? []) as MapTypeRule[]

  return (
    <div className="p-8 max-w-3xl space-y-8">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/settings" className="text-sm text-slate-400 hover:text-slate-300">Settings</Link>
        <span className="text-slate-600">/</span>
        <span className="text-sm text-slate-100 font-medium">Map Rules</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-100">Map Type Rules</h1>
      <p className="text-sm text-slate-400">
        Define which location types can appear as children in each map level, what color to use for nodes,
        and how to calculate travel costs. A rule with no parent type applies to the root map.
      </p>

      {rules.length > 0 && (
        <div className="rounded-lg border border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800">
                <th className="text-left px-4 py-2.5 font-medium text-slate-400">Parent Type</th>
                <th className="text-left px-4 py-2.5 font-medium text-slate-400">Child Types</th>
                <th className="text-left px-4 py-2.5 font-medium text-slate-400">Color</th>
                <th className="text-left px-4 py-2.5 font-medium text-slate-400">Travel Unit</th>
                <th className="text-left px-4 py-2.5 font-medium text-slate-400">Scale</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {rules.map(rule => (
                <tr key={rule.id} className="border-b border-slate-700 last:border-0">
                  <td className="px-4 py-2.5 text-slate-100">{rule.parent_type ?? '(Root Map)'}</td>
                  <td className="px-4 py-2.5 text-slate-300 text-xs max-w-xs truncate">{rule.child_types.join(', ') || '—'}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border border-slate-500" style={{ backgroundColor: rule.color }} />
                      <span className="text-slate-400 font-mono text-xs">{rule.color}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-slate-300">{rule.travel_unit}</td>
                  <td className="px-4 py-2.5 text-slate-300">{rule.distance_scale}</td>
                  <td className="px-4 py-2.5">
                    <form action={deleteMapTypeRule.bind(null, rule.id)}>
                      <button type="submit" className="text-xs text-red-400 hover:text-red-300">Delete</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="border border-slate-700 rounded-lg p-5 space-y-4">
        <h2 className="text-base font-semibold text-slate-100">Add Rule</h2>
        <form action={upsertMapTypeRule} className="space-y-4">
          <input type="hidden" name="id" value="" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>Parent Type</label>
              <select name="parent_type" className={input}>
                <option value="">(Root Map — no parent)</option>
                {LOCATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Color</label>
              <input
                type="color"
                name="color"
                defaultValue="#64748b"
                className="block h-10 w-full rounded-md border border-slate-600 bg-slate-700 px-1 py-1 cursor-pointer"
              />
            </div>
          </div>
          <div>
            <label className={label}>Child Types (comma-separated)</label>
            <input
              name="child_types"
              placeholder="Settlement, Wilderness, Ruin…"
              className={input}
            />
            <p className="text-xs text-slate-500 mt-1">
              Valid types: {LOCATION_TYPES.join(', ')}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>Travel Unit</label>
              <input name="travel_unit" placeholder="days, hours, km…" defaultValue="days" className={input} />
            </div>
            <div>
              <label className={label}>Distance Scale</label>
              <input type="number" name="distance_scale" defaultValue="100" className={input} />
              <p className="text-xs text-slate-500 mt-1">Pixels per 1 travel unit</p>
            </div>
          </div>
          <button
            type="submit"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Add Rule
          </button>
        </form>
      </div>
    </div>
  )
}
