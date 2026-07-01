import { db } from '@/lib/db'
import { createAnonClient } from '@/lib/supabase/server'
import { Profile } from '@ttrpg/db'
import { redirect } from 'next/navigation'
import { updateRegistrationCode, toggleGmStatus } from '@/lib/actions/settings'

export default async function SettingsPage() {
  // Verify admin access
  const anonClient = await createAnonClient()
  const { data: { user } } = await anonClient.auth.getUser()
  if (!user) redirect('/login')

  const supabase = db()
  const { data: currentProfile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!currentProfile?.is_admin) redirect('/')

  const results = await Promise.all([
    supabase.from('settings').select('*').eq('key', 'registration_code').single(),
    supabase.from('profiles').select('*').order('created_at'),
  ])

  const registrationCode = results[0].data?.value ?? ''
  const profiles = (results[1].data ?? []) as Profile[]

  return (
    <div className="p-8 max-w-2xl space-y-10">
      <h1 className="text-2xl font-bold text-slate-100">Settings</h1>

      {/* Registration Code */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-100">Player Portal Access Code</h2>
        <p className="text-sm text-slate-400">
          Players must enter this code when registering for the player portal. Change it at any time to revoke future registrations (existing accounts are unaffected).
        </p>
        <form action={updateRegistrationCode} className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-slate-400 mb-1">Access code</label>
            <input
              spellCheck
              name="registration_code"
              defaultValue={registrationCode}
              className="w-full rounded-md bg-slate-700 border border-slate-600 px-3 py-2 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium"
          >
            Save
          </button>
        </form>
      </section>

      {/* Registered Players */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-100">Registered Players</h2>
        <p className="text-sm text-slate-400">
          Toggle GM access per account. GMs see the full GM interface. To assign a character to a player, open that character&apos;s detail page and use the Player account selector.
        </p>
        {profiles.length === 0 ? (
          <p className="text-sm text-slate-500">No players have registered yet.</p>
        ) : (
          <div className="rounded-lg border border-slate-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800">
                  <th className="text-left px-4 py-2.5 font-medium text-slate-400">Display name</th>
                  <th className="text-left px-4 py-2.5 font-medium text-slate-400">Account ID</th>
                  <th className="text-left px-4 py-2.5 font-medium text-slate-400">GM</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map(p => (
                  <tr key={p.id} className="border-b border-slate-700 last:border-0">
                    <td className="px-4 py-2.5 text-slate-100">{p.display_name ?? '—'}</td>
                    <td className="px-4 py-2.5 text-slate-500 font-mono text-xs">{p.id}</td>
                    <td className="px-4 py-2.5">
                      <form action={toggleGmStatus}>
                        <input type="hidden" name="profile_id" value={p.id} />
                        <input type="hidden" name="is_gm" value={p.is_gm ? 'false' : 'true'} />
                        <button
                          type="submit"
                          className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                            p.is_gm
                              ? 'bg-indigo-900/50 border-indigo-700 text-indigo-300 hover:bg-indigo-900/70'
                              : 'bg-slate-700 border-slate-600 text-slate-400 hover:bg-slate-600 hover:text-slate-100'
                          }`}
                        >
                          {p.is_gm ? 'GM ✓' : 'Player'}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
