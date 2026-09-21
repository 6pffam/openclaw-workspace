import type { HTMLAttributes, ReactNode } from 'react'

type BadgeVariant = 'active' | 'idle' | 'planned' | 'danger' | 'amber' | 'blue' | 'default'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode
  variant?: BadgeVariant
  dot?: boolean
  className?: string
}

const variantStyles: Record<BadgeVariant, { color: string; bg: string }> = {
  active:  { color: '#4ade80',                  bg: 'rgba(74,222,128,0.12)' },
  idle:    { color: 'rgba(255,255,255,0.4)',     bg: 'rgba(255,255,255,0.05)' },
  planned: { color: 'rgba(255,255,255,0.25)',    bg: 'rgba(255,255,255,0.03)' },
  danger:  { color: '#ef4444',                  bg: 'rgba(239,68,68,0.15)' },
  amber:   { color: '#f59e0b',                  bg: 'rgba(245,158,11,0.12)' },
  blue:    { color: '#60a5fa',                  bg: 'rgba(96,165,250,0.12)' },
  default: { color: 'rgba(255,255,255,0.55)',   bg: 'rgba(255,255,255,0.06)' },
}

/**
 * Unrecognised props are forwarded to the root element, so callers can attach
 * `data-*` hooks, `id`, `aria-*`, `title` and event handlers without wrapping
 * the component in a spare element. They are spread before `className` and
 * `style`, which the component always computes itself — so this is additive:
 * nothing a caller could already pass changes meaning.
 */
export default function Badge({
  children,
  variant = 'default',
  dot = false,
  className = '',
  ...rest
}: BadgeProps) {
  const { color, bg } = variantStyles[variant]

  return (
    <span
      {...rest}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${className}`}
      style={{ backgroundColor: bg, color }}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
      )}
      {children}
    </span>
  )
}
