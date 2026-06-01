import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { readTaskData } from '@/lib/tasks'
import { readCrewData, getAgentLiveStatus } from '@/lib/workspace'

const WORKSPACE = '/Users/6pf/.openclaw/workspace'
const ARTIFACTS_DIR = path.join(WORKSPACE, 'artifacts')
const MEMORY_DIR = path.join(WORKSPACE, 'memory')

export const dynamic = 'force-dynamic'

interface ArtifactPreview {
  filename: string
  date: string
  title: string
  preview: string
}

function getLatestAgentArtifact(agentPrefix: string): ArtifactPreview | null {
  try {
    if (!fs.existsSync(ARTIFACTS_DIR)) return null
    const files = fs.readdirSync(ARTIFACTS_DIR)
      .filter(f => f.endsWith('.md') && f.toLowerCase().includes(agentPrefix.toLowerCase()))
      .sort((a, b) => b.localeCompare(a)) // most recent first by date prefix
    if (files.length === 0) return null
    const filename = files[0]
    const content = fs.readFileSync(path.join(ARTIFACTS_DIR, filename), 'utf-8')
    const lines = content.split('\n').filter(l => l.trim())
    const title = lines.find(l => l.startsWith('# '))?.replace(/^# /, '') ?? filename
    const preview = lines.filter(l => !l.startsWith('#')).slice(0, 2).join(' ').slice(0, 150)
    // Extract date from filename (YYYY-MM-DD prefix)
    const dateMatch = filename.match(/^(\d{4}-\d{2}-\d{2})/)
    return { filename, date: dateMatch?.[1] ?? '', title, preview }
  } catch {
    return null
  }
}

function getTodayMemoryHeadline(): string | null {
  try {
    const today = new Date().toISOString().split('T')[0]
    const filePath = path.join(MEMORY_DIR, `${today}.md`)
    if (!fs.existsSync(filePath)) return null
    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'))
    return lines.slice(0, 3).join(' ').slice(0, 200) || null
  } catch {
    return null
  }
}

export async function GET() {
  // Tasks
  const taskData = readTaskData()
  const tasks = taskData?.tasks ?? []
  const pendingApproval = tasks.filter((t: { status: string }) => t.status === 'pending-approval')
  const inProgress = tasks.filter((t: { status: string }) => t.status === 'in-progress')

  // Crew active count
  const crewData = readCrewData()
  const agentMembers = (crewData?.members ?? []).filter((m: { agentId?: string | null }) => m.agentId)
  const activeCount = agentMembers.filter((m: { agentId: string }) => getAgentLiveStatus(m.agentId) === 'active').length

  // Latest agent artifacts
  const emberArtifact = getLatestAgentArtifact('ember')
  const revsArtifact = getLatestAgentArtifact('revs')

  // Today's memory headline
  const memoryHeadline = getTodayMemoryHeadline()

  // Today's date info
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    timeZone: 'Europe/Zurich'
  })
  const timeStr = now.toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Europe/Zurich'
  })

  return NextResponse.json({
    date: dateStr,
    time: timeStr,
    tasks: {
      pendingApproval: pendingApproval.length,
      inProgress: inProgress.length,
      pendingItems: pendingApproval.map((t: { id: string; title: string }) => ({ id: t.id, title: t.title })),
    },
    crew: {
      activeCount,
      totalAgents: agentMembers.length,
    },
    ember: emberArtifact,
    revs: revsArtifact,
    memoryHeadline,
  })
}
