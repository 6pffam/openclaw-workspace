'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Upload, Layers, Sliders, CheckSquare, BarChart2, Archive } from 'lucide-react'

const TABS = [
  { label: 'Input', href: '/input', Icon: Upload },
  { label: 'Projects', href: '/projects', Icon: Layers },
  { label: 'Priorities', href: '/priorities', Icon: Sliders },
  { label: 'Tasks', href: '/tasks', Icon: CheckSquare },
  { label: 'Report', href: '/report', Icon: BarChart2 },
  { label: 'Archive', href: '/archive', Icon: Archive },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: '#0d1b2a',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '8px 0 max(env(safe-area-inset-bottom), 8px)',
      }}
    >
      {TABS.map(({ label, href, Icon }) => {
        const active = pathname === href || (href !== '/' && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              textDecoration: 'none',
              minWidth: 48,
            }}
          >
            <Icon size={20} color={active ? '#60a5fa' : 'rgba(255,255,255,0.35)'} />
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.04em',
                color: active ? '#60a5fa' : 'rgba(255,255,255,0.35)',
              }}
            >
              {label}
            </span>
            {active && (
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#60a5fa', marginTop: -2 }} />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
