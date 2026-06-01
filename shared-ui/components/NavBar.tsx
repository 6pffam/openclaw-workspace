'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

export interface NavTab {
  label: string
  href: string
}

interface NavBarProps {
  tabs: NavTab[]
  /** Optional left slot — logo, app name, etc. */
  left?: ReactNode
  /** Optional right slot — save button, actions, etc. */
  right?: ReactNode
}

/**
 * Base NavBar shell — pill-style navigation, dark navy background.
 * Each app passes its own `tabs` and optional `left`/`right` slots.
 */
export default function NavBar({ tabs, left, right }: NavBarProps) {
  const pathname = usePathname()

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3"
      style={{ backgroundColor: '#0d1b2a', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
    >
      <div className="w-24 flex items-center">
        {left}
      </div>

      <div
        className="flex gap-1 p-1 rounded-full"
        style={{ backgroundColor: '#0f2236' }}
      >
        {tabs.map(tab => {
          const active = pathname === tab.href || pathname.startsWith(tab.href + '/')
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="px-5 py-1.5 rounded-full text-xs font-semibold tracking-widest transition-all"
              style={{
                backgroundColor: active ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: active ? 'white' : 'rgba(255,255,255,0.45)',
              }}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>

      <div className="w-24 flex justify-end">
        {right}
      </div>
    </nav>
  )
}
