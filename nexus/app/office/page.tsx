'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates'
import type { CrewMember } from '@/lib/types'

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(ms: number | null | undefined): string {
  if (!ms) return 'never'
  const diff = Date.now() - ms
  const m = Math.floor(diff / 60000)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  if (h < 24) return `${h}h ago`
  return `${d}d ago`
}

// ── Desk component ────────────────────────────────────────────────────────────

function Desk({
  member,
  size = 'md',
}: {
  member: CrewMember
  size?: 'lg' | 'md' | 'sm'
}) {
  const active = member.status === 'active'
  const ago    = timeAgo(member.lastActiveAt)

  const dims = {
    lg: { wrap: 88, desk: 80, screen: 52, screenH: 36, dot: 8, emoji: 'text-3xl', name: 13, role: 10 },
    md: { wrap: 72, desk: 64, screen: 42, screenH: 28, dot: 7, emoji: 'text-2xl', name: 12, role: 10 },
    sm: { wrap: 60, desk: 52, screen: 34, screenH: 22, dot: 6, emoji: 'text-xl',  name: 11, role: 9  },
  }[size]

  return (
    <div className="flex flex-col items-center gap-1.5 select-none">
      {/* Agent emoji / empty chair */}
      <div
        className={`${dims.emoji} transition-all duration-700`}
        style={{ opacity: active ? 1 : 0.18, filter: active ? 'none' : 'grayscale(1)' }}
        title={active ? `${member.name} — active` : `${member.name} — idle (${ago})`}
      >
        {active ? member.emoji : '🪑'}
      </div>

      {/* Desk surface */}
      <div
        className="relative flex items-center justify-center transition-all duration-700"
        style={{
          width:  dims.desk,
          height: dims.desk * 0.56,
          borderRadius: 4,
          backgroundColor: active ? '#152840' : '#0a1520',
          border: active
            ? '1px solid rgba(245,158,11,0.45)'
            : '1px solid rgba(255,255,255,0.06)',
          boxShadow: active
            ? '0 0 18px rgba(245,158,11,0.12), inset 0 1px 0 rgba(255,255,255,0.04)'
            : 'none',
        }}
      >
        {/* Monitor screen */}
        <div
          className="flex items-center justify-center transition-all duration-700"
          style={{
            width:  dims.screen,
            height: dims.screenH,
            borderRadius: 2,
            backgroundColor: active ? '#0a2540' : '#060c14',
            border: active
              ? '1px solid rgba(96,165,250,0.35)'
              : '1px solid rgba(255,255,255,0.07)',
            boxShadow: active ? '0 0 10px rgba(96,165,250,0.1)' : 'none',
          }}
        >
          {/* Screen content lines */}
          {active ? (
            <div className="flex flex-col gap-0.5 px-1.5 w-full">
              <div className="h-px rounded-full w-full" style={{ backgroundColor: 'rgba(96,165,250,0.5)' }} />
              <div className="h-px rounded-full w-3/4" style={{ backgroundColor: 'rgba(96,165,250,0.3)' }} />
              <div className="h-px rounded-full w-5/6" style={{ backgroundColor: 'rgba(96,165,250,0.2)' }} />
            </div>
          ) : (
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }} />
          )}
        </div>

        {/* Active indicator dot */}
        {active && (
          <div
            className="absolute rounded-full animate-pulse"
            style={{
              width:  dims.dot,
              height: dims.dot,
              top: -dims.dot / 2,
              right: 6,
              backgroundColor: '#f59e0b',
              boxShadow: '0 0 8px #f59e0b',
            }}
          />
        )}
      </div>

      {/* Name */}
      <span
        className="font-semibold tracking-wide text-center leading-tight transition-all duration-500"
        style={{
          fontSize: dims.name,
          color: active ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.22)',
          maxWidth: dims.wrap,
        }}
      >
        {member.name}
      </span>

      {/* Status line */}
      <span
        className="text-center leading-tight transition-all duration-500"
        style={{
          fontSize: dims.role,
          color: active ? 'rgba(245,158,11,0.7)' : 'rgba(255,255,255,0.15)',
          maxWidth: dims.wrap,
        }}
      >
        {active ? 'active' : ago}
      </span>
    </div>
  )
}

// ── Floor plan ────────────────────────────────────────────────────────────────

export default function OfficePage() {
  const [members, setMembers] = useState<CrewMember[]>([])
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchCrew = useCallback(async () => {
    try {
      const res = await fetch('/api/crew')
      const data = await res.json()
      setMembers(data.members ?? [])
      setLastUpdated(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    } catch {}
  }, [])

  useEffect(() => { fetchCrew() }, [fetchCrew])
  useRealtimeUpdates(fetchCrew)

  const ceo          = members.find(m => m.id === 'ceo')
  const cos          = members.find(m => m.id === 'chief-of-staff')
  const agents       = members.filter(m => m.id !== 'ceo' && m.id !== 'chief-of-staff')
  const activeCount  = members.filter(m => m.status === 'active').length
  const totalAgents  = members.filter(m => m.id !== 'ceo').length

  return (
    <div className="max-w-4xl mx-auto pt-8 pb-12">

      {/* Header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Visual Office</h1>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {activeCount > 0
              ? `${activeCount} of ${totalAgents} agents at their desk`
              : `All ${totalAgents} agents idle`}
            {' · '}
            <span style={{ color: 'rgba(255,255,255,0.25)' }}>updated {lastUpdated}</span>
          </p>
        </div>
        <button
          onClick={fetchCrew}
          className="text-xs px-3 py-1.5 rounded-lg transition-all"
          style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}
        >
          Refresh
        </button>
      </div>

      {/* Floor plan */}
      <div
        className="rounded-2xl px-8 py-10"
        style={{
          backgroundColor: '#070e1a',
          border: '1px solid rgba(255,255,255,0.05)',
          backgroundImage: [
            'linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)',
          ].join(','),
          backgroundSize: '24px 24px',
        }}
      >

        {/* Room label */}
        <div className="text-center mb-8">
          <span
            className="text-xs tracking-widest uppercase px-3 py-1 rounded"
            style={{
              color: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.05)',
              letterSpacing: '0.2em',
            }}
          >
            Mission Control HQ
          </span>
        </div>

        {/* ── CEO — corner office ── */}
        {ceo && (
          <div className="flex justify-center mb-10">
            <div className="flex flex-col items-center gap-3">
              <span className="text-xs tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.1)', letterSpacing: '0.15em' }}>
                CEO
              </span>
              <Desk member={ceo} size="lg" />
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-4 mb-10">
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.06))' }} />
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, rgba(255,255,255,0.06))' }} />
        </div>

        {/* ── Chief of Staff — hub ── */}
        {cos && (
          <div className="flex justify-center mb-10">
            <div className="flex flex-col items-center gap-3">
              <span className="text-xs tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.1)', letterSpacing: '0.15em' }}>
                Chief of Staff
              </span>
              <Desk member={cos} size="md" />
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-4 mb-10">
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.04))' }} />
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.07)', letterSpacing: '0.12em' }}>CREW</span>
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, rgba(255,255,255,0.04))' }} />
        </div>

        {/* ── Agents — responsive grid ── */}
        <div
          className="flex flex-wrap justify-center"
          style={{ gap: '36px 48px' }}
        >
          {agents.map(m => (
            <Desk key={m.id} member={m} size="sm" />
          ))}
        </div>

      </div>

      {/* Legend */}
      <div className="flex gap-6 mt-4 justify-end items-center">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#f59e0b', boxShadow: '0 0 6px #f59e0b' }} />
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Active — session in last 10 min</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }} />
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Idle</span>
        </div>
      </div>
    </div>
  )
}
