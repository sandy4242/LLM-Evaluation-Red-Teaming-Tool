import { RunResult } from '@/types'
import ScoreBar from './ScoreBar'

interface RunResultsTableProps {
  results: (RunResult & {
    test_cases: {
      input: string
      expected_output: string
      scoring_method: string
    }
  })[]
}

export default function RunResultsTable({ results }: RunResultsTableProps) {
  if (!results.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        No results found for this run.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border font-bold">
          <tr>
            <th className="px-5 py-3 text-left w-12">#</th>
            <th className="px-5 py-3 text-left">Input</th>
            <th className="px-5 py-3 text-left">Output</th>
            <th className="px-5 py-3 text-left">Method</th>
            <th className="px-5 py-3 text-left">Score</th>
            <th className="px-5 py-3 text-left">Status</th>
            <th className="px-5 py-3 text-left">Explanation</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {results.map((result, index) => (
            <tr
              key={result.id}
              className={`transition-colors ${result.passed ? 'hover:bg-muted/20' : 'bg-error-muted/20 hover:bg-error-muted/30'}`}
            >
              <td className="px-5 py-4 text-muted-foreground/70 font-mono text-xs">{index + 1}</td>
              <td className="px-5 py-4 max-w-[200px]">
                <p className="truncate text-foreground font-medium text-xs" title={result.test_cases?.input}>
                  {result.test_cases?.input}
                </p>
              </td>
              <td className="px-5 py-4 max-w-[220px]">
                <p className="truncate text-muted-foreground text-xs" title={result.output}>{result.output}</p>
              </td>
              <td className="px-5 py-4">
                <span className="px-2 py-0.5 rounded bg-muted border border-border text-muted-foreground
                  text-[10px] font-semibold font-mono uppercase tracking-wider">
                  {result.test_cases?.scoring_method?.replace('_', ' ')}
                </span>
              </td>
              <td className="px-5 py-4 w-40">
                <ScoreBar score={result.score} showLabel={false} />
                <span className="text-[10px] text-muted-foreground mt-1 block font-semibold">
                  {result.score?.toFixed(1)} / 5.0
                </span>
              </td>
              <td className="px-5 py-4">
                {result.passed ? (
                  <span className="text-success font-semibold text-xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
                    Passed
                  </span>
                ) : (
                  <span className="text-error font-semibold text-xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-error inline-block" />
                    Failed
                  </span>
                )}
                {result.flags?.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {result.flags.map(flag => (
                      <span
                        key={flag}
                        className="text-[10px] font-medium px-1.5 py-0.5 bg-warning-muted
                          text-warning rounded border border-warning/15"
                      >
                        {flag}
                      </span>
                    ))}
                  </div>
                )}
              </td>
              <td className="px-5 py-4 max-w-[200px]">
                <p className="text-xs text-muted-foreground/90 line-clamp-2 leading-relaxed" title={result.explanation}>
                  {result.explanation}
                </p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

}