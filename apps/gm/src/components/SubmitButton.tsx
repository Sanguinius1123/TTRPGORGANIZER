'use client'
import { useFormStatus } from 'react-dom'

export function SubmitButton({ label = 'Save changes', className }: { label?: string; className?: string }) {
  const { pending } = useFormStatus()
  const base = 'px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium transition-colors'
  return (
    <button type="submit" disabled={pending} className={className ?? base}>
      {pending ? 'Saving…' : label}
    </button>
  )
}
