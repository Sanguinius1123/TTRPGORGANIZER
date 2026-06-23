import Link from 'next/link'

interface BreadcrumbItem {
  id: string
  name: string | null
}

interface Props {
  ancestors: BreadcrumbItem[]
  current: { id: string; name: string | null }
}

export function Breadcrumb({ ancestors, current }: Props) {
  return (
    <div className="flex items-center gap-1.5 px-4 py-2 text-sm flex-wrap">
      <Link href="/map" className="text-slate-400 hover:text-slate-200 transition-colors">
        Map
      </Link>
      {ancestors.map(a => (
        <span key={a.id} className="flex items-center gap-1.5">
          <span className="text-slate-600">›</span>
          <Link href={`/map/${a.id}`} className="text-slate-400 hover:text-slate-200 transition-colors">
            {a.name ?? '(unnamed)'}
          </Link>
        </span>
      ))}
      <span className="text-slate-600">›</span>
      <span className="text-slate-100 font-medium">{current.name ?? '(unnamed)'}</span>
    </div>
  )
}
