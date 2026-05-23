interface RegressionBadgeProps {
  flagged: boolean
  oldScore?: number
  newScore?: number
}

export default function RegressionBadge({
  flagged,
  oldScore,
  newScore
}: RegressionBadgeProps) {
  if (!flagged) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
        text-xs font-semibold bg-success-muted text-success border border-success/15 select-none transition-all duration-200">
        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
        No Regression
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
      text-xs font-semibold bg-error-muted text-error border border-error/15 select-none transition-all duration-200">
      <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse" />
      Regression Detected
      {oldScore !== undefined && newScore !== undefined && (
        <span className="ml-1 opacity-80 font-mono text-[10px]">
          ({oldScore.toFixed(1)} → {newScore.toFixed(1)})
        </span>
      )}
    </span>
  )

}