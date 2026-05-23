'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description: string
  action?: { label: string; href: string }
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="bg-card rounded-xl border border-border py-16 px-6 flex flex-col items-center justify-center text-center"
    >
      {icon && (
        <div className="mb-5 text-muted-foreground/30 [&>svg]:w-12 [&>svg]:h-12">
          {icon}
        </div>
      )}

      <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>

      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        {description}
      </p>

      {action && (
        <Link
          href={action.href}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
            bg-accent text-accent-foreground hover:opacity-90
            transition-opacity duration-150 focus-ring"
        >
          {action.label}
        </Link>
      )}
    </motion.div>
  )
}
