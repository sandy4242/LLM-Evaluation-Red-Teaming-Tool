'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Run } from '@/types'
import RegressionBadge from '@/components/ui/RegressionBadge'
import ScoreBar from '@/components/ui/ScoreBar'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { SkeletonTableRow } from '@/components/ui/SkeletonLoader'

/** Extended Run type with joined relations from the API */
interface RunWithRelations extends Run {
  test_suites?: { id: string; name: string }
  prompt_versions?: { id: string; version_no: number }
}

/** Format a date string as a human-readable relative time (e.g. "3 hours ago") */
function relativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then

  const seconds = Math.floor(diffMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)

  if (seconds < 60) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  if (weeks < 5) return `${weeks}w ago`
  return `${months}mo ago`
}

export default function RunsPage() {
  const router = useRouter()
  const [runs, setRuns] = useState<RunWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRuns = useCallback(async () => {
    try {
      const res = await fetch('/api/runs')
      if (!res.ok) throw new Error('Failed to fetch runs')
      const data = await res.json()
      setRuns(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRuns()
  }, [fetchRuns])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
          Run History
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          All test suite executions
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-error-muted border border-error/20 rounded-xl px-5 py-4 text-error text-sm font-medium">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border font-bold">
              <tr>
                <th className="px-5 py-3 text-left">Suite</th>
                <th className="px-5 py-3 text-left">Version</th>
                <th className="px-5 py-3 text-left">Model</th>
                <th className="px-5 py-3 text-left">Score</th>
                <th className="px-5 py-3 text-left">Pass / Fail</th>
                <th className="px-5 py-3 text-left">Tokens</th>
                <th className="px-5 py-3 text-left">Regression</th>
                <th className="px-5 py-3 text-left">Date</th>
                <th className="px-5 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonTableRow key={i} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && runs.length === 0 && (
        <EmptyState
          title="No runs yet"
          description="Execute a test suite to see results here."
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
            </svg>
          }
        />
      )}

      {/* Runs Table */}
      {!loading && !error && runs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="bg-card rounded-xl border border-border overflow-hidden shadow-sm"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border font-bold">
                <tr>
                  <th className="px-5 py-3 text-left">Suite</th>
                  <th className="px-5 py-3 text-left">Version</th>
                  <th className="px-5 py-3 text-left">Model</th>
                  <th className="px-5 py-3 text-left">Score</th>
                  <th className="px-5 py-3 text-left">Pass / Fail</th>
                  <th className="px-5 py-3 text-left">Tokens</th>
                  <th className="px-5 py-3 text-left">Regression</th>
                  <th className="px-5 py-3 text-left">Date</th>
                  <th className="px-5 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {runs.map((run, index) => (
                  <motion.tr
                    key={run.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.03 }}
                    onClick={() => router.push(`/runs/${run.id}`)}
                    className={`cursor-pointer transition-colors duration-200 ${
                      run.regression_flagged
                        ? 'border-l-[3px] border-l-error hover:bg-muted/20'
                        : 'hover:bg-muted/20'
                    }`}
                  >
                    <td className="px-5 py-4 font-semibold text-foreground text-xs">
                      {run.test_suites?.name ?? '—'}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground font-semibold text-xs">
                      v{run.prompt_versions?.version_no ?? '—'}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="muted" className="font-mono">
                        {run.model}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 w-44">
                      <ScoreBar score={run.avg_score} showLabel={false} />
                      <span className="text-[10px] text-muted-foreground mt-1 block font-semibold">
                        {run.avg_score?.toFixed(2)} / 5.00
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-success font-semibold text-xs">
                        {run.pass_count} ✓
                      </span>
                      <span className="text-muted-foreground/60 mx-1">/</span>
                      <span className="text-error font-semibold text-xs">
                        {run.fail_count} ✗
                      </span>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground font-semibold text-xs">
                      {run.total_tokens?.toLocaleString() ?? '—'}
                    </td>
                    <td className="px-5 py-4">
                      <RegressionBadge flagged={run.regression_flagged} />
                    </td>
                    <td className="px-5 py-4 text-muted-foreground text-xs font-medium">
                      <span title={new Date(run.created_at).toLocaleString()}>
                        {relativeTime(run.created_at)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/runs/${run.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-accent hover:underline text-xs font-bold transition-all"
                      >
                        View →
                      </Link>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  )
}