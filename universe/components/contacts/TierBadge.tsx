import { getTierColor } from '@/lib/utils'

interface TierBadgeProps {
  tier: string
}

export default function TierBadge({ tier }: TierBadgeProps) {
  if (!tier || tier === 'None') return null

  const color = getTierColor(tier)

  return (
    <span style={{
      fontSize: 11,
      fontWeight: 500,
      padding: '2px 8px',
      borderRadius: 99,
      background: color + '18',
      color: color,
      border: `1px solid ${color}30`,
      whiteSpace: 'nowrap',
    }}>
      {tier}
    </span>
  )
}
