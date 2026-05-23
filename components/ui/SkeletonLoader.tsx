export function SkeletonCard() {
  return (
    <div className="bg-card border border-border rounded-xl p-6 h-32">
      <div className="skeleton h-3 w-24 mb-4 rounded" />
      <div className="skeleton h-6 w-32 mb-3 rounded" />
      <div className="skeleton h-3 w-20 rounded" />
    </div>
  )
}

export function SkeletonTableRow() {
  return (
    <tr>
      <td className="py-3 px-4">
        <div className="skeleton h-4 w-28 rounded" />
      </td>
      <td className="py-3 px-4">
        <div className="skeleton h-4 w-40 rounded" />
      </td>
      <td className="py-3 px-4">
        <div className="skeleton h-4 w-16 rounded" />
      </td>
      <td className="py-3 px-4">
        <div className="skeleton h-4 w-20 rounded" />
      </td>
      <td className="py-3 px-4">
        <div className="skeleton h-4 w-12 rounded" />
      </td>
    </tr>
  )
}

export function SkeletonStat() {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      {/* Top accent bar placeholder */}
      <div className="skeleton h-[2px] w-full mb-4 rounded" />
      {/* Label placeholder */}
      <div className="skeleton h-2.5 w-20 mb-3 rounded" />
      {/* Value placeholder */}
      <div className="skeleton h-8 w-28 mb-2 rounded" />
      {/* Delta placeholder */}
      <div className="skeleton h-3 w-14 rounded" />
    </div>
  )
}

export function SkeletonChart() {
  return (
    <div className="bg-card border border-border rounded-xl p-6 h-48 flex flex-col">
      {/* Title bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="skeleton h-4 w-32 rounded" />
        <div className="skeleton h-4 w-16 rounded" />
      </div>
      {/* Chart area */}
      <div className="skeleton flex-1 rounded-lg" />
    </div>
  )
}

export function SkeletonBlock({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton h-3 rounded"
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  )
}

