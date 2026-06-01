import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

export const dynamic = 'force-dynamic'

const OPENCLAW_DIR = path.join(process.env.HOME || '/Users/6pf', '.openclaw')
const CRON_DIR     = path.join(OPENCLAW_DIR, 'cron')
const JOBS_FILE    = path.join(CRON_DIR, 'jobs.json')
const STATE_FILE   = path.join(CRON_DIR, 'jobs-state.json')
const RUNS_DIR     = path.join(CRON_DIR, 'runs')
const OC_JSON      = path.join(OPENCLAW_DIR, 'openclaw.json')

function getAgentModel(agentId: string): string | null {
  try {
    const cfg  = JSON.parse(fs.readFileSync(OC_JSON, 'utf-8'))
    const list = cfg?.agents?.list as { id: string; model?: { primary?: string } }[]
    const agent = list?.find(a => a.id === agentId)
    return agent?.model?.primary || null
  } catch { return null }
}

// ── Pricing (USD per 1M tokens) ───────────────────────────────────────────────
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'anthropic/claude-sonnet-4-6': { input: 3.00,  output: 15.00 },
  'anthropic/claude-haiku-3-5':  { input: 0.80,  output: 4.00  },
  'anthropic/claude-opus-4-7':   { input: 15.00, output: 75.00 },
}

// Estimated token usage per job type (input, output)
const JOB_TOKENS: Record<string, { input: number; output: number }> = {
  '58f00d91': { input: 0,    output: 0    }, // Memory Dreaming — system, no LLM
  '9fdecbcd': { input: 4000, output: 600  }, // SCRIBE wiki sync
  '3a4ed47c': { input: 5000, output: 2000 }, // EMBER weekly digest
  'c3301619': { input: 3500, output: 1000 }, // REVS riding brief
  '0f86118b': { input: 910,  output: 5    }, // SYSMON 14:00
  '2d81194e': { input: 910,  output: 5    }, // SYSMON 23:00
}

// How many times per month each cron fires
function runsPerMonth(expr: string): number {
  const parts = expr.trim().split(/\s+/)
  // "0 * * * *" → hourly, "0 2 * * *" → daily, "0 8 * * 1" → weekly
  const dow  = parts[4]
  const dom  = parts[2]
  if (dow !== '*') return 4.3   // weekly
  if (dom !== '*') return 1     // monthly
  return 30                     // daily
}

function estimateCostUsd(jobId: string, model: string | null, cronExpr: string): {
  perRun: number; daily: number; monthly: number
} {
  if (!model || !MODEL_PRICING[model]) return { perRun: 0, daily: 0, monthly: 0 }
  const pricing = MODEL_PRICING[model]
  const shortId = jobId.slice(0, 8)
  const tokens = JOB_TOKENS[shortId] || { input: 2000, output: 200 }
  const perRun = (tokens.input / 1_000_000) * pricing.input
               + (tokens.output / 1_000_000) * pricing.output
  const rpm    = runsPerMonth(cronExpr)
  return {
    perRun,
    daily:   perRun * (30 / 30) * (rpm === 30 ? 1 : rpm < 5 ? rpm / 30 : 1),
    monthly: perRun * rpm,
  }
}

// ── Run history ───────────────────────────────────────────────────────────────
function getRunHistory(jobId: string, limit = 5): { ts: number; status: string; durationMs: number | null }[] {
  const file = path.join(RUNS_DIR, `${jobId}.jsonl`)
  if (!fs.existsSync(file)) return []
  try {
    const lines = fs.readFileSync(file, 'utf-8').trim().split('\n').filter(Boolean)
    return lines
      .map(l => { try { return JSON.parse(l) } catch { return null } })
      .filter(Boolean)
      .map((r: Record<string, unknown>) => ({
        ts:         (r.startedAtMs as number) || (r.ts as number) || 0,
        status:     (r.status as string) || (r.result as string) || 'unknown',
        durationMs: (r.durationMs as number) || null,
      }))
      .sort((a, b) => b.ts - a.ts)
      .slice(0, limit)
  } catch { return [] }
}

// ── Human-readable schedule ───────────────────────────────────────────────────
function humanSchedule(expr: string, tz?: string): string {
  const parts = expr.trim().split(/\s+/)
  const [min, hour, dom, , dow] = parts
  const tzLabel = tz ? ` ${tz.replace('Europe/', '')}` : ''
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  if (dow !== '*') return `Every ${days[Number(dow)]} at ${hour}:${min.padStart(2,'0')}${tzLabel}`
  if (dom !== '*') return `Monthly on day ${dom} at ${hour}:${min.padStart(2,'0')}${tzLabel}`
  return `Daily at ${hour}:${min.padStart(2,'0')}${tzLabel}`
}

// ── Descriptions ─────────────────────────────────────────────────────────────
const DESCRIPTIONS: Record<string, string> = {
  '58f00d91': 'Promotes significant short-term memories into long-term storage (MEMORY.md). Filters by relevance score, recency, and recall frequency.',
  '9fdecbcd': 'SCRIBE reads today\'s session logs and updates the knowledge wiki. Keeps all project, team, and topic pages automatically current.',
  '3a4ed47c': 'EMBER researches 3 business opportunities relevant to your profile, stress-tests each idea commercially, and delivers a weekly digest.',
  'c3301619': 'REVS compiles the week\'s top motorbike news, a gear pick, Chigee AIO-6 updates, and an Alpine route suggestion every Friday.',
  '0f86118b': 'Security health check — runs openclaw security audit. Silent on success. Alerts #alers channel immediately on any critical finding.',
  '2d81194e': 'Second daily security sweep. Ensures the system stays clean overnight before the next working day.',
}

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const jobs: Record<string, unknown>[]   = JSON.parse(fs.readFileSync(JOBS_FILE,  'utf-8'))
    const stateFile: Record<string, unknown> = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'))
    const stateMap = (stateFile.jobs || {}) as Record<string, { state: Record<string, unknown> }>

    const enriched = jobs.map((job: Record<string, unknown>) => {
      const id       = job.id as string
      const shortId  = id.slice(0, 8)
      const schedule = job.schedule as { kind: string; expr: string; tz?: string }
      const payload  = job.payload as Record<string, unknown>
      const rawModel = (payload?.model as string) || null
      const model    = rawModel || (job.agentId ? getAgentModel(job.agentId as string) : null)

      const stateEntry = stateMap[id]?.state || {}
      const history    = getRunHistory(id)
      const costs      = estimateCostUsd(id, model, schedule.expr)

      return {
        id,
        name:        job.name,
        description: DESCRIPTIONS[shortId] || 'Scheduled automation.',
        enabled:     job.enabled !== false,
        agentId:     (job.agentId as string) || 'system',
        model:       model || (job.agentId ? 'system' : 'system'),
        modelResolved: model,
        schedule: {
          expr:  schedule.expr,
          tz:    schedule.tz || 'UTC',
          human: humanSchedule(schedule.expr, schedule.tz),
        },
        lastRun: {
          ts:         (stateEntry.lastRunAtMs as number)  || null,
          status:     (stateEntry.lastRunStatus as string) || null,
          durationMs: (stateEntry.lastDurationMs as number) || null,
          error:      (stateEntry.lastError as string)    || null,
        },
        nextRunMs:         (stateEntry.nextRunAtMs as number) || null,
        consecutiveErrors: (stateEntry.consecutiveErrors as number) || 0,
        history,
        costs,
      }
    })

    // Sort: errors first, then by name
    enriched.sort((a, b) => {
      if (a.consecutiveErrors > 0 && b.consecutiveErrors === 0) return -1
      if (a.consecutiveErrors === 0 && b.consecutiveErrors > 0) return 1
      return (a.name as string).localeCompare(b.name as string)
    })

    // Previous-month cost from run history (count actual runs × perRun estimate)
    const prevMonthTotal = enriched.reduce((sum, job) => {
      const allRuns = getRunHistory(job.id as string, 60)
      const now = Date.now()
      const prevMonthStart = new Date(now); prevMonthStart.setMonth(prevMonthStart.getMonth() - 1); prevMonthStart.setDate(1); prevMonthStart.setHours(0,0,0,0)
      const prevMonthEnd   = new Date(prevMonthStart); prevMonthEnd.setMonth(prevMonthEnd.getMonth() + 1)
      const prevRuns = allRuns.filter(r => r.ts >= prevMonthStart.getTime() && r.ts < prevMonthEnd.getTime() && r.status === 'ok')
      return sum + prevRuns.length * (job.costs as { perRun: number }).perRun
    }, 0)

    const currentMonthTotal = enriched.reduce((sum, job) => sum + (job.costs as { monthly: number }).monthly, 0)

    return NextResponse.json({ jobs: enriched, currentMonthTotal, prevMonthTotal })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// ── PATCH — enable / disable ──────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const { id, enabled } = await req.json() as { id: string; enabled: boolean }
    const jobs: Record<string, unknown>[] = JSON.parse(fs.readFileSync(JOBS_FILE, 'utf-8'))
    const job = jobs.find(j => j.id === id)
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

    job.enabled = enabled

    fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2))

    // Signal gateway to reload cron config
    try {
      execSync('launchctl kickstart -k gui/$UID/ai.openclaw.gateway 2>/dev/null || true', { timeout: 5000 })
    } catch { /* ignore — jobs.json write is enough for next reload */ }

    return NextResponse.json({ ok: true, id, enabled })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
