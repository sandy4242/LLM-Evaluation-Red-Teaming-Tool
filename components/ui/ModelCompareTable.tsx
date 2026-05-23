'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PerCaseComparisonResult, ComparisonSummary } from '@/types'
import ScoreBar from './ScoreBar'
import Badge from './Badge'

interface ModelCompareTableProps {
  summary: ComparisonSummary
  results: PerCaseComparisonResult[]
}

export default function ModelCompareTable({
  summary,
  results
}: ModelCompareTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  const toggleRow = (id: string) => {
    setExpandedRow(prev => (prev === id ? null : id))
  }

  return (
    <div className="space-y-6">
      {/* Summary header — 3 column grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Model A Card */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-3">
            Model A · {summary.model_a}
          </p>
          <p className="text-3xl font-extrabold text-foreground tracking-tight">
            {summary.pass_rate_a}%
          </p>
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1">
            Pass Rate
          </p>
          <div className="mt-3 space-y-1">
            <p className="text-xs text-muted-foreground font-medium">
              Avg score:{' '}
              <span className="text-foreground font-semibold font-mono">
                {summary.avg_score_a.toFixed(2)}
              </span>
            </p>
            <p className="text-[10px] text-muted-foreground/80 font-mono">
              {summary.total_tokens_a?.toLocaleString()} tokens
            </p>
          </div>
        </div>

        {/* Winner Card */}
        <motion.div
          className="bg-card rounded-xl border border-border p-5 shadow-sm
            flex flex-col items-center justify-center text-center relative overflow-hidden"
          animate={{
            boxShadow: [
              '0 0 0px 0px rgba(99,102,241,0)',
              '0 0 20px 2px rgba(99,102,241,0.12)',
              '0 0 0px 0px rgba(99,102,241,0)',
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Gradient top bar */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-accent to-indigo-500" />

          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-2">
            Winner Verdict
          </p>
          <p className="text-lg font-extrabold text-accent flex items-center gap-1.5">
            {summary.winner === 'tie'
              ? '🤝 Tie'
              : summary.winner === 'model_a'
              ? `🏆 ${summary.model_a}`
              : `🏆 ${summary.model_b}`}
          </p>
          <p className="text-xs text-muted-foreground mt-2 font-medium">
            {summary.disagreements} disagreement
            {summary.disagreements !== 1 ? 's' : ''}
          </p>
        </motion.div>

        {/* Model B Card */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-3">
            Model B · {summary.model_b}
          </p>
          <p className="text-3xl font-extrabold text-foreground tracking-tight">
            {summary.pass_rate_b}%
          </p>
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1">
            Pass Rate
          </p>
          <div className="mt-3 space-y-1">
            <p className="text-xs text-muted-foreground font-medium">
              Avg score:{' '}
              <span className="text-foreground font-semibold font-mono">
                {summary.avg_score_b.toFixed(2)}
              </span>
            </p>
            <p className="text-[10px] text-muted-foreground/80 font-mono">
              {summary.total_tokens_b?.toLocaleString()} tokens
            </p>
          </div>
        </div>
      </div>

      {/* Per-case comparison table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border font-bold">
            <tr>
              <th className="px-4 py-3 text-left w-10">#</th>
              <th className="px-4 py-3 text-left">Input</th>
              <th className="px-4 py-3 text-left">{summary.model_a} Output</th>
              <th className="px-4 py-3 text-left">{summary.model_b} Output</th>
              <th className="px-4 py-3 text-left w-32">Score A</th>
              <th className="px-4 py-3 text-left w-32">Score B</th>
              <th className="px-4 py-3 text-left w-28">Disagreement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {results.map((r, index) => {
              const rowId = r.test_case_id
              const isExpanded = expandedRow === rowId

              return (
                <AnimatePresence key={rowId} initial={false}>
                  {/* Main Row */}
                  <tr
                    onClick={() => toggleRow(rowId)}
                    className={`cursor-pointer transition-colors duration-150 ${
                      r.disagreement
                        ? 'border-l-[3px] border-l-warning hover:bg-muted/20'
                        : 'hover:bg-muted/20'
                    }`}
                  >
                    <td className="px-4 py-4 text-muted-foreground/70 font-mono text-xs">
                      {index + 1}
                    </td>
                    <td className="px-4 py-4 max-w-[150px]">
                      <p
                        className="truncate text-foreground font-medium text-xs"
                        title={r.input}
                      >
                        {r.input}
                      </p>
                    </td>
                    <td className="px-4 py-4 max-w-[180px]">
                      <p
                        className="truncate text-muted-foreground text-xs"
                        title={r.output_a}
                      >
                        {r.output_a}
                      </p>
                    </td>
                    <td className="px-4 py-4 max-w-[180px]">
                      <p
                        className="truncate text-muted-foreground text-xs"
                        title={r.output_b}
                      >
                        {r.output_b}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <ScoreBar score={r.score_a} showLabel={false} />
                      <span className="text-[10px] text-muted-foreground mt-1 block font-semibold">
                        {r.score_a.toFixed(1)}/5.0 ·{' '}
                        {r.passed_a ? (
                          <span className="text-success">Pass</span>
                        ) : (
                          <span className="text-error">Fail</span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <ScoreBar score={r.score_b} showLabel={false} />
                      <span className="text-[10px] text-muted-foreground mt-1 block font-semibold">
                        {r.score_b.toFixed(1)}/5.0 ·{' '}
                        {r.passed_b ? (
                          <span className="text-success">Pass</span>
                        ) : (
                          <span className="text-error">Fail</span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {r.disagreement ? (
                        <Badge variant="warning">Disagreement</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground/60">
                          —
                        </span>
                      )}
                    </td>
                  </tr>

                  {/* Expanded Row */}
                  {isExpanded && (
                    <tr key={`${rowId}-expanded`}>
                      <td colSpan={7} className="p-0">
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 py-5 bg-muted/20 border-t border-border/60">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              {/* Model A Output */}
                              <div>
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-2">
                                  {summary.model_a} — Full Output
                                </p>
                                <div className="bg-background rounded-lg border border-border p-4">
                                  <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap font-mono">
                                    {r.output_a}
                                  </p>
                                </div>
                                {r.explanation_a && (
                                  <p className="text-xs text-muted-foreground mt-2 italic">
                                    {r.explanation_a}
                                  </p>
                                )}
                              </div>

                              {/* Model B Output */}
                              <div>
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-2">
                                  {summary.model_b} — Full Output
                                </p>
                                <div className="bg-background rounded-lg border border-border p-4">
                                  <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap font-mono">
                                    {r.output_b}
                                  </p>
                                </div>
                                {r.explanation_b && (
                                  <p className="text-xs text-muted-foreground mt-2 italic">
                                    {r.explanation_b}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              )
            })}
          </tbody>
        </table>

        {results.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No comparison results available.
          </div>
        )}
      </div>
    </div>
  )
}