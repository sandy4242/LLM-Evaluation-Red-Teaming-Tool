import { useMemo } from 'react'

interface SparklineProps {
  data: number[]
  color?: string
  width?: number
  height?: number
  showArea?: boolean
}

export default function Sparkline({
  data,
  color = 'var(--accent)',
  width = 80,
  height = 32,
  showArea = true,
}: SparklineProps) {
  const points = useMemo(() => {
    if (data.length < 2) return ''

    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1
    const padding = 1

    return data
      .map((val, i) => {
        const x = padding + (i / (data.length - 1)) * (width - padding * 2)
        const y = padding + (1 - (val - min) / range) * (height - padding * 2)
        return `${x},${y}`
      })
      .join(' ')
  }, [data, width, height])

  const areaPath = useMemo(() => {
    if (data.length < 2) return ''

    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1
    const padding = 1

    const coords = data.map((val, i) => {
      const x = padding + (i / (data.length - 1)) * (width - padding * 2)
      const y = padding + (1 - (val - min) / range) * (height - padding * 2)
      return { x, y }
    })

    const linePart = coords.map((c) => `${c.x},${c.y}`).join(' L ')
    const firstX = coords[0].x
    const lastX = coords[coords.length - 1].x

    return `M ${firstX},${height} L ${linePart} L ${lastX},${height} Z`
  }, [data, width, height])

  if (data.length < 2) return null

  const gradientId = `sparkline-grad-${useMemo(() => Math.random().toString(36).slice(2, 8), [])}`

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className="block overflow-visible"
      preserveAspectRatio="none"
    >
      {showArea && (
        <>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={areaPath} fill={`url(#${gradientId})`} />
        </>
      )}

      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
