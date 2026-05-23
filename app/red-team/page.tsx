'use client'

import { useEffect, useState } from 'react'
import ScoreBar from '@/components/ui/ScoreBar'

export default function RedTeamPage() {
  const [suites, setSuites] = useState<any[]>([])
  const [suiteId, setSuiteId] = useState('')
  const [input, setInput] = useState('')
  const [model, setModel] = useState('gemini-2.0-flash')
  const [runId, setRunId] = useState('')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/runs')
      .then(r => r.json())
      .then(setSuites)
  }, [])

  async function handleRun() {
    if (!input || !runId) {
      setError('Please provide an input and select a run')
      return
    }

    setRunning(true)
    setError('')
    setResult(null)

    // Get system prompt from run
    const runRes = await fetch(`/api/runs/${runId}`)
    const runData = await runRes.json()
    const systemPrompt = runData.prompt_versions?.system_prompt

    if (!systemPrompt) {
      setError('Could not fetch system prompt for this run')
      setRunning(false)
      return
    }

    const res = await fetch('/api/red-team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        run_id: runId,
        original_input: input,
        system_prompt: systemPrompt,
        model
      })
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Red team run failed')
    } else {
      setResult(data)
    }
    setRunning(false)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Red Team Mode</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Auto-generate adversarial inputs and stress-test your prompt
        </p>
      </div>

      {/* Controls */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm space-y-5">
        <div>
          <label className="block text-sm font-bold text-foreground mb-1.5">
            Select Run (provides system prompt context)
          </label>
          <select
            value={runId}
            onChange={e => setRunId(e.target.value)}
            className="w-full bg-background border border-border text-foreground rounded-lg px-3 py-2
              text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all"
          >
            <option value="">Select a run...</option>
            {suites.map((r: any) => (
              <option key={r.id} value={r.id}>
                {r.test_suites?.name} — {r.model} —{' '}
                {new Date(r.created_at).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-foreground mb-1.5">
            Original Input to Attack
          </label>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            rows={3}
            placeholder="Enter the user input you want to red-team..."
            className="w-full bg-background border border-border text-foreground rounded-lg px-3 py-2
              text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end">
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">Model</label>
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
            disabled={running}
            className="bg-red-500 text-white px-6 py-2.5 rounded-lg text-sm
              font-bold hover:bg-red-600 active:scale-95 disabled:opacity-50
              transition-all shadow-sm whitespace-nowrap flex items-center justify-center"
          >
            {running ? 'Running...' : '⚡ Run Red Team'}
          </button>
        </div>

        {error && (
          <p className="text-sm text-error bg-error-muted border border-error/20 px-3 py-2 rounded-lg font-medium">
            {error}
          </p>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <h2 className="text-lg font-bold text-foreground tracking-tight mb-4">
              Summary
            </h2>
            <div className="flex gap-8 mb-4">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Pass Rate</p>
                <p className={`text-3xl font-extrabold mt-1 tracking-tight ${
                  result.pass_rate >= 70
                    ? 'text-success'
                    : result.pass_rate >= 40
                    ? 'text-warning'
                    : 'text-error'
                }`}>
                  {result.pass_rate}%
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Most Vulnerable</p>
                <p className="text-lg font-extrabold text-error mt-2 tracking-tight">
                  {result.worst_type}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Variations Tested</p>
                <p className="text-3xl font-extrabold text-foreground mt-1 tracking-tight">
                  {result.total_variations}
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground bg-muted/30 border border-border/60 rounded-xl p-4 leading-relaxed">
              {result.summary}
            </p>
          </div>

          {/* By type breakdown */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">
              Results by Attack Type
            </h2>
            <div className="space-y-1">
              {Object.entries(result.summary_by_type).map(
                ([type, stats]: [string, any]) => (
                  <div key={type}
                    className="flex items-center justify-between
                      py-3 border-b border-border/60 last:border-0">
                    <span className="text-xs text-foreground font-mono font-semibold">
                      {type}
                    </span>
                    <span className={`text-sm font-bold ${
                      stats.passed === stats.total
                        ? 'text-success'
                        : stats.passed === 0
                        ? 'text-error'
                        : 'text-warning'
                    }`}>
                      {stats.passed}/{stats.total} passed
                    </span>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Per variation results */}
          <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border font-bold">
                  <tr>
                    <th className="px-5 py-3 text-left">Type</th>
                    <th className="px-5 py-3 text-left">Input</th>
                    <th className="px-5 py-3 text-left">Output</th>
                    <th className="px-5 py-3 text-left">Score</th>
                    <th className="px-5 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {result.results.map((r: any, i: number) => (
                    <tr key={i}
                      className={`transition-colors duration-200 ${
                        r.passed ? 'hover:bg-muted/20' : 'bg-error-muted hover:bg-error-muted/80'
                      }`}>
                      <td className="px-5 py-4">
                        <span className="font-mono text-[10px] bg-muted border border-border/80
                          px-2 py-0.5 rounded text-muted-foreground font-semibold uppercase tracking-wider">
                          {r.type}
                        </span>
                      </td>
                      <td className="px-5 py-4 max-w-[200px]">
                        <p className="text-xs text-foreground font-semibold truncate">
                          {r.input}
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-0.5 italic truncate font-medium">
                          {r.intent}
                        </p>
                      </td>
                      <td className="px-5 py-4 max-w-[200px]">
                        <p className="text-xs text-muted-foreground leading-relaxed truncate font-medium">
                          {r.output}
                        </p>
                      </td>
                      <td className="px-5 py-4 w-36">
                        <ScoreBar score={r.score} showLabel={false} />
                        <span className="text-[10px] text-muted-foreground mt-1 block font-semibold">
                          {r.score?.toFixed(2)} / 5.00
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {r.passed ? (
                          <span className="text-success font-bold text-xs flex items-center gap-1">
                            ✓ Pass
                          </span>
                        ) : (
                          <span className="text-error font-bold text-xs flex items-center gap-1">
                            ✗ Fail
                          </span>
                        )}
                        {r.flags?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {r.flags.map((f: string) => (
                              <span key={f}
                                className="text-[10px] bg-warning-muted text-warning border border-warning/15
                                  font-bold px-1.5 py-0.5 rounded">
                                {f}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}