'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import type { WBSFile } from '@/lib/wbs'

function ProgressBar({ progress }: { progress: number }) {
  const color = progress === 100 ? '#4ade80' : progress >= 50 ? '#60a5fa' : '#f59e0b'
  return (
    <div className="w-full rounded-full h-2" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
      <div
        className="h-2 rounded-full transition-all duration-500"
        style={{ width: `${progress}%`, backgroundColor: color }}
      />
    </div>
  )
}

function PhaseCard({ phase, index }: { phase: WBSFile['phases'][0]; index: number }) {
  const allDone = phase.completed === phase.total && phase.total > 0
  const anyDone = phase.completed > 0
  const phaseProgress = phase.total > 0 ? Math.round((phase.completed / phase.total) * 100) : 0

  const borderColor = allDone
    ? 'rgba(74,222,128,0.3)'
    : anyDone
    ? 'rgba(96,165,250,0.2)'
    : 'rgba(255,255,255,0.06)'

  const headerColor = allDone ? '#4ade80' : anyDone ? '#60a5fa' : 'rgba(255,255,255,0.5)'

  return (
    <div
      className="rounded-2xl p-5"
      style={{ backgroundColor: '#0f2236', border: `1px solid ${borderColor}` }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Phase {index + 1}
          </span>
          {allDone && <span className="text-xs">✅</span>}
        </div>
        <span className="text-xs tabular-nums" style={{ color: 'rgba(255,255,255,0.3)' }}>
          {phase.completed}/{phase.total}
        </span>
      </div>

      <h3 className="text-sm font-semibold mb-3" style={{ color: headerColor }}>
        {phase.name}
      </h3>

      <ProgressBar progress={phaseProgress} />

      <div className="mt-4 space-y-2">
        {phase.tasks.map((task, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <span className="mt-0.5 shrink-0 text-sm">
              {task.completed ? '✅' : '⬜'}
            </span>
            <span
              className="text-xs leading-relaxed"
              style={{
                color: task.completed ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.75)',
                textDecoration: task.completed ? 'line-through' : 'none',
              }}
            >
              {task.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function WBSPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [wbs, setWbs] = useState<WBSFile | null>(null)
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState(false)
  const [approved, setApproved] = useState(false)

  const fetchWBS = useCallback(async () => {
    try {
      const res = await fetch(`/api/wbs/${slug}`)
      if (res.ok) {
        const data = await res.json()
        setWbs(data)
      }
    } catch {}
    setLoading(false)
  }, [slug])

  useEffect(() => {
    fetchWBS()

    // Live updates via SSE
    const es = new EventSource('/api/watch')
    es.onmessage = (e) => {
      try {
        const ev = JSON.parse(e.data)
        const changed = ev.file ?? ev.path ?? ''
        if (changed.includes('active-work')) fetchWBS()
      } catch {}
    }
    return () => es.close()
  }, [fetchWBS])

  const handleApprove = async () => {
    if (!wbs) return
    setApproving(true)
    try {
      await fetch('/api/wbs/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: wbs.slug, projectName: wbs.title }),
      })
      setApproved(true)
    } catch {}
    setApproving(false)
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto pt-16 text-center">
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>Loading…</p>
      </div>
    )
  }

  if (!wbs) {
    return (
      <div className="max-w-4xl mx-auto pt-16 text-center">
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>WBS not found.</p>
        <Link href="/projects" className="text-xs mt-4 inline-block" style={{ color: '#60a5fa' }}>
          ← Projects
        </Link>
      </div>
    )
  }

  const statusColor = wbs.status.includes('PROGRESS')
    ? '#f59e0b'
    : wbs.status.includes('DONE') || wbs.status.includes('COMPLETE')
    ? '#4ade80'
    : 'rgba(255,255,255,0.4)'

  const needsApproval = wbs.status.includes('PENDING') || wbs.status.includes('AWAITING')
  const showApprove = needsApproval && !approved

  return (
    <div className="max-w-4xl mx-auto pt-8 pb-16">
      {/* Back link */}
      <Link href="/projects" className="text-xs mb-6 inline-block" style={{ color: 'rgba(255,255,255,0.3)' }}>
        ← Projects
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">{wbs.title}</h1>
            {wbs.startedDate && (
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Started {wbs.startedDate}
              </p>
            )}
          </div>
          <span
            className="px-3 py-1 rounded-full text-xs font-semibold shrink-0"
            style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: statusColor }}
          >
            {wbs.status}
          </span>
        </div>

        {wbs.goal && (
          <p className="mt-3 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {wbs.goal}
          </p>
        )}
      </div>

      {/* Overall progress */}
      <div
        className="rounded-2xl p-5 mb-8"
        style={{ backgroundColor: '#0f2236', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Overall Progress
          </span>
          <span className="text-lg font-bold tabular-nums" style={{ color: wbs.progress === 100 ? '#4ade80' : '#60a5fa' }}>
            {wbs.progress}%
          </span>
        </div>
        <ProgressBar progress={wbs.progress} />
        <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.25)' }}>
          {wbs.completedTasks} of {wbs.totalTasks} tasks complete
        </p>
      </div>

      {/* Approve & Start button */}
      {showApprove && (
        <div
          className="rounded-2xl p-5 mb-8"
          style={{ backgroundColor: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)' }}
        >
          <p className="text-sm font-semibold text-white mb-1">Ready to execute?</p>
          <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Review the plan above. Clicking Approve will notify the agent to start executing step 1.
          </p>
          <button
            onClick={handleApprove}
            disabled={approving}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-opacity"
            style={{ backgroundColor: '#4ade80', color: '#0a1628' }}
          >
            {approving ? 'Approving…' : '✅ Approve & Start'}
          </button>
        </div>
      )}

      {approved && (
        <div
          className="rounded-2xl p-4 mb-8"
          style={{ backgroundColor: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}
        >
          <p className="text-sm font-semibold" style={{ color: '#4ade80' }}>
            ✅ Approved — agent notified and starting execution
          </p>
        </div>
      )}

      {/* Phases */}
      <div className="space-y-4">
        {wbs.phases.map((phase, i) => (
          <PhaseCard key={i} phase={phase} index={i} />
        ))}
      </div>
    </div>
  )
}
