'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    // Validate registration code against settings table
    const { data: setting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'registration_code')
      .single()

    if (!setting || setting.value !== code.trim()) {
      setError('Invalid access code.')
      setLoading(false)
      return
    }

    // Create auth account
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    })

    if (signUpError || !data.user) {
      setError(signUpError?.message ?? 'Registration failed.')
      setLoading(false)
      return
    }

    // Create profile row
    await supabase.from('profiles').insert({
      id: data.user.id,
      display_name: displayName,
    })

    router.push('/play')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="w-full max-w-sm space-y-6 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-100">TTRPG Organizer</h1>
          <p className="mt-1 text-sm text-slate-400">Create your player account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Display name</label>
            <input
              type="text"
              spellCheck
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              required
              className="w-full rounded-md bg-slate-700 border border-slate-600 px-3 py-2 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full rounded-md bg-slate-700 border border-slate-600 px-3 py-2 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-md bg-slate-700 border border-slate-600 px-3 py-2 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Access code</label>
            <input
              type="text"
              spellCheck
              value={code}
              onChange={e => setCode(e.target.value)}
              required
              placeholder="Ask your GM"
              className="w-full rounded-md bg-slate-700 border border-slate-600 px-3 py-2 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2 text-sm font-medium text-white transition-colors"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
