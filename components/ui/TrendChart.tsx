'use client'

import { useState, useMemo, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'

interface TrendPoint {
  date: string
  avg_score: number
  pass_rate: number
  version_no: number
  regression_flagged: boolean
}

interface TrendChartProps {
  data: TrendPoint[]
  promptName: string
}

/* ── layout constants (SVG user-space units) ── */
const VB_W = 600
const VB_H = 200
const PAD = { top: 32, right: 24, bottom: 32, left: 44 }
const CHART_W = VB_W - PAD.left - PAD.right
const CHART_H = VB_H - PAD.top - PAD.bottom
const SCORE_MAX = 5
const GRID_LEVELS = [0, 1, 2, 3, 4, 5]

export default function TrendChart({ data, promptName }: TrendChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  /* ── derived geometry ── */
  const points = useMemo(() => {
    if (!data.length) return []
    return data.map((d, i) => ({
      x: PAD.left + (data.length === 1 ? CHART_W / 2 : (i / (data.length - 1)) * CHART_W),
      y: PAD.top + CHART_H - (d.avg_score / SCORE_MAX) * CHART_H,
      ...d,
    }))
  }, [data])

  const polyline = useMemo(
    () => points.map((p) => `${p.x},${p.y}`).join(' '),
    [points],
  )

  /* convert SVG-space position to screen position for the tooltip */
  const handlePointerEnter = useCallback(
    (idx: number, e: React.PointerEvent<SVGCircleElement>) => {
      setHoveredIdx(idx)
      const container = containerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    },
    [],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGCircleElement>) => {
      const container = containerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    },
    [],
  )

  /* ── empty state ── */
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-48 bg-muted/20
        rounded-xl border border-border text-muted-foreground text-sm font-medium">
        No run history yet for this prompt.
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="bg-card rounded-xl border border-border p-6 shadow-sm relative"
    >
      {/* title */}
      <p className="text-sm font-bold text-foreground mb-4">
        Score Trend — {promptName}
      </p>

      {/* ── legend ── */}
      <div className="flex items-center gap-5 mb-2">
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-accent" />
          Avg Score
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-error" />
          Regression
        </span>
      </div>

      {/* ── SVG chart ── */}
      <svg
        width="100%"
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="overflow-visible select-none"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Y-axis labels */}
        {GRID_LEVELS.map((level) => {
          const y = PAD.top + CHART_H - (level / SCORE_MAX) * CHART_H
          return (
            <text
              key={`y-${level}`}
              x={PAD.left - 10}
              y={y + 4}
              textAnchor="end"
              className="fill-muted-foreground"
              style={{ fontSize: 11, fontFamily: 'var(--font-sans)' }}
            >
              {level}
            </text>
          )
        })}

        {/* horizontal grid lines */}
        {GRID_LEVELS.map((level) => {
          const y = PAD.top + CHART_H - (level / SCORE_MAX) * CHART_H
          return (
            <line
              key={`grid-${level}`}
              x1={PAD.left}
              y1={y}
              x2={PAD.left + CHART_W}
              y2={y}
              stroke="var(--border)"
              strokeWidth={1}
              strokeDasharray="4 3"
            />
          )
        })}

        {/* X-axis version labels */}
        {points.map((p, i) => (
          <text
            key={`x-${i}`}
            x={p.x}
            y={VB_H - 6}
            textAnchor="middle"
            className="fill-muted-foreground"
            style={{ fontSize: 10, fontFamily: 'var(--font-sans)' }}
          >
            v{p.version_no}
          </text>
        ))}

        {/* trend polyline — animated draw-in */}
        <motion.polyline
          points={polyline}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        />

        {/* score labels above dots */}
        {points.map((p, i) => (
          <text
            key={`lbl-${i}`}
            x={p.x}
            y={p.y - 12}
            textAnchor="middle"
            className="fill-foreground"
            style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-sans)' }}
          >
            {p.avg_score.toFixed(1)}
          </text>
        ))}

        {/* data-point dots */}
        {points.map((p, i) => (
          <motion.circle
            key={`dot-${i}`}
            cx={p.x}
            cy={p.y}
            r={hoveredIdx === i ? 7 : 5}
            fill={p.regression_flagged ? 'var(--error)' : 'var(--accent)'}
            stroke="var(--card)"
            strokeWidth={2}
            className="cursor-pointer"
            style={{ transition: 'r 0.15s ease' }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8 + i * 0.08, duration: 0.3 }}
            onPointerEnter={(e) => handlePointerEnter(i, e)}
            onPointerMove={handlePointerMove}
            onPointerLeave={() => setHoveredIdx(null)}
          />
        ))}
      </svg>

      {/* ── floating tooltip ── */}
      {hoveredIdx !== null && (
        <div
          className="absolute z-50 pointer-events-none bg-popover border border-border
            rounded-lg shadow-lg px-3 py-2.5 text-xs space-y-1 min-w-[160px]"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y,
            transform: 'translate(-50%, -110%)',
          }}
        >
          <p className="font-semibold text-foreground">
            {new Date(data[hoveredIdx].date).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
          <p className="text-muted-foreground">
            Score:{' '}
            <span className="text-foreground font-bold">
              {data[hoveredIdx].avg_score.toFixed(2)}
            </span>
          </p>
          <p className="text-muted-foreground">
            Pass Rate:{' '}
            <span className="text-foreground font-bold">
              {data[hoveredIdx].pass_rate.toFixed(1)}%
            </span>
          </p>
          {data[hoveredIdx].regression_flagged && (
            <p className="text-error font-semibold flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-error" />
              Regression Detected
            </p>
          )}
        </div>
      )}
    </div>
  )
}