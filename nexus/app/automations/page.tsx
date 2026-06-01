'use client'

import { useEffect, useState, useCallback } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface RunEntry { ts: number; status: string; durationMs: number | null }

interface AutomationJob {
  id: string
  name: string
  description: string
  enabled: boolean
  agentId: string
  model: string
  schedule: { expr: string; tz: string; human: string }
  lastRun: { ts: number | null; status: string | null; durationMs: number | null; error: string | null }
  nextRunMs: number | null
  consecutiveErrors: number
  history: RunEntry[]
  costs: { perRun: number; daily: number; monthly: number }
}

interface AutomationsData {
  jobs: AutomationJob[]
  currentMonthTotal: number
  prevMonthTotal: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const AGENT_EMOJI: Record<string, string> = {
  scribe: '📝', ember: '🔥', revs: '🏍️', sysmon: '🛡️', system: '⚙️', main: '⚡',
}

function timeAgo(ms: number | null): string {
  if (!ms) return '—'
  const diff = Date.now() - ms
  const m = Math.floor(diff / 60000)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  if (h < 24) return `${h}h ago`
  return `${d}d ago`
}

function timeUntil(ms: number | null): string {
  if (!ms) return '—'
  const diff = ms - Date.now()
  if (diff < 0) return 'overdue'
  const m = Math.floor(diff / 60000)
  const h = Math.floor(m / 60)
  if (m < 60) return `in ${m}m`
  return `in ${h}h`
}

function fmtDuration(ms: number | null): string {
  if (!ms) return ''
  if (ms < 2000)  return `${ms}ms`
  if (ms < 60000) return `${(ms/1000).toFixed(1)}s`
  return `${(ms/60000).toFixed(1)}m`
}

function fmtCost(usd: number): string {
  if (usd === 0) return '$0'
  if (usd < 0.001) return '<$0.001'
  if (usd < 0.01)  return `$${usd.toFixed(4)}`
  if (usd < 1)     return `$${usd.toFixed(3)}`
  return `$${usd.toFixed(2)}`
}

function modelShort(model: string): string {
  if (model === 'inherited from agent') return 'inherited'
  if (model === 'system') return 'system'
  return model.replace('anthropic/', '').replace('ollama/', '')
}

// ── Mini sparkline ────────────────────────────────────────────────────────────

function Sparkline({ history }: { history: RunEntry[] }) {
  if (history.length === 0) return <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>no history</span>
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
      {history.map((r, i) => {
        const ok = r.status === 'ok'
        return (
          <div
            key={i}
            title={`${new Date(r.ts).toLocaleString()} — ${r.status}${r.durationMs ? ` (${fmtDuration(r.durationMs)})` : ''}`}
            style={{
              width: 10, height: 10, borderRadius: 2,
              backgroundColor: ok ? '#4ade80' : r.status === 'unknown' ? 'rgba(255,255,255,0.15)' : '#ef4444',
              opacity: 0.85,
              cursor: 'default',
            }}
          />
        )
      })}
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginLeft: 4 }}>last {history.length}</span>
    </div>
  )
}

// ── Job card ──────────────────────────────────────────────────────────────────

function JobCard({
  job,
  onToggle,
  toggling,
}: {
  job: AutomationJob
  onToggle: (id: string, enabled: boolean) => void
  toggling: boolean
}) {
  const isError   = job.consecutiveErrors > 0
  const isDisabled = !job.enabled
  const emoji     = AGENT_EMOJI[job.agentId] || '🤖'

  const cardBg     = isError ? 'rgba(239,68,68,0.06)'   : isDisabled ? 'rgba(255,255,255,0.02)' : '#0f2236'
  const cardBorder = isError ? '1px solid rgba(239,68,68,0.3)' : isDisabled ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(255,255,255,0.06)'

  return (
    <div style={{ borderRadius: 16, padding: '20px 24px', background: cardBg, border: cardBorder, opacity: isDisabled ? 0.55 : 1 }}>

      {/* Error banner */}
      {isError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, padding: '6px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <span style={{ fontSize: 13 }}>🚨</span>
          <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 600 }}>
            {job.consecutiveErrors} consecutive error{job.consecutiveErrors > 1 ? 's' : ''}
            {job.lastRun.error ? ` — ${job.lastRun.error.slice(0, 80)}` : ''}
          </span>
        </div>
      )}

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 16 }}>{emoji}</span>
            <span style={{ color: 'white', fontWeight: 600, fontSize: 14 }}>{job.name}</span>
            {isDisabled && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>paused</span>
            )}
          </div>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, lineHeight: 1.5, maxWidth: 480 }}>
            {job.description}
          </p>
        </div>

        {/* Toggle button */}
        <button
          disabled={toggling}
          onClick={() => onToggle(job.id, !job.enabled)}
          style={{
            flexShrink: 0,
            padding: '5px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
            cursor: toggling ? 'wait' : 'pointer',
            background: job.enabled ? 'rgba(239,68,68,0.1)' : 'rgba(74,222,128,0.1)',
            color:      job.enabled ? '#ef4444'              : '#4ade80',
            border:     job.enabled ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(74,222,128,0.25)',
          }}
        >
          {toggling ? '…' : job.enabled ? 'Pause' : 'Resume'}
        </button>
      </div>

      {/* Meta grid */}
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 14 }}>

        <div>
          <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Schedule</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{job.schedule.human}</p>
        </div>

        <div>
          <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Last run</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{timeAgo(job.lastRun.ts)}</span>
            {job.lastRun.status && (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                background: job.lastRun.status === 'ok' ? 'rgba(74,222,128,0.12)' : 'rgba(239,68,68,0.12)',
                color:      job.lastRun.status === 'ok' ? '#4ade80'               : '#ef4444',
              }}>
                {job.lastRun.status === 'ok' ? '✓' : '✗'} {job.lastRun.status}
                {job.lastRun.durationMs ? ` · ${fmtDuration(job.lastRun.durationMs)}` : ''}
              </span>
            )}
          </div>
        </div>

        <div>
          <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Next run</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{timeUntil(job.nextRunMs)}</p>
        </div>

        <div>
          <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Model</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>{modelShort(job.model)}</p>
        </div>

        <div>
          <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Est. cost</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
            {fmtCost(job.costs.monthly)}<span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>/mo</span>
            <span style={{ color: 'rgba(255,255,255,0.2)', marginLeft: 6, fontSize: 10 }}>({fmtCost(job.costs.perRun)}/run)</span>
          </p>
        </div>

      </div>

      {/* Sparkline */}
      <div>
        <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Run history</p>
        <Sparkline history={job.history} />
      </div>

    </div>
  )
}

// ── Budget card ───────────────────────────────────────────────────────────────

function BudgetCard({ current, previous }: { current: number; previous: number }) {
  const prevMonth = new Date(); prevMonth.setMonth(prevMonth.getMonth() - 1)
  const prevLabel = prevMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const currMonth = new Date()
  const currLabel = currMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div style={{ display: 'flex', gap: 1, marginBottom: 28 }}>
      <div style={{ flex: 1, padding: '16px 20px', borderRadius: '16px 0 0 16px', background: '#0f2236', border: '1px solid rgba(255,255,255,0.06)' }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
          {prevLabel} — actual
        </p>
        <p style={{ fontSize: 26, fontWeight: 700, color: previous > 0 ? '#60a5fa' : 'rgba(255,255,255,0.3)' }}>
          {previous > 0 ? fmtCost(previous) : '—'}
        </p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 3 }}>based on completed runs</p>
      </div>
      <div style={{ flex: 1, padding: '16px 20px', borderRadius: '0 16px 16px 0', background: '#0f2236', border: '1px solid rgba(255,255,255,0.06)', borderLeft: '1px solid rgba(255,255,255,0.03)' }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
          {currLabel} — projected
        </p>
        <p style={{ fontSize: 26, fontWeight: 700, color: '#4ade80' }}>
          {fmtCost(current)}
        </p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 3 }}>if all jobs run all month</p>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AutomationsPage() {
  const [data,      setData]      = useState<AutomationsData | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [toggling,  setToggling]  = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/automations')
      const d   = await res.json()
      setData(d)
      setLastUpdated(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Auto-refresh every 30s
  useEffect(() => {
    const t = setInterval(fetchData, 30_000)
    return () => clearInterval(t)
  }, [fetchData])

  const handleToggle = async (id: string, enabled: boolean) => {
    setToggling(id)
    try {
      await fetch('/api/automations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, enabled }),
      })
      await fetchData()
    } catch {}
    setToggling(null)
  }

  const active   = data?.jobs.filter(j => j.enabled)  ?? []
  const paused   = data?.jobs.filter(j => !j.enabled) ?? []
  const erroring = active.filter(j => j.consecutiveErrors > 0)

  return (
    <div className="max-w-screen-lg mx-auto pt-8 pb-16">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Automations</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 }}>
            {active.length} active · {paused.length} paused
            {erroring.length > 0 && (
              <span style={{ color: '#ef4444', fontWeight: 600 }}> · {erroring.length} erroring</span>
            )}
            <span style={{ color: 'rgba(255,255,255,0.2)', marginLeft: 8, fontSize: 11 }}>updated {lastUpdated}</span>
          </p>
        </div>
        <button
          onClick={fetchData}
          style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Loading…</p>
      ) : !data ? (
        <p style={{ color: '#ef4444', fontSize: 13 }}>Failed to load automations.</p>
      ) : (
        <>
          {/* Budget */}
          <BudgetCard current={data.currentMonthTotal} previous={data.prevMonthTotal} />

          {/* ── Erroring jobs — pinned top ── */}
          {erroring.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  ⚠ Needs attention
                </span>
                <div style={{ flex: 1, height: 1, background: 'rgba(239,68,68,0.2)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {erroring.map(job => (
                  <JobCard key={job.id} job={job} onToggle={handleToggle} toggling={toggling === job.id} />
                ))}
              </div>
            </div>
          )}

          {/* ── Active jobs ── */}
          {active.filter(j => j.consecutiveErrors === 0).length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Active
                </span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {active.filter(j => j.consecutiveErrors === 0).map(job => (
                  <JobCard key={job.id} job={job} onToggle={handleToggle} toggling={toggling === job.id} />
                ))}
              </div>
            </div>
          )}

          {/* ── Paused jobs ── */}
          {paused.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Paused
                </span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.04)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {paused.map(job => (
                  <JobCard key={job.id} job={job} onToggle={handleToggle} toggling={toggling === job.id} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
