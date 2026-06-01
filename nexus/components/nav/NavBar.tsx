'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const tabs = [
  { label: 'TODAY',        href: '/today' },
  { label: 'TEAM',         href: '/team' },
  { label: 'OFFICE',       href: '/office' },
  { label: 'PROJECTS',     href: '/projects' },
  { label: 'TASKS',        href: '/tasks' },
  { label: 'MEMORY',       href: '/memory' },
  { label: 'WIKI',         href: '/wiki' },
  { label: 'AUTOMATIONS',  href: '/automations' },
]

export default function NavBar() {
  const pathname = usePathname()
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSave() {
    setStatus('saving')
    setMessage('')
    try {
      const res = await fetch('/api/git', { method: 'POST' })
      const data = await res.json()
      setStatus(data.ok ? 'done' : 'error')
      setMessage(data.message)
      setTimeout(() => setStatus('idle'), 3000)
    } catch {
      setStatus('error')
      setMessage('Failed to connect')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  const saveLabel = status === 'saving' ? '...' : status === 'done' ? '✓ Saved' : status === 'error' ? '✗ Error' : '↑ Save'
  const saveColor = status === 'done' ? '#4ade80' : status === 'error' ? '#ef4444' : 'rgba(255,255,255,0.4)'

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3"
      style={{ backgroundColor: '#0d1b2a', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
    >
      <div className="w-24" />

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

      <div className="w-24 flex flex-col items-end">
        <button
          onClick={handleSave}
          disabled={status === 'saving'}
          className="text-xs px-3 py-1.5 rounded-lg transition-all"
          style={{
            backgroundColor: 'rgba(255,255,255,0.06)',
            color: saveColor,
            cursor: status === 'saving' ? 'wait' : 'pointer',
          }}
        >
          {saveLabel}
        </button>
        {message && (
          <span className="text-xs mt-1 text-right" style={{ color: saveColor, maxWidth: '120px' }}>
            {message}
          </span>
        )}
      </div>
    </nav>
  )
}
