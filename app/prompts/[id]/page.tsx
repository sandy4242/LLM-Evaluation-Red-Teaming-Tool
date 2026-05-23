'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Prompt, PromptVersion } from '@/types'
import Badge from '@/components/ui/Badge'
import { SkeletonBlock } from '@/components/ui/SkeletonLoader'

type PromptWithVersions = Prompt & { versions: PromptVersion[] }

const timelineVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
} as const

const timelineItemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
} as const

function relativeDate(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor(diff / 3600000)
  const minutes = Math.floor(diff / 60000)

  if (days > 30) return new Date(dateStr).toLocaleDateString()
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'just now'
}

export default function PromptDetailPage() {
  const { id } = useParams()
  const [prompt, setPrompt] = useState<PromptWithVersions | null>(null)
  const [editing, setEditing] = useState(false)
  const [systemPrompt, setSystemPrompt] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function fetchPrompt() {
    try {
      const res = await fetch(`/api/prompts/${id}`)
      if (!res.ok) throw new Error('Prompt not found')
      const data = await res.json()
      setPrompt(data)
      setSystemPrompt(data.system_prompt)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load prompt')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPrompt()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/prompts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system_prompt: systemPrompt }),
      })

      if (!res.ok) throw new Error('Failed to save')

      const data = await res.json()
      setPrompt(prev => (prev ? { ...prev, ...data } : null))
      setEditing(false)
      toast.success('Version created successfully')

      // Refetch to get updated version list
      await fetchPrompt()
    } catch {
      toast.error('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div className="space-y-2">
          <div className="skeleton h-8 w-2/5 rounded-lg" />
          <div className="skeleton h-4 w-24 rounded" />
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="skeleton h-4 w-28 rounded mb-4" />
          <SkeletonBlock lines={5} />
        </div>
        <div>
          <div className="skeleton h-5 w-32 rounded mb-4" />
          <div className="space-y-3">
            <div className="skeleton h-12 w-full rounded-lg" />
            <div className="skeleton h-12 w-full rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !prompt) {
    return (
      <div className="text-center py-20 bg-card border border-border rounded-xl">
        <div className="w-12 h-12 rounded-xl bg-error-muted border border-error/15 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
        </div>
        <h3 className="text-base font-bold text-foreground">
          {error || 'Prompt not found'}
        </h3>
        <Link
          href="/prompts"
          className="mt-4 inline-block text-sm text-accent hover:underline font-semibold"
        >
          ← Back to prompts
        </Link>
      </div>
    )
  }

  const maxVersion = prompt.versions?.length
    ? Math.max(...prompt.versions.map(v => v.version_no))
    : 0

  return (
    <motion.div
      className="space-y-8 max-w-3xl"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            {prompt.name}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {prompt.versions?.length ?? 1} version
            {(prompt.versions?.length ?? 1) !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link
            href={`/test-suites/new?prompt_id=${id}`}
            className="text-sm border border-border text-foreground bg-card font-semibold
              px-4 py-2 rounded-lg hover:bg-muted active:scale-95 transition-all shadow-sm
              flex items-center gap-1"
          >
            + Test Suite
          </Link>
          <button
            onClick={() => setEditing(!editing)}
            className="text-sm bg-primary text-primary-foreground font-semibold px-4 py-2
              rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-sm"
          >
            {editing ? 'Cancel' : 'Edit Prompt'}
          </button>
        </div>
      </div>

      {/* System Prompt Display */}
      <div className="space-y-2">
        <label className="block text-sm font-bold text-foreground">
          System Prompt
        </label>

        {editing ? (
          <div className="space-y-3">
            <textarea
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              rows={10}
              className="w-full bg-input border border-border text-foreground rounded-xl px-5 py-4
                text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono leading-relaxed
                transition-all resize-y"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-mono">
                {systemPrompt.length} characters
              </span>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg
                  text-sm font-semibold hover:opacity-90 active:scale-95 transition-all
                  disabled:opacity-50 shadow-sm flex items-center gap-2"
              >
                {saving && (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {saving ? 'Saving...' : 'Save — creates new version'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-muted/20 border border-border rounded-xl p-5">
            <pre className="font-mono text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {prompt.system_prompt}
            </pre>
          </div>
        )}
      </div>

      {/* Variables */}
      {prompt.variables?.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-bold text-foreground">
            Variables
          </label>
          <div className="flex gap-1.5 flex-wrap">
            {prompt.variables.map((v: string) => (
              <Badge key={v} variant="info">
                {`{{${v}}}`}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Version History — Timeline */}
      {prompt.versions && prompt.versions.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-foreground tracking-tight mb-5">
            Version History
          </h2>

          <motion.div
            className="relative pl-6"
            variants={timelineVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Vertical line */}
            <div className="absolute left-[7px] top-1 bottom-1 border-l-2 border-border" />

            <div className="space-y-5">
              {prompt.versions.map(version => (
                <motion.div
                  key={version.id}
                  variants={timelineItemVariants}
                  className="relative flex items-start gap-4"
                >
                  {/* Dot */}
                  <div
                    className={`absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 shrink-0
                      ${
                        version.version_no === maxVersion
                          ? 'bg-accent border-accent'
                          : 'bg-card border-border'
                      }`}
                  />

                  {/* Content */}
                  <div className="flex items-center justify-between w-full bg-card rounded-lg border border-border px-4 py-3 hover:border-accent/40 transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-foreground">
                        Version {version.version_no}
                      </span>
                      {version.version_no === maxVersion && (
                        <Badge variant="success">Latest</Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">
                      {relativeDate(version.created_at)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}