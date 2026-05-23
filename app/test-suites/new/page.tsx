'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Prompt } from '@/types'

const SCORING_METHODS = [
  { value: 'exact_match', label: 'Exact Match' },
  { value: 'llm_judge', label: 'LLM Judge' },
  { value: 'custom_assertion', label: 'Custom Assertion' }
]

interface TestCaseForm {
  input: string
  expected_output: string
  scoring_method: string
  scoring_config: string
}

function NewTestSuiteForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedPromptId = searchParams.get('prompt_id') ?? ''

  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [promptId, setPromptId] = useState(preselectedPromptId)
  const [suiteName, setSuiteName] = useState('')
  const [testCases, setTestCases] = useState<TestCaseForm[]>([
    { input: '', expected_output: '', scoring_method: 'llm_judge',
      scoring_config: '{"rubric": "Score based on accuracy and relevance"}' }
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/prompts')
      .then(r => r.json())
      .then(setPrompts)
  }, [])

  function addTestCase() {
    setTestCases(prev => [...prev, {
      input: '',
      expected_output: '',
      scoring_method: 'llm_judge',
      scoring_config: '{"rubric": "Score based on accuracy and relevance"}'
    }])
  }

  function removeTestCase(index: number) {
    setTestCases(prev => prev.filter((_, i) => i !== index))
  }

  function updateTestCase(
    index: number,
    field: keyof TestCaseForm,
    value: string
  ) {
    setTestCases(prev => prev.map((tc, i) =>
      i === index ? { ...tc, [field]: value } : tc
    ))
  }

  async function handleSubmit() {
    if (!promptId || !suiteName) {
      setError('Prompt and suite name are required')
      return
    }
    if (testCases.some(tc => !tc.input)) {
      setError('All test cases must have an input')
      return
    }

    setLoading(true)
    setError('')

    // Create suite
    const suiteRes = await fetch('/api/test-suites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt_id: promptId, name: suiteName })
    })
    const suite = await suiteRes.json()

    if (!suiteRes.ok) {
      setError(suite.error ?? 'Failed to create suite')
      setLoading(false)
      return
    }

    // Create test cases
    for (const tc of testCases) {
      let config = {}
      try { config = JSON.parse(tc.scoring_config) } catch {}

      await fetch('/api/test-cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suite_id: suite.id,
          input: tc.input,
          expected_output: tc.expected_output,
          scoring_method: tc.scoring_method,
          scoring_config: config
        })
      })
    }

    router.push(`/test-suites/${suite.id}`)
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">New Test Suite</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Create a collection of test cases for a prompt
        </p>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-bold text-foreground mb-1.5">
            Prompt
          </label>
          <select
            value={promptId}
            onChange={e => setPromptId(e.target.value)}
            className="w-full bg-background border border-border text-foreground rounded-lg px-3 py-2
              text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all"
          >
            <option value="">Select a prompt...</option>
            {prompts.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-foreground mb-1.5">
            Suite Name
          </label>
          <input
            value={suiteName}
            onChange={e => setSuiteName(e.target.value)}
            placeholder="e.g. Edge Cases v1"
            className="w-full bg-background border border-border text-foreground rounded-lg px-3 py-2
              text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all"
          />
        </div>
      </div>

      {/* Test cases */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground tracking-tight">
            Test Cases
          </h2>
          <button
            onClick={addTestCase}
            className="text-sm text-accent hover:underline font-bold"
          >
            + Add Test Case
          </button>
        </div>

        {testCases.map((tc, index) => (
          <div key={index}
            className="bg-card rounded-xl border border-border p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">
                Test Case {index + 1}
              </span>
              {testCases.length > 1 && (
                <button
                  onClick={() => removeTestCase(index)}
                  className="text-xs text-error hover:underline font-bold"
                >
                  Remove
                </button>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">
                Input (user message)
              </label>
              <textarea
                value={tc.input}
                onChange={e => updateTestCase(index, 'input', e.target.value)}
                rows={3}
                placeholder="What is the return policy?"
                className="w-full bg-background border border-border text-foreground rounded-lg px-3 py-2
                  text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">
                Expected Output (optional)
              </label>
              <input
                value={tc.expected_output}
                onChange={e =>
                  updateTestCase(index, 'expected_output', e.target.value)}
                placeholder="Should mention 30-day return window"
                className="w-full bg-background border border-border text-foreground rounded-lg px-3 py-2
                  text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">
                  Scoring Method
                </label>
                <select
                  value={tc.scoring_method}
                  onChange={e =>
                    updateTestCase(index, 'scoring_method', e.target.value)}
                  className="w-full bg-background border border-border text-foreground rounded-lg px-3
                    py-2 text-sm focus:outline-none focus:ring-2
                    focus:ring-accent transition-all"
                >
                  {SCORING_METHODS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">
                  Scoring Config (JSON)
                </label>
                <input
                  value={tc.scoring_config}
                  onChange={e =>
                    updateTestCase(index, 'scoring_config', e.target.value)}
                  placeholder='{"rubric": "..."}'
                  className="w-full bg-background border border-border text-foreground rounded-lg px-3
                    py-2 text-sm font-mono focus:outline-none focus:ring-2
                    focus:ring-accent transition-all"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p className="text-sm text-error bg-error-muted border border-error/20 px-3 py-2 rounded-lg font-medium">
          {error}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm
          font-bold hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all shadow-sm"
      >
        {loading ? 'Creating...' : 'Create Test Suite'}
      </button>
    </div>
  )
}

export default function NewTestSuitePage() {
  return (
    <Suspense fallback={
      <div className="text-center py-16 bg-card border border-border rounded-xl text-muted-foreground animate-pulse text-sm font-semibold">
        Loading test suite creator...
      </div>
    }>
      <NewTestSuiteForm />
    </Suspense>
  )
}