import fs from 'fs'
import path from 'path'

const AGENTS_DIR = '/Users/6pf/.openclaw/agents'

// Pricing in USD per 1M tokens (May 2026)
const MODEL_PRICING: Record<string, { input: number; output: number; cacheWrite: number; cacheRead: number }> = {
  'claude-sonnet-4-6':  { input: 3.00,  output: 15.00, cacheWrite: 3.75, cacheRead: 0.30 },
  'claude-opus-4-7':    { input: 15.00, output: 75.00, cacheWrite: 18.75, cacheRead: 1.50 },
  'claude-haiku-4-5':   { input: 0.80,  output: 4.00,  cacheWrite: 1.00, cacheRead: 0.08 },
  'claude-haiku-3-5':   { input: 0.80,  output: 4.00,  cacheWrite: 1.00, cacheRead: 0.08 },
}

const USD_TO_CHF = 0.90

export interface AgentCosts {
  model: string
  currentMonthUsd: number
  previousMonthUsd: number
  currentMonthChf: number
  previousMonthChf: number
  /** Timestamp (ms) of the most recent data point, or null if no data */
  dataAsOf: number | null
  /** Whether costs are based on the OpenClaw cache (accurate) or trajectory estimates */
  source: 'cache' | 'trajectory' | 'none'
}

// ─── OpenClaw Usage Cache ─────────────────────────────────────────────────────
// OpenClaw writes .usage-cost-cache.json in the agent's sessions dir.
// Each entry has a pre-computed totalCost and per-call timestamp.
// This is the most accurate source available.

interface UsageEntry {
  timestamp: number
  provider: string
  model: string
  totalCost: number
  cacheWrite?: number
  input?: number
  output?: number
}

interface CacheFile {
  usageEntries: UsageEntry[]
  filePath?: string
  mtimeMs?: number
}

interface UsageCostCache {
  version: number
  updatedAt: number
  files: Record<string, CacheFile>
}

function readOpenClawCache(sessionsDir: string): UsageCostCache | null {
  const cachePath = path.join(sessionsDir, '.usage-cost-cache.json')
  if (!fs.existsSync(cachePath)) return null
  try {
    const raw = fs.readFileSync(cachePath, 'utf-8')
    return JSON.parse(raw) as UsageCostCache
  } catch {
    return null
  }
}

// ─── Trajectory Fallback ──────────────────────────────────────────────────────
// For agents without a cache, or for sessions after the cache was last updated,
// parse .trajectory.jsonl files.

function calcCostUsd(
  model: string,
  usage: { input: number; output: number; cacheWrite: number; cacheRead?: number }
): number {
  const pricing = MODEL_PRICING[model]
  if (!pricing) return 0 // local models (Ollama) = $0

  return (
    (usage.input / 1_000_000) * pricing.input +
    (usage.output / 1_000_000) * pricing.output +
    (usage.cacheWrite / 1_000_000) * pricing.cacheWrite +
    ((usage.cacheRead ?? 0) / 1_000_000) * pricing.cacheRead
  )
}

function costFromTrajectory(
  sessionsDir: string,
  excludeJsonlNames: Set<string>,
  currentYear: number,
  currentMonth: number,
  prevYear: number,
  prevMonth: number
): { currentUsd: number; previousUsd: number; model: string; latestTs: number | null } {
  let currentUsd = 0
  let previousUsd = 0
  let model = 'unknown'
  let latestTs: number | null = null

  try {
    const files = fs.readdirSync(sessionsDir).filter(f => f.endsWith('.trajectory.jsonl'))

    for (const file of files) {
      // Skip if the corresponding .jsonl is already covered by the cache
      const jsonlName = file.replace('.trajectory.jsonl', '.jsonl')
      if (excludeJsonlNames.has(jsonlName)) continue

      const filePath = path.join(sessionsDir, file)
      let fileTs: Date | null = null
      let fileModel = ''
      const usageByRun: Record<string, { input: number; output: number; cacheWrite: number; cacheRead: number; model: string }> = {}

      try {
        const lines = fs.readFileSync(filePath, 'utf-8').split('\n')
        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const d = JSON.parse(line)

            if (!fileTs && d.ts) {
              fileTs = new Date(d.ts)
            }
            if (!fileModel) {
              fileModel = d.modelId || (d.type === 'trace.metadata' && d.data?.model?.name) || ''
            }
            if (!model || model === 'unknown') model = fileModel || model

            if (d.type === 'trace.artifacts') {
              const usage = d.data?.usage
              const runId = d.runId
              const runModel = d.modelId || fileModel
              if (usage && runId && (usage.input || usage.output || usage.cacheWrite || usage.cacheRead)) {
                usageByRun[runId] = {
                  input: usage.input ?? 0,
                  output: usage.output ?? 0,
                  cacheWrite: usage.cacheWrite ?? 0,
                  cacheRead: usage.cacheRead ?? 0,
                  model: runModel,
                }
              }
            }
          } catch { /* skip malformed lines */ }
        }
      } catch { continue }

      if (!fileTs) continue

      const fileYear = fileTs.getUTCFullYear()
      const fileMonth = fileTs.getUTCMonth()
      const isCurrentMonth = fileYear === currentYear && fileMonth === currentMonth
      const isPrevMonth = fileYear === prevYear && fileMonth === prevMonth

      if (isCurrentMonth || isPrevMonth) {
        for (const u of Object.values(usageByRun)) {
          const cost = calcCostUsd(u.model, u)
          if (isCurrentMonth) {
            currentUsd += cost
            const ts = fileTs.getTime()
            if (!latestTs || ts > latestTs) latestTs = ts
          }
          if (isPrevMonth) previousUsd += cost
        }
      }
    }
  } catch { /* fail gracefully */ }

  return { currentUsd, previousUsd, model, latestTs }
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function getAgentCosts(agentId: string): AgentCosts {
  const now = new Date()
  const currentYear = now.getUTCFullYear()
  const currentMonth = now.getUTCMonth() // 0-based
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear

  const sessionsDir = path.join(AGENTS_DIR, agentId, 'sessions')
  if (!fs.existsSync(sessionsDir)) {
    return { model: 'unknown', currentMonthUsd: 0, previousMonthUsd: 0, currentMonthChf: 0, previousMonthChf: 0, dataAsOf: null, source: 'none' }
  }

  let model = 'unknown'
  let currentUsd = 0
  let previousUsd = 0
  let latestTs: number | null = null
  let source: 'cache' | 'trajectory' | 'none' = 'none'

  // ── 1. Read OpenClaw cost cache (authoritative) ───────────────────────────
  const ocCache = readOpenClawCache(sessionsDir)
  const cachedJsonlNames = new Set<string>()

  if (ocCache?.files) {
    source = 'cache'
    for (const [filePath, fileInfo] of Object.entries(ocCache.files)) {
      cachedJsonlNames.add(path.basename(filePath))
      for (const entry of fileInfo.usageEntries ?? []) {
        if (!entry.timestamp) continue
        const d = new Date(entry.timestamp)
        const y = d.getUTCFullYear()
        const m = d.getUTCMonth()
        if (y === currentYear && m === currentMonth) {
          currentUsd += entry.totalCost ?? 0
          if (!latestTs || entry.timestamp > latestTs) latestTs = entry.timestamp
        } else if (y === prevYear && m === prevMonth) {
          previousUsd += entry.totalCost ?? 0
        }
        // capture model from cache entry
        if (model === 'unknown' && entry.model) model = entry.model
      }
    }
  }

  // ── 2. Trajectory fallback for uncached sessions ──────────────────────────
  // Always run this to capture sessions newer than the cache's last update.
  const traj = costFromTrajectory(
    sessionsDir,
    cachedJsonlNames,
    currentYear,
    currentMonth,
    prevYear,
    prevMonth
  )

  if (traj.currentUsd > 0 || traj.previousUsd > 0) {
    if (source === 'none') source = 'trajectory'
    currentUsd += traj.currentUsd
    previousUsd += traj.previousUsd
    if (traj.latestTs && (!latestTs || traj.latestTs > latestTs)) latestTs = traj.latestTs
    if (model === 'unknown' && traj.model !== 'unknown') model = traj.model
  }

  if (source === 'none') source = 'none'

  return {
    model,
    currentMonthUsd: currentUsd,
    previousMonthUsd: previousUsd,
    currentMonthChf: currentUsd * USD_TO_CHF,
    previousMonthChf: previousUsd * USD_TO_CHF,
    dataAsOf: latestTs,
    source,
  }
}
