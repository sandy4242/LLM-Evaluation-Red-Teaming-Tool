'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string | number
  delta?: { value: number; positive: boolean }
  icon?: ReactNode
  children?: ReactNode
}

export default function StatCard({
  label,
  value,
  delta,
  icon,
  children,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="group relative bg-card border border-border rounded-xl p-6 shadow-sm
        hover:shadow-md transition-all duration-200 overflow-hidden"
    >
      {/* Top accent bar */}
      <div
        className="absolute top-0 inset-x-0 h-[2px] bg-muted
          group-hover:bg-accent transition-colors duration-300"
      />

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Label */}
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-2 truncate">
            {label}
          </p>

          {/* Animated value */}
          <motion.span
            key={String(value)}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="block text-3xl font-extrabold tracking-tight text-foreground"
          >
            {value}
          </motion.span>

          {/* Delta indicator */}
          {delta && (
            <span
              className={`inline-flex items-center gap-0.5 mt-2 text-xs font-semibold ${
                delta.positive ? 'text-success' : 'text-error'
              }`}
            >
              <span className="text-[11px]">
                {delta.positive ? '↑' : '↓'}
              </span>
              {Math.abs(delta.value)}%
            </span>
          )}
        </div>

        {/* Icon */}
        {icon && (
          <div className="shrink-0 text-muted-foreground/50 group-hover:text-accent transition-colors duration-200">
            {icon}
          </div>
        )}
      </div>

      {/* Sparkline slot */}
      {children && <div className="mt-4">{children}</div>}
    </motion.div>
  )
}
