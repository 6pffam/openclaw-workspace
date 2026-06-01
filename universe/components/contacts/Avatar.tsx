'use client'

import { getInitials, getTierColor } from '@/lib/utils'

interface AvatarProps {
  name: string
  photoUrl?: string | null
  tier?: string
  size?: number
}

export default function Avatar({ name, photoUrl, tier = 'None', size = 40 }: AvatarProps) {
  const color = getTierColor(tier)
  const initials = getInitials(name)

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {/* Tier ring */}
      <div style={{
        position: 'absolute',
        inset: -3,
        borderRadius: '50%',
        border: `2.5px solid ${color}`,
        opacity: tier === 'None' ? 0.2 : 0.75,
      }} />
      {/* Avatar circle */}
      <div style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        background: '#0f2236',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.35,
        fontWeight: 600,
        color: 'rgba(255,255,255,0.55)',
      }}>
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span>{initials}</span>
        )}
      </div>
    </div>
  )
}
