'use client'

import { useEffect, useState, useCallback } from 'react'
import CrewCard from '@/components/team/CrewCard'
import type { CrewMember } from '@/lib/types'

const REFRESH_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

export default function TeamPage() {
  const [members, setMembers] = useState<CrewMember[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL_MS / 1000)

  const fetchCrew = useCallback(async () => {
    try {
      const res = await fetch('/api/crew')
      const data = await res.json()
      setMembers(data.members ?? [])
      setLastUpdated(new Date())
      setCountdown(REFRESH_INTERVAL_MS / 1000)
    } catch {}
  }, [])

  useEffect(() => {
    fetchCrew()

    // Refresh every 5 minutes
    const refreshTimer = setInterval(fetchCrew, REFRESH_INTERVAL_MS)

    // Countdown ticker (every second)
    const countdownTimer = setInterval(() => {
      setCountdown(c => (c <= 1 ? REFRESH_INTERVAL_MS / 1000 : c - 1))
    }, 1000)

    return () => {
      clearInterval(refreshTimer)
      clearInterval(countdownTimer)
    }
  }, [fetchCrew])

  const ceo = members.find(m => m.reportsTo === null)
  const directReports = members.filter(m => m.reportsTo === 'ceo')
  const others = members.filter(m => m.reportsTo !== null && m.reportsTo !== 'ceo')

  const now = new Date()
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const currentLabel = now.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
  const prevLabel = prevDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
  const currentTotal = members.reduce((s, m) => s + (m.currentMonthChf ?? 0), 0)
  const prevTotal = members.reduce((s, m) => s + (m.previousMonthChf ?? 0), 0)
  const currentTotalUsd = members.reduce((s, m) => s + (m.currentMonthUsd ?? 0), 0)

  // Freshness: find the most recent data point across all agents
  const latestDataMs = members.reduce((max, m) => Math.max(max, m.costDataAsOf ?? 0), 0)
  const latestDataDate = latestDataMs ? new Date(latestDataMs) : null

  const formatCountdown = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  return (
    <div className="max-w-6xl mx-auto pt-8">
      <div className="mb-8">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">Team</h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {members.length} crew members · {members.filter(m => m.status === 'active').length} active
              </p>
              {lastUpdated && (
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  · updated {lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  {' '}· next in {formatCountdown(countdown)}
                </p>
              )}
            </div>
          </div>

          {/* Monthly cost totals */}
          <div className="flex flex-col items-end gap-1">
            <div className="flex gap-4">
              <div className="text-right">
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{currentLabel}</div>
                <div className="text-sm font-semibold" style={{ color: '#f59e0b' }}>
                  ${currentTotalUsd.toFixed(2)} <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>/ CHF {currentTotal.toFixed(2)}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{prevLabel}</div>
                <div className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  ${members.reduce((s, m) => s + (m.previousMonthUsd ?? 0), 0).toFixed(2)} <span style={{ color: 'rgba(255,255,255,0.2)', fontWeight: 400 }}>/ CHF {prevTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
            {latestDataDate && (
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
                cost data as of {latestDataDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} {latestDataDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                {' '}· from local logs (≈ Anthropic billing)
              </div>
            )}
          </div>
        </div>
      </div>

      {ceo && (
        <div className="flex justify-center mb-10">
          <div className="w-80">
            <CrewCard member={ceo} isCeo />
          </div>
        </div>
      )}

      {directReports.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {directReports.map(m => (
            <CrewCard key={m.id} member={m} />
          ))}
        </div>
      )}

      {others.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {others.map(m => (
            <CrewCard key={m.id} member={m} />
          ))}
        </div>
      )}
    </div>
  )
}
