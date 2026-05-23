'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewPromptPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [variables, setVariables] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!name || !systemPrompt) {
      setError('Name and system prompt are required')
      return
    }

    setLoading(true)
    setError('')

    const res = await fetch('/api/prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        system_prompt: systemPrompt,
        variables: variables
          ? variables.split(',').map(v => v.trim()).filter(Boolean)
          : []
      })
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Failed to create prompt')
      return
    }

    router.push(`/prompts/${data.id}`)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">New Prompt</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Create a new system prompt to evaluate
        </p>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 shadow-sm space-y-5">
        <div>
          <label className="block text-sm font-bold text-foreground mb-1.5">
            Prompt Name
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Customer Support Agent"
            className="w-full bg-background border border-border text-foreground rounded-lg px-3 py-2
              text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-foreground mb-1.5">
            System Prompt
          </label>
          <textarea
            value={systemPrompt}
            onChange={e => setSystemPrompt(e.target.value)}
            placeholder="You are a helpful customer support agent..."
            rows={8}
            className="w-full bg-background border border-border text-foreground rounded-lg px-3 py-2
              text-sm focus:outline-none focus:ring-2 focus:ring-accent font-mono transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-foreground mb-1.5">
            Variables
            <span className="text-muted-foreground/60 font-normal ml-1 text-xs">
              (optional, comma separated)
            </span>
          </label>
          <input
            value={variables}
            onChange={e => setVariables(e.target.value)}
            placeholder="topic, language, tone"
            className="w-full bg-background border border-border text-foreground rounded-lg px-3 py-2
              text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all"
          />
          <p className="text-xs text-muted-foreground/60 mt-1.5 font-medium">
            Use these in your prompt as {`{{variable}}`}
          </p>
        </div>

        {error && (
          <p className="text-sm text-error bg-error-muted border border-error/20 px-3 py-2 rounded-lg font-medium">
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg
            text-sm font-semibold hover:opacity-90 active:scale-95 disabled:opacity-50
            transition-all shadow-sm"
        >
          {loading ? 'Creating...' : 'Create Prompt'}
        </button>
      </div>
    </div>
  )
}