'use client'

import { useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import BottomNav from '@/components/nav/BottomNav'

const IDLE_MS = 15 * 60 * 1000 // 15 minutes

const NAV_ITEMS = [
  { href: '/contacts',    label: 'Contacts',    icon: '👤' },
  { href: '/connections', label: 'Connections', icon: '🕸️' },
  { href: '/interlocks',  label: 'Interlocks',  icon: '🔁' },
  { href: '/memory',      label: 'Memory',      icon: '📓' },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()

  const lockApp = useCallback(async () => {
    await fetch('/api/auth/lock', { method: 'POST' })
    router.push('/lock')
    router.refresh()
  }, [router])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const resetTimer = () => {
      clearTimeout(timer)
      timer = setTimeout(lockApp, IDLE_MS)
    }
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }))
    resetTimer()
    return () => {
      clearTimeout(timer)
      events.forEach(e => window.removeEventListener(e, resetTimer))
    }
  }, [lockApp])

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0d1b2a' }}>
      {/* Top nav — desktop only */}
      <header
        className="hidden md:block"
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          background: '#0d1b2a',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">🌐</span>
            <span className="font-semibold text-sm text-white">Universe</span>
          </div>

          <nav
            className="flex items-center gap-1 p-1 rounded-full"
            style={{ backgroundColor: '#0f2236' }}
          >
            {NAV_ITEMS.map(item => {
              const active = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: active ? 'rgba(255,255,255,0.12)' : 'transparent',
                    color: active ? 'white' : 'rgba(255,255,255,0.45)',
                  }}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <button
            onClick={lockApp}
            className="text-xs px-3 py-1.5 rounded-full transition-all"
            style={{
              color: 'rgba(255,255,255,0.35)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            Lock
          </button>
        </div>
      </header>

      {/* Mobile header — title only, no nav */}
      <header
        className="block md:hidden sticky top-0 z-50"
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          background: '#0d1b2a',
        }}
      >
        <div className="px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">🌐</span>
            <span className="font-semibold text-sm text-white">Universe</span>
          </div>
          <button
            onClick={lockApp}
            className="text-xs px-3 rounded-full transition-all"
            style={{
              color: 'rgba(255,255,255,0.35)',
              border: '1px solid rgba(255,255,255,0.06)',
              minHeight: 36,
            }}
          >
            Lock
          </button>
        </div>
      </header>

      {/* Main content — extra bottom padding on mobile for bottom nav */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 md:px-6 py-4 md:py-6 pb-28 md:pb-6">
        {children}
      </main>

      {/* Bottom nav — mobile only */}
      <div className="block md:hidden">
        <BottomNav />
      </div>
    </div>
  )
}
