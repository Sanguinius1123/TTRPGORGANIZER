'use client'

interface Props {
  action: () => Promise<void>
}

export function DeletePostingButton({ action }: Props) {
  return (
    <form action={action} className="ml-auto">
      <button
        type="submit"
        onClick={e => { if (!confirm('Delete this posting?')) e.preventDefault() }}
        className="rounded-md border border-red-800 bg-red-950/30 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-900/30"
      >
        Delete
      </button>
    </form>
  )
}
