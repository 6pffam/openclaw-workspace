'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { CalendarEvent } from '@/app/api/today/calendar/route'

interface TodayData {
  date: string
  time: string
  tasks: { pendingApproval: number; inProgress: number; pendingItems: { id: string; title: string }[] }
  crew: { activeCount: number; totalAgents: number }
  ember: { filename: string; date: string; title: string; preview: string } | null
  revs: { filename: string; date: string; title: string; preview: string } | null
  memoryHeadline: string | null
}

interface CalendarData {
  configured: boolean
  message?: string
  events: CalendarEvent[]
}

function Widget({ title, children, accent }: { title: string; children: React.ReactNode; accent?: string }) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        backgroundColor: '#0f2236',
        border: `1px solid ${accent ?? 'rgba(255,255,255,0.06)'}`,
      }}
    >
      <h2 className="text-xs font-semibold tracking-wider uppercase mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
        {title}
      </h2>
      {children}
    </div>
  )
}

function formatEventTime(iso: string, allDay?: boolean): string {
  if (allDay) return 'All day'
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Zurich' })
}

export default function TodayPage() {
  const [data, setData] = useState<TodayData | null>(null)
  const [calendar, setCalendar] = useState<CalendarData | null>(null)

  useEffect(() => {
    fetch('/api/today').then(r => r.json()).then(setData).catch(() => {})
    fetch('/api/today/calendar').then(r => r.json()).then(setCalendar).catch(() => {})

    // Refresh every 60s
    const interval = setInterval(() => {
      fetch('/api/today').then(r => r.json()).then(setData).catch(() => {})
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const greeting = (() => {
    const h = new Date().toLocaleString('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Europe/Zurich' })
    const hr = parseInt(h)
    if (hr < 12) return 'Good morning'
    if (hr < 18) return 'Good afternoon'
    return 'Good evening'
  })()

  return (
    <div className="max-w-5xl mx-auto pt-8 pb-16">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-white tracking-tight">
          {greeting}, Kone 👋
        </h1>
        {data && (
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {data.date} · {data.time} Zurich
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Left column — 2/3 width */}
        <div className="lg:col-span-2 space-y-4">

          {/* Crew status */}
          <Widget title="Crew Status">
            {data ? (
              <div className="flex items-center gap-3">
                <div
                  className="w-2.5 h-2.5 rounded-full animate-pulse"
                  style={{ backgroundColor: data.crew.activeCount > 0 ? '#4ade80' : 'rgba(255,255,255,0.2)' }}
                />
                <span className="text-sm text-white">
                  {data.crew.activeCount} of {data.crew.totalAgents} agents active
                </span>
                <Link href="/team" className="ml-auto text-xs" style={{ color: 'rgba(96,165,250,0.7)' }}>
                  View team →
                </Link>
              </div>
            ) : (
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Loading…</p>
            )}
          </Widget>

          {/* Pending approvals */}
          {data && data.tasks.pendingApproval > 0 && (
            <Widget title={`Needs Approval (${data.tasks.pendingApproval})`} accent="rgba(239,68,68,0.25)">
              <div className="space-y-2">
                {data.tasks.pendingItems.map(t => (
                  <div key={t.id} className="flex items-center justify-between">
                    <span className="text-sm text-white">{t.title}</span>
                    <Link href="/tasks" className="text-xs px-2 py-1 rounded-lg shrink-0 ml-3"
                      style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                      Review →
                    </Link>
                  </div>
                ))}
              </div>
            </Widget>
          )}

          {/* EMBER digest */}
          <Widget title="🔥 Latest EMBER Digest">
            {data?.ember ? (
              <div>
                <p className="text-sm font-semibold text-white mb-1">{data.ember.title}</p>
                <p className="text-xs mb-3 leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {data.ember.preview || 'No preview available'}
                </p>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>{data.ember.date}</span>
              </div>
            ) : (
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                No digest yet — EMBER runs every Monday at 08:00.
              </p>
            )}
          </Widget>

          {/* REVS brief */}
          <Widget title="🏍️ Latest REVS Brief">
            {data?.revs ? (
              <div>
                <p className="text-sm font-semibold text-white mb-1">{data.revs.title}</p>
                <p className="text-xs mb-3 leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {data.revs.preview || 'No preview available'}
                </p>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>{data.revs.date}</span>
              </div>
            ) : (
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                No brief yet — REVS runs every Friday at 17:00.
              </p>
            )}
          </Widget>

        </div>

        {/* Right column — 1/3 width */}
        <div className="space-y-4">

          {/* Today's memory */}
          <Widget title="📝 Today's Log">
            {data?.memoryHeadline ? (
              <div>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  {data.memoryHeadline}
                </p>
                <Link href="/memory" className="block mt-3 text-xs" style={{ color: 'rgba(96,165,250,0.7)' }}>
                  Read full log →
                </Link>
              </div>
            ) : (
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>No log written yet today.</p>
            )}
          </Widget>

          {/* Calendar */}
          <Widget title="📅 Calendar">
            {!calendar ? (
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Loading…</p>
            ) : !calendar.configured ? (
              <div>
                <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Google Calendar not connected.
                </p>
                <p className="text-xs font-mono px-2 py-1 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
                  gog auth add you@gmail.com
                </p>
              </div>
            ) : calendar.events.length === 0 ? (
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>No events today or tomorrow.</p>
            ) : (
              <div className="space-y-3">
                {calendar.events.slice(0, 5).map(ev => (
                  <div key={ev.id} className="flex items-start gap-2">
                    <span className="text-xs tabular-nums shrink-0 mt-0.5" style={{ color: '#60a5fa' }}>
                      {formatEventTime(ev.start, ev.allDay)}
                    </span>
                    <span className="text-xs text-white leading-snug">{ev.summary}</span>
                  </div>
                ))}
              </div>
            )}
          </Widget>

          {/* Tasks summary */}
          <Widget title="✅ Tasks">
            {data ? (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span style={{ color: 'rgba(255,255,255,0.45)' }}>In progress</span>
                  <span className="text-white font-semibold">{data.tasks.inProgress}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: 'rgba(255,255,255,0.45)' }}>Needs approval</span>
                  <span style={{ color: data.tasks.pendingApproval > 0 ? '#ef4444' : 'rgba(255,255,255,0.4)' }} className="font-semibold">
                    {data.tasks.pendingApproval}
                  </span>
                </div>
                <Link href="/tasks" className="block mt-2 text-xs" style={{ color: 'rgba(96,165,250,0.7)' }}>
                  View all tasks →
                </Link>
              </div>
            ) : (
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Loading…</p>
            )}
          </Widget>

        </div>
      </div>
    </div>
  )
}
