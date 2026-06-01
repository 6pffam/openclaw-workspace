import fs from 'fs'
import path from 'path'

const WORKSPACE = '/Users/6pf/.openclaw/workspace'
const AGENTS_DIR = '/Users/6pf/.openclaw/agents'
const SESSIONS_FILE = '/Users/6pf/.openclaw/agents/main/sessions/sessions.json'
const OPENCLAW_CONFIG = '/Users/6pf/.openclaw/openclaw.json'

// ── Configured model lookup ──────────────────────────────────────────────────
// Reads the actual configured model from openclaw.json rather than inferring
// it from session history. Falls back to the global default if not overridden.

interface AgentModelInfo {
  /** Primary model id (e.g. "anthropic/claude-sonnet-4-6") */
  primary: string
  /** Secondary model id — set for FORGE (qwen-coder for file writes) */
  secondary?: string
}

let _configCache: { data: Record<string, AgentModelInfo>; mtime: number } | null = null

export function getConfiguredModels(): Record<string, AgentModelInfo> {
  try {
    const mtime = fs.statSync(OPENCLAW_CONFIG).mtimeMs
    if (_configCache && _configCache.mtime === mtime) return _configCache.data

    const config = JSON.parse(fs.readFileSync(OPENCLAW_CONFIG, 'utf-8'))
    const defaultPrimary: string =
      config?.agents?.defaults?.model?.primary ?? 'anthropic/claude-sonnet-4-6'
    const agents: Array<{ id: string; model?: { primary?: string } }> =
      config?.agents?.list ?? []

    const result: Record<string, AgentModelInfo> = {}
    for (const agent of agents) {
      const primary = agent.model?.primary ?? defaultPrimary
      const info: AgentModelInfo = { primary }

      // FORGE uses qwen-coder for writing files — encode that as secondary
      if (agent.id === 'forge') {
        const ollamaModels: Array<{ id?: string; alias?: string }> =
          config?.models?.providers?.ollama?.models ?? []
        const coderEntry = ollamaModels.find(
          m => m.id?.includes('coder') || m.alias?.includes('coder')
        )
        if (coderEntry?.id) {
          info.secondary = `ollama/${coderEntry.id}`
        }
      }

      result[agent.id] = info
    }

    _configCache = { data: result, mtime }
    return result
  } catch {
    return {}
  }
}

export function getAgentConfiguredModel(agentId: string): AgentModelInfo | null {
  const models = getConfiguredModels()
  return models[agentId] ?? null
}

export function readCrewData() {
  const p = path.join(WORKSPACE, 'nexus', 'data', 'crew.json')
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8'))
  } catch {
    return null
  }
}

export function readSessionsData() {
  try {
    return JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf-8'))
  } catch {
    return null
  }
}

export function getAgentLastActiveMs(agentId: string): number | null {
  try {
    const sessionsDir = path.join(AGENTS_DIR, agentId, 'sessions')
    if (!fs.existsSync(sessionsDir)) return null
    const files = fs.readdirSync(sessionsDir)
      .filter(f => f.endsWith('.jsonl'))
      .map(f => fs.statSync(path.join(sessionsDir, f)).mtime.getTime())
    if (files.length === 0) return null
    return Math.max(...files)
  } catch {
    return null
  }
}

export function getAgentLiveStatus(agentId: string): 'active' | 'idle' {
  const lastActive = getAgentLastActiveMs(agentId)
  if (lastActive === null) return 'idle'
  const tenMinutes = 10 * 60 * 1000
  return Date.now() - lastActive < tenMinutes ? 'active' : 'idle'
}

export function hasRecentMainSession(): boolean {
  return getAgentLiveStatus('main') === 'active'
}

export function enrichCrewWithLiveStatus(members: import('./types').CrewMember[]): import('./types').CrewMember[] {
  return members.map(m => {
    // Planned agents (no agentId) stay planned
    if (m.status === 'planned' || !m.agentId) return m
    // Live agents: derive status + lastActiveAt from actual session activity
    const lastActiveAt = getAgentLastActiveMs(m.agentId)
    const status = lastActiveAt !== null && Date.now() - lastActiveAt < 10 * 60 * 1000
      ? 'active' as const
      : 'idle' as const
    return { ...m, status, lastActiveAt }
  })
}
