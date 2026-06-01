import fs from 'fs'
import path from 'path'

const WORKSPACE = '/Users/6pf/.openclaw/workspace'
const ACTIVE_WORK_DIR = path.join(WORKSPACE, 'active-work')

export interface WBSTask {
  text: string
  completed: boolean
}

export interface WBSPhase {
  name: string
  tasks: WBSTask[]
  completed: number
  total: number
}

export interface WBSFile {
  slug: string
  title: string
  status: string
  startedDate: string
  goal: string
  phases: WBSPhase[]
  totalTasks: number
  completedTasks: number
  progress: number
  rawPath: string
}

/** Returns a Set of slugs that have a WBS file */
export function getWBSSlugs(): Set<string> {
  const slugs = new Set<string>()
  try {
    if (!fs.existsSync(ACTIVE_WORK_DIR)) return slugs
    const files = fs.readdirSync(ACTIVE_WORK_DIR)
    for (const f of files) {
      if (f.endsWith('.md')) {
        slugs.add(f.replace(/\.md$/, ''))
      }
    }
  } catch {}
  return slugs
}

/** Parse a WBS markdown file into structured data */
export function parseWBSFile(slug: string): WBSFile | null {
  const filePath = path.join(ACTIVE_WORK_DIR, `${slug}.md`)
  if (!fs.existsSync(filePath)) return null

  let raw: string
  try {
    raw = fs.readFileSync(filePath, 'utf-8')
  } catch {
    return null
  }

  const lines = raw.split('\n')

  // Extract title (first # heading)
  const title = lines.find(l => l.startsWith('# '))?.replace(/^# /, '').trim() ?? slug

  // Extract metadata lines
  const statusMatch = raw.match(/\*\*Status:\*\*\s*(.+)/)
  const startedMatch = raw.match(/\*\*Started:\*\*\s*(.+)/)
  const goalMatch = raw.match(/\*\*Goal:\*\*\s*(.+)/)

  const status = statusMatch?.[1]?.trim() ?? 'UNKNOWN'
  const startedDate = startedMatch?.[1]?.trim() ?? ''
  const goal = goalMatch?.[1]?.trim() ?? ''

  // Parse phases and tasks
  const phases: WBSPhase[] = []
  let currentPhase: WBSPhase | null = null

  for (const line of lines) {
    // Phase heading (## )
    if (line.startsWith('## ')) {
      if (currentPhase) phases.push(currentPhase)
      const phaseName = line.replace(/^## /, '').trim()
      currentPhase = { name: phaseName, tasks: [], completed: 0, total: 0 }
      continue
    }

    // Task line (- [ ] or - [x])
    const taskMatch = line.match(/^- \[([ x])\] (.+)/)
    if (taskMatch && currentPhase) {
      const completed = taskMatch[1] === 'x'
      const text = taskMatch[2].trim()
      currentPhase.tasks.push({ text, completed })
      currentPhase.total++
      if (completed) currentPhase.completed++
    }
  }

  if (currentPhase) phases.push(currentPhase)

  const totalTasks = phases.reduce((sum, p) => sum + p.total, 0)
  const completedTasks = phases.reduce((sum, p) => sum + p.completed, 0)
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return {
    slug,
    title,
    status,
    startedDate,
    goal,
    phases,
    totalTasks,
    completedTasks,
    progress,
    rawPath: filePath,
  }
}

/** Get all WBS files parsed */
export function getAllWBSFiles(): WBSFile[] {
  const slugs = getWBSSlugs()
  const result: WBSFile[] = []
  for (const slug of slugs) {
    const wbs = parseWBSFile(slug)
    if (wbs) result.push(wbs)
  }
  return result
}
