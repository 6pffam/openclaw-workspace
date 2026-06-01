type StatusColor = 'green' | 'amber' | 'red' | 'grey' | 'blue'

interface StatusDotProps {
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

export default function StatusDot({ color = 'green', pulse = false, size = 8 }: StatusDotProps) {
  const hex = colorMap[color]
  return (
    <span
      className={`inline-block rounded-full shrink-0 ${pulse ? 'animate-pulse' : ''}`}
      style={{
        width: size,
        height: size,
        backgroundColor: hex,
        boxShadow: pulse ? `0 0 6px ${hex}` : undefined,
      }}
    />
  )
}
