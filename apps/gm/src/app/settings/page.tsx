import { db } from '@/lib/db'
import { Profile, PlayerCharacter } from '@ttrpg/db'
import { updateRegistrationCode, assignProfileToPC } from '@/lib/actions/settings'

export default async function SettingsPage() {
  const supabase = db()

  const results = await Promise.all([
    supabase.from('settings').select('*').eq('key', 'registration_code').single(),
    supabase.from('profiles').select('*').order('created_at'),
    supabase.from('player_characters').select('id, name, profile_id').order('name'),
  ])

  const registrationCode = results[0].data?.value ?? ''
  const profiles = (results[1].data ?? []) as Profile[]
  const characters = (results[2].data ?? []) as Array<Pick<PlayerCharacter, 'id' | 'name' | 'profile_id'>>

  return (
    <div className="p-8 max-w-2xl space-y-10">
      <h1 className="text-2xl font-bold text-zinc-100">Settings</h1>

      {/* Registration Code */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-zinc-200">Player Portal Access Code</h2>
        <p className="text-sm text-zinc-400">
          Players must enter this code when registering for the player portal. Change it at any time to revoke future registrations (existing accounts are unaffected).
        </p>
        <form action={updateRegistrationCode} className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-zinc-400 mb-1">Access code</label>
            <input
              name="registration_code"
              defaultValue={registrationCode}
              className="w-full rounded-md bg-zinc-800 border border-zinc-700 px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
        <h2 className="text-lg font-semibold text-zinc-200">Registered Players</h2>
        {profiles.length === 0 ? (
          <p className="text-sm text-zinc-500">No players have registered yet.</p>
        ) : (
          <div className="space-y-4">
            {profiles.map((profile) => {
              const assignedPC = characters.find(c => c.profile_id === profile.id)
              return (
                <div key={profile.id} className="rounded-lg bg-zinc-800 border border-zinc-700 p-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-100">{profile.display_name ?? 'Unnamed Player'}</p>
                    <p className="text-xs text-zinc-500 font-mono">{profile.id}</p>
                  </div>
                  <form action={assignProfileToPC} className="flex gap-3 items-end">
                    <input type="hidden" name="pc_id" value={assignedPC?.id ?? ''} />
                    <input type="hidden" name="profile_id" value={profile.id} />
                    <div className="flex-1">
                      <label className="block text-xs text-zinc-400 mb-1">Assigned character</label>
                      <select
                        name="pc_id"
                        defaultValue={assignedPC?.id ?? ''}
                        className="w-full rounded-md bg-zinc-900 border border-zinc-600 px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">— unassigned —</option>
                        {characters.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="px-3 py-2 rounded-md bg-zinc-700 hover:bg-zinc-600 text-white text-sm"
                    >
                      Assign
                    </button>
                  </form>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
