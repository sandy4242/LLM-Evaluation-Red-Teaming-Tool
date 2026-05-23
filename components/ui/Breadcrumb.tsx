'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

const ROUTE_LABELS: Record<string, string> = {
  '': 'Dashboard',
  'prompts': 'Prompts',
  'test-suites': 'Test Suites',
  'runs': 'Run History',
  'compare': 'Compare',
  'red-team': 'Red Team',
  'new': 'New',
}

export default function Breadcrumb() {
  const pathname = usePathname()

  if (pathname === '/') return null

  const segments = pathname.split('/').filter(Boolean)
  const crumbs = segments.map((seg, i) => {
    const href = '/' + segments.slice(0, i + 1).join('/')
    const label = ROUTE_LABELS[seg] || seg
    const isLast = i === segments.length - 1
    return { href, label, isLast }
  })

  return (
    <nav className="flex items-center gap-1.5 text-sm">
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground transition-colors font-medium"
      >
        Home
      </Link>
      {crumbs.map((crumb) => (
        <span key={crumb.href} className="flex items-center gap-1.5">
          <span className="text-muted-foreground/40">/</span>
          {crumb.isLast ? (
            <span className="text-foreground font-semibold truncate max-w-[200px]">
              {crumb.label}
            </span>
          ) : (
            <Link
              href={crumb.href}
              className="text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}
