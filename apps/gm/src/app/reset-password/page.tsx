'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type Status = 'checking' | 'ready' | 'expired'

const input = 'block w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [status, setStatus] = useState<Status>('checking')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const recoveredRef = useRef(false)

  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        recoveredRef.current = true
        setStatus('ready')
      }
    })
    // If no recovery event within 4 seconds, link is invalid or expired
    const timer = setTimeout(() => {
      if (!recoveredRef.current) setStatus('expired')
    }, 4000)
    return () => { subscription.unsubscribe(); clearTimeout(timer) }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-slate-100 mb-8 text-center">TTRPG Organizer</h1>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          {status === 'checking' && (
            <p className="text-sm text-slate-400 text-center">Verifying reset link…</p>
          )}
          {status === 'expired' && (
            <div className="space-y-3 text-center">
              <p className="text-sm text-slate-300">This reset link has expired or is invalid.</p>
              <Link href="/forgot-password" className="text-sm text-indigo-400 hover:text-indigo-300">Request a new one</Link>
            </div>
          )}
          {status === 'ready' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">New password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  required autoFocus minLength={6} className={input} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Confirm password</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  required minLength={6} className={input} />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                {loading ? 'Updating…' : 'Set new password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
