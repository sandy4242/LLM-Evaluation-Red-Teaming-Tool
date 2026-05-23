'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function TestSuiteDetailPage() {
  const { id } = useParams()
  const [suite, setSuite] = useState<any>(null)
  const [versions, setVersions] = useState<any[]>([])
  const [selectedVersion, setSelectedVersion] = useState('')
  const [model, setModel] = useState('gemini-1.5-pro')
  const [running, setRunning] = useState(false)
  const [runResult, setRunResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/test-suites/${id}`)
      .then(r => r.json())
      .then(async data => {
        setSuite(data)
        setLoading(false)

        // Fetch prompt versions
        const vRes = await fetch(`/api/prompts/${data.prompts?.id}`)
        const vData = await vRes.json()
        setVersions(vData.versions ?? [])
        if (vData.versions?.length) {
          setSelectedVersion(vData.versions[0].id)
        }
      })
  }, [id])

  async function handleRun() {
    if (!selectedVersion) return
    setRunning(true)
    setRunResult(null)

    const res = await fetch('/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        suite_id: id,
        model,
        prompt_version_id: selectedVersion
      })
    })

    const data = await res.json()
    setRunResult(data)
    setRunning(false)
  }

  if (loading) return (
    <div className="text-center py-16 bg-card border border-border rounded-xl text-muted-foreground animate-pulse text-sm font-semibold">
      Loading test suite...
    </div>
  )
  if (!suite) return (
    <div className="text-center py-16 bg-card border border-border rounded-xl text-muted-foreground text-sm font-medium">
      Suite not found
    </div>
  )

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">{suite.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Prompt: <span className="font-semibold text-foreground/80">{suite.prompts?.name}</span> ·{' '}
            <span className="font-semibold text-foreground/80">{suite.test_cases?.length ?? 0}</span> test cases
          </p>
        </div>
      </div>

      {/* Run controls */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">
          Run Suite
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end">
          <div className="flex-1">
            <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">
              Prompt Version
            </label>
            <select
              value={selectedVersion}
              onChange={e => setSelectedVersion(e.target.value)}
              className="w-full bg-background border border-border text-foreground rounded-lg px-3 py-2
                text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all"
            >
              {versions.map(v => (
                <option key={v.id} value={v.id}>
                  Version {v.version_no}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">Model</label>
            <select
              value={model}
              onChange={e => setModel(e.target.value)}
              className="w-full bg-background border border-border text-foreground rounded-lg px-3 py-2
                text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all"
            >
              <option value="gemini-1.5-pro">gemini-1.5-pro</option>
              <option value="gemini-1.5-flash">gemini-1.5-flash</option>
              <option value="gemini-2.0-flash">gemini-2.0-flash</option>
            </select>
          </div>

          <button
            onClick={handleRun}
            disabled={running || !selectedVersion}
            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm
              font-semibold hover:opacity-90 active:scale-95 disabled:opacity-50
              transition-all shadow-sm whitespace-nowrap flex items-center justify-center gap-1.5"
          >
            {running ? 'Running...' : '▶ Run Now'}
          </button>
        </div>

        {/* Run result summary */}
        {runResult && (
          <div className="mt-5 p-4 bg-muted/40 border border-border/80 rounded-lg">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-sm font-bold text-foreground flex items-center gap-1">
                ✓ Run complete
              </span>
              <span className="text-sm text-success font-semibold">
                {runResult.pass_count} passed
              </span>
              <span className="text-sm text-error font-semibold">
                {runResult.fail_count} failed
              </span>
              <span className="text-sm text-muted-foreground font-medium">
                Avg score: <span className="font-bold text-foreground">{runResult.avg_score?.toFixed(2)}</span>
              </span>
              {runResult.regression_flagged && (
                <span className="text-[10px] px-2 py-0.5 bg-error-muted text-error border border-error/15
                  rounded-md font-bold tracking-wide">
                  ⚠ Regression Detected
                </span>
              )}
              <Link
                href={`/runs/${runResult.run_id}`}
                className="text-sm text-accent hover:underline font-semibold ml-auto"
              >
                View full results →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Test cases */}
      <div>
        <h2 className="text-lg font-bold text-foreground tracking-tight mb-3">
          Test Cases
        </h2>
        <div className="space-y-3">
          {suite.test_cases?.map((tc: any, index: number) => (
            <div key={tc.id}
              className="bg-card rounded-xl border border-border p-5 shadow-sm hover:border-accent/35 transition-all duration-300">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground/60 font-bold">
                      #{index + 1}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-muted
                      text-muted-foreground rounded font-mono font-semibold tracking-wide border border-border/80 uppercase">
                      {tc.scoring_method}
                    </span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed font-medium">{tc.input}</p>
                  {tc.expected_output && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <span className="font-semibold">Expected:</span> {tc.expected_output}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}