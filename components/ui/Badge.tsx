import type { ReactNode } from 'react'

type BadgeVariant = 'default' | 'muted' | 'accent' | 'info' | 'success' | 'error' | 'warning'
type BadgeSize = 'sm' | 'md'

interface BadgeProps {
  variant?: BadgeVariant
  size?: BadgeSize
  children: ReactNode
  dot?: boolean
  className?: string
}

const variantStyles: Record<string, string> = {
  default: 'bg-muted text-muted-foreground border-border',
  muted: 'bg-muted text-muted-foreground border-border',
  accent: 'bg-accent text-accent-foreground border-transparent',
  success: 'bg-success-muted text-success border-success/15',
  error: 'bg-error-muted text-error border-error/15',
  warning: 'bg-warning-muted text-warning border-warning/15',
  info: 'bg-accent-muted text-accent border-accent/15',
}

const dotStyles: Record<BadgeVariant, string> = {
  default: 'bg-primary',
  muted: 'bg-muted-foreground',
  accent: 'bg-accent',
  success: 'bg-success',
  error: 'bg-error',
  warning: 'bg-warning',
  info: 'bg-info',
}

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'text-[10px] px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
}

export default function Badge({
  variant = 'default',
  size = 'sm',
  children,
  dot = false,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-semibold
        select-none transition-colors duration-150
        ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full animate-pulse ${dotStyles[variant]}`}
        />
      )}
      {children}
    </span>
  )
}
