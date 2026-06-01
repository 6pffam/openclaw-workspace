'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Project {
  id: string
  name: string
  hasPackageJson: boolean
  hasAgentsFile: boolean
  lastModified: string
  phase: string
}

interface WBSMeta {
  slug: string
  title: string
  status: string
  progress: number
  completedTasks: number
  totalTasks: number
}

const phaseColor: Record<string, { color: string; bg: string }> = {
  'Active Build':   { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  'In Development': { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  'Exploring':      { color: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.05)' },
}

function ActivePlanCard({ wbs }: { wbs: WBSMeta }) {
  const barColor = wbs.progress === 100 ? '#4ade80' : wbs.progress >= 50 ? '#60a5fa' : '#f59e0b'
  const statusColor = wbs.status.includes('PROGRESS') ? '#f59e0b'
    : wbs.status.includes('DONE') || wbs.status.includes('COMPLETE') ? '#4ade80'
    : 'rgba(255,255,255,0.4)'

  return (
    <Link href={`/wbs/${wbs.slug}`} className="block group">
      <div
        className="rounded-2xl p-5 transition-all hover:brightness-110"
        style={{
          backgroundColor: '#0f2236',
          border: '1px solid rgba(96,165,250,0.15)',
        }}
      >
        <div className="flex items-start justify-between mb-2 gap-3">
          <div className="flex items-center gap-2">
            <span className="text-base">📋</span>
            <span className="text-sm font-semibold text-white">{wbs.title}</span>
          </div>
          <span
            className="text-xs px-2 py-0.5 rounded-full shrink-0 font-medium"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: statusColor }}
          >
            {wbs.status}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {wbs.completedTasks}/{wbs.totalTasks} tasks
            </span>
            <span className="text-xs font-semibold tabular-nums" style={{ color: barColor }}>
              {wbs.progress}%
            </span>
          </div>
          <div className="w-full rounded-full h-1.5" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${wbs.progress}%`, backgroundColor: barColor }}
            />
          </div>
        </div>

        <div className="mt-3 text-xs group-hover:text-blue-400 transition-colors" style={{ color: '#60a5fa' }}>
          View WBS →
        </div>
      </div>
    </Link>
  )
}

function CreatePlanModal({
  project,
  onClose,
}: {
  project: Project
  onClose: () => void
}) {
  const [goal, setGoal] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleRequest = async () => {
    setSending(true)
    try {
      await fetch('/api/wbs/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, projectName: project.name, goal }),
      })
      setSent(true)
    } catch {}
    setSending(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl p-6 w-full max-w-md mx-4"
        style={{ backgroundColor: '#0f2236', border: '1px solid rgba(255,255,255,0.1)' }}
        onClick={e => e.stopPropagation()}
      >
        {sent ? (
          <div className="text-center py-4">
            <p className="text-2xl mb-3">📋</p>
            <p className="text-sm font-semibold text-white mb-1">Plan request sent!</p>
            <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
              I&apos;ll start the planning conversation with you shortly.
            </p>
            <button
              onClick={onClose}
              className="text-xs px-4 py-2 rounded-xl"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-base font-semibold text-white mb-1">Create Plan</h2>
            <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Project: <span className="text-white">{project.name}</span>
            </p>

            <label className="block text-xs mb-1 font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
              What&apos;s the goal? <span style={{ color: 'rgba(255,255,255,0.25)' }}>(optional)</span>
            </label>
            <textarea
              value={goal}
              onChange={e => setGoal(e.target.value)}
              placeholder="e.g. Build a REST API with auth and deployment pipeline…"
              rows={3}
              className="w-full rounded-xl px-3 py-2 text-sm outline-none resize-none mb-4"
              style={{
                backgroundColor: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.8)',
              }}
            />

            <div className="flex gap-2 justify-end">
              <button
                onClick={onClose}
                className="text-xs px-4 py-2 rounded-xl"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleRequest}
                disabled={sending}
                className="text-xs px-4 py-2 rounded-xl font-semibold"
                style={{ backgroundColor: '#60a5fa', color: '#0a1628' }}
              >
                {sending ? 'Requesting…' : '📋 Request Plan'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [activePlans, setActivePlans] = useState<WBSMeta[]>([])
  const [wbsSlugs, setWbsSlugs] = useState<Set<string>>(new Set())
  const [planModal, setPlanModal] = useState<Project | null>(null)

  useEffect(() => {
    // Load projects
    fetch('/api/projects')
      .then(r => r.json())
      .then(data => setProjects(data.projects ?? []))
      .catch(() => {})

    // Load all WBS slugs + metadata for the Active Plans section
    fetch('/api/wbs')
      .then(r => r.json())
      .then(async (data: { slugs: string[] }) => {
        const slugs = data.slugs ?? []
        setWbsSlugs(new Set(slugs))

        // Fetch metadata for each WBS file to show in Active Plans
        const metas = await Promise.all(
          slugs.map(slug =>
            fetch(`/api/wbs/${slug}`)
              .then(r => r.json())
              .then((wbs): WBSMeta => ({
                slug: wbs.slug,
                title: wbs.title,
                status: wbs.status,
                progress: wbs.progress,
                completedTasks: wbs.completedTasks,
                totalTasks: wbs.totalTasks,
              }))
              .catch(() => null)
          )
        )
        setActivePlans(metas.filter(Boolean) as WBSMeta[])
      })
      .catch(() => {})
  }, [])

  return (
    <div className="max-w-6xl mx-auto pt-8">

      {/* ── Active Plans section ── */}
      {activePlans.length > 0 && (
        <div className="mb-10">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-white tracking-tight">Active Plans</h2>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Work breakdown structures — click to see steps and progress
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activePlans.map(wbs => (
              <ActivePlanCard key={wbs.slug} wbs={wbs} />
            ))}
          </div>
        </div>
      )}

      {/* ── Projects section ── */}
      <div className="mb-8">
        <h1 className="text-lg font-semibold text-white tracking-tight">Projects</h1>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {projects.length} projects in workspace
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map(project => {
          const pc = phaseColor[project.phase] ?? phaseColor['Exploring']
          const hasWBS = wbsSlugs.has(project.id)
          const updated = new Date(project.lastModified).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric',
          })

          return (
            <div
              key={project.id}
              className="rounded-2xl p-5 transition-all hover:brightness-110"
              style={{
                backgroundColor: '#0f2236',
                border: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              {/* Title + Phase badge */}
              <Link href={`/projects/${project.id}`} className="block">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-white font-semibold text-sm">{project.name}</div>
                  <div
                    className="px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ml-2"
                    style={{ backgroundColor: pc.bg, color: pc.color }}
                  >
                    {project.phase}
                  </div>
                </div>
              </Link>

              {/* Tags */}
              <div className="flex gap-2 flex-wrap">
                {project.hasPackageJson && (
                  <span className="text-xs px-2 py-0.5 rounded"
                    style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
                    npm
                  </span>
                )}
                {project.hasAgentsFile && (
                  <span className="text-xs px-2 py-0.5 rounded"
                    style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
                    agents
                  </span>
                )}
              </div>

              <div className="mt-3 text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
                Updated {updated}
              </div>

              {/* WBS / Create Plan buttons */}
              <div className="mt-4 flex gap-2">
                {hasWBS ? (
                  <Link
                    href={`/wbs/${project.id}`}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-semibold transition-opacity hover:opacity-80"
                    style={{ backgroundColor: 'rgba(96,165,250,0.15)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.25)' }}
                  >
                    📋 WBS
                  </Link>
                ) : (
                  <button
                    onClick={() => setPlanModal(project)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-semibold transition-opacity hover:opacity-80"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    + Create Plan
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {planModal && (
        <CreatePlanModal project={planModal} onClose={() => setPlanModal(null)} />
      )}
    </div>
  )
}
