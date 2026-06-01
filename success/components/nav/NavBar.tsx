'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { label: 'Input', href: '/input' },
  { label: 'Projects', href: '/projects' },
  { label: 'Priorities', href: '/priorities' },
  { label: 'Tasks', href: '/tasks' },
  { label: 'Report', href: '/report' },
  { label: 'Archive', href: '/archive' },
]

export default function NavBar() {
  const pathname = usePathname()

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: '#0d1b2a',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.5px', color: '#60a5fa' }}>✦</span>
        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.9)' }}>Success</span>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          background: '#0f2236',
          borderRadius: 9999,
          padding: '3px 4px',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {TABS.map((tab) => {
          const active = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href))
          return (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                padding: '5px 14px',
                borderRadius: 9999,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                transition: 'all 0.15s',
                background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: active ? '#ffffff' : 'rgba(255,255,255,0.45)',
              }}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>

      {/* Spacer for symmetry */}
      <div style={{ width: 80 }} />
    </nav>
  )
}
