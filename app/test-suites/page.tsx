'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function TestSuitesPage() {
  const [suites, setSuites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/test-suites')
      .then(r => r.json())
      .then(data => { setSuites(data); setLoading(false) })
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Test Suites</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Collections of test cases linked to prompts
          </p>
        </div>
        <Link href="/test-suites/new"
          className="bg-primary text-primary-foreground px-4 py-2.5 rounded-lg
            text-sm font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm">
          + New Suite
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl text-muted-foreground animate-pulse text-sm font-semibold">
          Loading test suites...
        </div>
      ) : suites.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl text-muted-foreground text-sm font-medium">
          No test suites yet.{' '}
          <Link href="/test-suites/new"
            className="text-accent hover:underline font-semibold">
            Create one
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {suites.map(suite => (
            <Link
              key={suite.id}
              href={`/test-suites/${suite.id}`}
              className="bg-card rounded-xl border border-border p-6
                hover:border-accent hover:shadow-md transition-all duration-300 block group"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <h3 className="font-bold text-foreground group-hover:text-accent transition-colors">
                    {suite.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Prompt: <span className="font-semibold text-foreground/80">{suite.prompts?.name ?? '—'}</span>
                  </p>
                  <p className="text-xs text-muted-foreground/60 font-semibold flex items-center gap-1.5 mt-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent/60" />
                    {suite.test_cases?.length ?? 0} test case
                    {suite.test_cases?.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground/60 whitespace-nowrap font-medium">
                  {new Date(suite.created_at).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}