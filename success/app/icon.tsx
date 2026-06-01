import { ImageResponse } from 'next/og'

export const size = { width: 192, height: 192 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    <div style={{ background: '#0d1b2a', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: '#60a5fa', fontSize: 100, fontWeight: 800, fontFamily: 'sans-serif' }}>✦</span>
    </div>,
    { ...size }
  )
}
