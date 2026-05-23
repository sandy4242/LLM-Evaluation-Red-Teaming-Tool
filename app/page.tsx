'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Run } from '@/types'
import StatCard from '@/components/ui/StatCard'
import Sparkline from '@/components/ui/Sparkline'
import TrendChart from '@/components/ui/TrendChart'
import Badge from '@/components/ui/Badge'
import RegressionBadge from '@/components/ui/RegressionBadge'
import ScoreBar from '@/components/ui/ScoreBar'
import { SkeletonStat, SkeletonTableRow, SkeletonChart } from '@/components/ui/SkeletonLoader'
import EmptyState from '@/components/ui/EmptyState'

/* ── helpers ── */

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60_000)
  const diffHr = Math.floor(diffMs / 3_600_000)
  const diffDay = Math.floor(diffMs / 86_400_000)

  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay === 1) return 'Yesterday'
  if (diffDay < 7) return `${diffDay}d ago`
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/* ── stagger variants ── */
const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
} as const
const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
} as const

/* ── page component ── */

export default function DashboardPage() {
  const [runs, setRuns] = useState<Run[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/runs')
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to fetch runs (${r.status})`)
        return r.json()
      })
      .then((data) => {
        setRuns(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  /* ── derived stats ── */
  const totalRuns = runs.length
  const regressions = useMemo(() => runs.filter((r) => r.regression_flagged).length, [runs])

  const avgScore = useMemo(() => {
    if (!runs.length) return '—'
    return (runs.reduce((sum, r) => sum + r.avg_score, 0) / runs.length).toFixed(2)
  }, [runs])

  const passRate = useMemo(() => {
    if (!runs.length) return { display: '—', delta: undefined as { value: number; positive: boolean } | undefined }
    const totalPass = runs.reduce((s, r) => s + r.pass_count, 0)
    const totalFail = runs.reduce((s, r) => s + r.fail_count, 0)
    const total = totalPass + totalFail
    const rate = total > 0 ? ((totalPass / total) * 100).toFixed(1) : '0'
    return { display: `${rate}%`, delta: { value: Number(rate), positive: Number(rate) >= 50 } }
  }, [runs])

  const scoreSparkData = useMemo(
    () =>
      [...runs]
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map((r) => r.avg_score),
    [runs],
  )

  /* ── trend chart data ── */
  const trendData = useMemo(() => {
    return [...runs]
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((r, i) => ({
        date: r.created_at,
        avg_score: r.avg_score,
        pass_rate:
          r.pass_count + r.fail_count > 0
            ? (r.pass_count / (r.pass_count + r.fail_count)) * 100
            : 0,
        version_no: (r as any).prompt_versions?.version_no ?? i + 1,
        regression_flagged: r.regression_flagged,
      }))
  }, [runs])

  /* ── error state ── */
  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Overview of all evaluation runs and prompt health
          </p>
        </div>
        <div className="flex items-center justify-center py-16 bg-error-muted border border-error/20 rounded-xl">
          <p className="text-sm text-error font-semibold">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* ── header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Overview of all evaluation runs and prompt health
          </p>
        </div>
      </div>

      {/* ── stat cards ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonStat key={i} />
          ))}
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={cardVariants}>
            <StatCard label="Total Runs" value={totalRuns}>
              {scoreSparkData.length >= 2 && (
                <Sparkline data={scoreSparkData} color="var(--muted-foreground)" />
              )}
            </StatCard>
          </motion.div>

          <motion.div variants={cardVariants}>
            <StatCard label="Avg Score" value={avgScore}>
              {scoreSparkData.length >= 2 && (
                <Sparkline data={scoreSparkData} color="var(--accent)" />
              )}
            </StatCard>
          </motion.div>

          <motion.div variants={cardVariants}>
            <StatCard label="Pass Rate" value={passRate.display} delta={passRate.delta} />
          </motion.div>

          <motion.div variants={cardVariants}>
            <StatCard
              label="Regressions"
              value={regressions}
            >
              <span
                className={`text-xs font-semibold ${
                  regressions > 0 ? 'text-error' : 'text-success'
                }`}
              >
                {regressions > 0 ? '⚠ Action needed' : '✓ All clear'}
              </span>
            </StatCard>
          </motion.div>
        </motion.div>
      )}

      {/* ── trend chart ── */}
      {loading ? (
        <SkeletonChart />
      ) : (
        <TrendChart data={trendData} promptName="All Prompts" />
      )}

      {/* ── run history table ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground tracking-tight">Run History</h2>
          <Link
            href="/runs"
            className="text-xs font-semibold text-accent hover:opacity-85 transition-opacity flex items-center gap-1"
          >
            View all run history →
          </Link>
        </div>

        {loading ? (
          <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border font-bold">
                  <tr>
                    <th className="px-5 py-3 text-left">Suite</th>
                    <th className="px-5 py-3 text-left">Model</th>
                    <th className="px-5 py-3 text-left">Score</th>
                    <th className="px-5 py-3 text-left">Pass / Fail</th>
                    <th className="px-5 py-3 text-left">Regression</th>
                    <th className="px-5 py-3 text-left">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonTableRow key={i} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : runs.length === 0 ? (
          <EmptyState
            title="No runs yet"
            description="Start evaluating your prompts by running a test suite."
            action={{ label: "Run a test suite", href: "/test-suites" }}
          />
        ) : (
          <motion.div
            className="bg-card rounded-xl border border-border overflow-hidden shadow-sm"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border font-bold">
                  <tr>
                    <th className="px-5 py-3 text-left">Suite</th>
                    <th className="px-5 py-3 text-left">Model</th>
                    <th className="px-5 py-3 text-left">Score</th>
                    <th className="px-5 py-3 text-left">Pass / Fail</th>
                    <th className="px-5 py-3 text-left">Regression</th>
                    <th className="px-5 py-3 text-left">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {runs.slice(0, 10).map((run) => (
                    <tr key={run.id} className="hover:bg-muted/20 transition-colors group">
                      <td colSpan={6} className="p-0">
                        <Link
                          href={`/runs/${run.id}`}
                          className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr] w-full"
                        >
                          {/* Suite */}
                          <span className="px-5 py-4 font-semibold text-foreground text-xs truncate">
                            {(run as any).test_suites?.name ?? '—'}
                          </span>

                          {/* Model */}
                          <span className="px-5 py-4">
                            <Badge>{run.model}</Badge>
                          </span>

                          {/* Score */}
                          <span className="px-5 py-4 w-44">
                            <ScoreBar score={run.avg_score} showLabel={false} />
                            <span className="text-[10px] text-muted-foreground mt-1 block font-semibold">
                              {run.avg_score?.toFixed(2)} / 5.00
                            </span>
                          </span>

                          {/* Pass / Fail */}
                          <span className="px-5 py-4">
                            <span className="text-success font-semibold text-xs">
                              {run.pass_count} ✓
                            </span>
                            <span className="text-muted-foreground/60 mx-1">/</span>
                            <span className="text-error font-semibold text-xs">
                              {run.fail_count} ✗
                            </span>
                          </span>

                          {/* Regression */}
                          <span className="px-5 py-4">
                            <RegressionBadge flagged={run.regression_flagged} />
                          </span>

                          {/* Date */}
                          <span className="px-5 py-4 text-muted-foreground text-xs font-medium">
                            {relativeTime(run.created_at)}
                          </span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}