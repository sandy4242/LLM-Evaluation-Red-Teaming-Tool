'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Prompt } from '@/types'
import { SkeletonCard } from '@/components/ui/SkeletonLoader'
import EmptyState from '@/components/ui/EmptyState'
import Badge from '@/components/ui/Badge'

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 30) return new Date(dateStr).toLocaleDateString()
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'just now'
}

function getPreviewLines(text: string, maxLines = 2): string {
  return text.split('\n').slice(0, maxLines).join('\n')
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07 },
  },
} as const

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
} as const

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/prompts')
      .then(r => {
        if (!r.ok) throw new Error('Failed to load prompts')
        return r.json()
      })
      .then(data => {
        setPrompts(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            Prompts
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your system prompts and versions
          </p>
        </div>
        <Link
          href="/prompts/new"
          className="bg-primary text-primary-foreground px-4 py-2.5 rounded-lg
            text-sm font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm"
        >
          + New Prompt
        </Link>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="grid gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <p className="text-sm text-error font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 text-sm text-accent hover:underline font-semibold"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && prompts.length === 0 && (
        <EmptyState
          title="No prompts yet"
          description="Create your first system prompt to start evaluating LLM outputs with test suites and scoring."
          action={{ label: '+ Create Prompt', href: '/prompts/new' }}
        />
      )}

      {/* Cards */}
      {!loading && !error && prompts.length > 0 && (
        <motion.div
          className="grid gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {prompts.map(prompt => (
            <motion.div key={prompt.id} variants={cardVariants}>
              <Link
                href={`/prompts/${prompt.id}`}
                className="bg-card rounded-xl border border-border p-6 card-hover block group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3 flex-1 min-w-0">
                    {/* Prompt name */}
                    <h3 className="font-bold text-foreground group-hover:text-accent transition-colors">
                      {prompt.name}
                    </h3>

                    {/* System prompt code preview */}
                    <pre className="font-mono text-xs text-muted-foreground bg-muted/30 rounded-lg p-3 border border-border/60 whitespace-pre-wrap line-clamp-2 leading-relaxed">
                      {getPreviewLines(prompt.system_prompt)}
                    </pre>

                    {/* Variable badges */}
                    {prompt.variables?.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap">
                        {prompt.variables.map((v: string) => (
                          <Badge key={v} variant="info">
                            {`{{${v}}}`}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Relative date */}
                  <span className="text-xs text-muted-foreground/60 whitespace-nowrap font-medium shrink-0">
                    {relativeTime(prompt.created_at)}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}