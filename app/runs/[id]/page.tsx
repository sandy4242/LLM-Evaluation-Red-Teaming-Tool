'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import RunResultsTable from '@/components/ui/RunResultsTable'
import RegressionBadge from '@/components/ui/RegressionBadge'
import ScoreBar from '@/components/ui/ScoreBar'

export default function RunDetailPage() {
  const { id } = useParams()
  const [run, setRun] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/runs/${id}`)
      .then(r => r.json())
      .then(data => { setRun(data); setLoading(false) })
  }, [id])

  if (loading) return (
    <div className="text-center py-16 bg-card border border-border rounded-xl text-muted-foreground animate-pulse text-sm font-semibold">
      Loading run details...
    </div>
  )
  if (!run) return (
    <div className="text-center py-16 bg-card border border-border rounded-xl text-muted-foreground text-sm font-medium">
      Run not found
    </div>
  )

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            Run Details
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            <span className="font-semibold text-foreground/80">{run.test_suites?.name}</span> ·{' '}
            v{run.prompt_versions?.version_no} ·{' '}
            <span className="font-mono text-xs bg-muted border border-border px-1.5 py-0.5 rounded text-muted-foreground font-semibold uppercase">{run.model}</span>
          </p>
        </div>
        <RegressionBadge flagged={run.regression_flagged} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 inset-x-0 h-1 bg-muted/40 group-hover:bg-accent transition-colors" />
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Avg Score</p>
          <p className="text-3xl font-extrabold text-accent mt-2 tracking-tight">
            {run.avg_score?.toFixed(2)}
          </p>
          <div className="mt-3">
            <ScoreBar score={run.avg_score} showLabel={false} />
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 inset-x-0 h-1 bg-muted/40 group-hover:bg-accent transition-colors" />
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Passed</p>
          <p className="text-3xl font-extrabold text-success mt-2 tracking-tight">
            {run.pass_count}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 inset-x-0 h-1 bg-muted/40 group-hover:bg-accent transition-colors" />
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Failed</p>
          <p className="text-3xl font-extrabold text-error mt-2 tracking-tight">
            {run.fail_count}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 inset-x-0 h-1 bg-muted/40 group-hover:bg-accent transition-colors" />
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Tokens Used</p>
          <p className="text-3xl font-extrabold text-foreground mt-2 tracking-tight">
            {run.total_tokens?.toLocaleString() ?? '—'}
          </p>
        </div>
      </div>

      {/* Results table */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground tracking-tight">
          Test Case Results
        </h2>
        <RunResultsTable results={run.results ?? []} />
      </div>

      {/* Red team summary if exists */}
      {run.red_team_run && (
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-lg font-bold text-foreground tracking-tight mb-4">
            Red Team Summary
          </h2>
          <div className="flex items-center gap-8 mb-4">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Pass Rate</p>
              <p className="text-3xl font-extrabold text-accent mt-1 tracking-tight">
                {run.red_team_run.pass_rate}%
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Variations Tested</p>
              <p className="text-3xl font-extrabold text-foreground mt-1 tracking-tight">
                {run.red_team_run.variations?.length ?? 0}
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground bg-muted/30 border border-border/60 rounded-xl p-4 leading-relaxed">
            {run.red_team_run.summary}
          </p>
        </div>
      )}
    </div>
  )
}