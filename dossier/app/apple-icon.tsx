import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0d1b2a',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Subtle amber glow — intel/dossier vibe */}
        <div
          style={{
            position: 'absolute',
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(251,191,36,0.15) 0%, transparent 70%)',
            display: 'flex',
          }}
        />
        <span
          style={{
            color: '#ffffff',
            fontSize: 90,
            fontWeight: 800,
            fontFamily: 'sans-serif',
            letterSpacing: -4,
            lineHeight: 1,
          }}
        >
          D
        </span>
      </div>
    ),
    { ...size }
  )
}
