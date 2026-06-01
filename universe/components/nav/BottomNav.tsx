'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { label: 'Contacts',    href: '/contacts',    icon: '👤' },
  { label: 'Connections', href: '/connections', icon: '🕸️' },
  { label: 'Interlocks',  href: '/interlocks',  icon: '🔁' },
  { label: 'Memory',      href: '/memory',      icon: '📓' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2"
      style={{
        backgroundColor: '#0d1b2a',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 8px)',
        paddingTop: '8px',
      }}
    >
      {tabs.map(tab => {
        const active = pathname === tab.href || pathname.startsWith(tab.href + '/')
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex flex-col items-center gap-1 min-w-0 flex-1 py-1"
            style={{ minHeight: 44 }}
          >
            <span className="text-xl leading-none">{tab.icon}</span>
            <span
              className="text-xs font-medium truncate"
              style={{ color: active ? '#60a5fa' : 'rgba(255,255,255,0.35)' }}
            >
              {tab.label}
            </span>
            {active && (
              <span className="w-1 h-1 rounded-full" style={{ backgroundColor: '#60a5fa' }} />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
