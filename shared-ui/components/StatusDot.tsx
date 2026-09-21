import type { HTMLAttributes } from 'react'

type StatusColor = 'green' | 'amber' | 'red' | 'grey' | 'blue'

// `color` on HTMLAttributes is a string; the dot's own is a narrower union.
interface StatusDotProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'color'> {
  color?: StatusColor
  /** Add CSS glow animation */
  pulse?: boolean
  size?: number
}

const colorMap: Record<StatusColor, string> = {
  green: '#4ade80',
  amber: '#f59e0b',
  red:   '#ef4444',
  grey:  'rgba(255,255,255,0.25)',
  blue:  '#60a5fa',
}

/**
 * Unrecognised props are forwarded to the root element, so callers can attach
 * `data-*` hooks, `id`, `aria-*`, `title` and event handlers without wrapping
 * the component in a spare element. They are spread before `className` and
 * `style`, which the component always computes itself — so this is additive:
 * nothing a caller could already pass changes meaning.
 */
export default function StatusDot({
  color = 'green',
  pulse = false,
  size = 8,
  className = '',
  ...rest
}: StatusDotProps) {
  const hex = colorMap[color]
  return (
    <span
      {...rest}
      className={`inline-block rounded-full shrink-0 ${pulse ? 'animate-pulse' : ''} ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: hex,
        boxShadow: pulse ? `0 0 6px ${hex}` : undefined,
      }}
    />
  )
}
