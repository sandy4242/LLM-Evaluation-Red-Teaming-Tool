'use client'

import { useEffect, useState } from 'react'
import ModelCompareTable from '@/components/ui/ModelCompareTable'

const MODELS = [
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-2.0-flash'
]

export default function ComparePage() {
  const [suites, setSuites] = useState<any[]>([])
  const [suiteId, setSuiteId] = useState('')
  const [versions, setVersions] = useState<any[]>([])
  const [versionId, setVersionId] = useState('')
  const [modelA, setModelA] = useState('gemini-1.5-pro')
  const [modelB, setModelB] = useState('gemini-1.5-flash')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/test-suites')
      .then(r => r.json())
      .then(setSuites)
  }, [])

  async function handleSuiteChange(id: string) {
    setSuiteId(id)
    setVersionId('')
    setVersions([])
    if (!id) return

    const suite = suites.find(s => s.id === id)
    if (!suite?.prompts?.id) return

    const res = await fetch(`/api/prompts/${suite.prompts.id}`)
    const data = await res.json()
    setVersions(data.versions ?? [])
    if (data.versions?.length) setVersionId(data.versions[0].id)
  }

  async function handleRun() {
    if (!suiteId || !versionId || modelA === modelB) {
      setError(
        modelA === modelB
          ? 'Please select two different models'
          : 'Suite and version are required'
      )
      return
    }

    setRunning(true)
    setError('')
    setResult(null)

    const res = await fetch('/api/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        suite_id: suiteId,
        prompt_version_id: versionId,
        model_a: modelA,
        model_b: modelB
      })
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Comparison failed')
    } else {
      setResult(data)
    }
    setRunning(false)
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
          Multi-Model Comparison
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Run the same test suite against two models side by side
        </p>
      </div>

      {/* Controls */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-bold text-foreground mb-1.5">
              Test Suite
            </label>
            <select
              value={suiteId}
              onChange={e => handleSuiteChange(e.target.value)}
              className="w-full bg-background border border-border text-foreground rounded-lg px-3 py-2
                text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all"
            >
              <option value="">Select a suite...</option>
              {suites.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-foreground mb-1.5">
              Prompt Version
            </label>
            <select
              value={versionId}
              onChange={e => setVersionId(e.target.value)}
              disabled={!versions.length}
              className="w-full bg-background border border-border text-foreground rounded-lg px-3 py-2
                text-sm focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 transition-all"
            >
              {versions.map(v => (
                <option key={v.id} value={v.id}>
                  Version {v.version_no}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-foreground mb-1.5">
              Model A
            </label>
            <select
              value={modelA}
              onChange={e => setModelA(e.target.value)}
              className="w-full bg-background border border-border text-foreground rounded-lg px-3 py-2
                text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all"
            >
              {MODELS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-foreground mb-1.5">
              Model B
            </label>
            <select
              value={modelB}
              onChange={e => setModelB(e.target.value)}
              className="w-full bg-background border border-border text-foreground rounded-lg px-3 py-2
                text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all"
            >
              {MODELS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <p className="text-sm text-error bg-error-muted border border-error/20 px-3 py-2 rounded-lg font-medium">
            {error}
          </p>
        )}

        <button
          onClick={handleRun}
          disabled={running}
          className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm
            font-bold hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all shadow-sm"
        >
          {running ? 'Running comparison...' : '⚡ Compare Models'}
        </button>
      </div>

      {/* Results */}
      {result && (
        <ModelCompareTable
          summary={result.summary}
          results={result.per_case_results}
        />
      )}
    </div>
  )
}