'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const input = 'block w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) { setError(error.message); setLoading(false); return }
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-slate-100 mb-8 text-center">TTRPG Organizer</h1>
        {sent ? (
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 text-center space-y-4">
            <p className="text-slate-300 text-sm">Check your email for a password reset link.</p>
            <Link href="/login" className="text-sm text-indigo-400 hover:text-indigo-300">Back to sign in</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-slate-800 rounded-lg border border-slate-700 p-6 space-y-4">
            <p className="text-sm text-slate-400">Enter your email and we'll send you a reset link.</p>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus className={input} />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
            <p className="text-center text-xs text-slate-500">
              <Link href="/login" className="text-indigo-400 hover:text-indigo-300">Back to sign in</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
