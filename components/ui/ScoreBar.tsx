interface ScoreBarProps {
  score: number      // 1-5
  showLabel?: boolean
}

export default function ScoreBar({ score, showLabel = true }: ScoreBarProps) {
  const percentage = (score / 5) * 100

  const color =
    score >= 4 ? 'bg-success'
    : score === 3 ? 'bg-warning'
    : 'bg-error'

  const label =
    score >= 4 ? 'Good'
    : score === 3 ? 'Partial'
    : 'Poor'

  return (
    <div className="flex items-center gap-3 w-full">
      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden border border-border/10">
        <div
          className={`${color} h-full rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-semibold text-muted-foreground w-20 shrink-0">
          {score}/5 · {label}
        </span>
      )}
    </div>
  )

}