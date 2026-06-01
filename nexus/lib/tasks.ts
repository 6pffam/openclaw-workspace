import fs from 'fs'
import path from 'path'

const WORKSPACE = '/Users/6pf/.openclaw/workspace'

export type TaskStatus = 'backlog' | 'in-progress' | 'paused' | 'pending-approval' | 'rejected' | 'done'
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low'

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  assignee: string
  project: string | null
  priority: TaskPriority
  createdAt: string
  gitSha?: string        // SHA captured when moved to pending-approval
  rejectedAt?: string    // timestamp of rejection
  revertStatus?: 'ok' | 'conflict' | 'no-sha' // result of git revert
}

export interface TaskData {
  version: string
  updatedAt: string
  tasks: Task[]
}

export function readTaskData(): TaskData | null {
  const p = path.join(WORKSPACE, 'nexus', 'data', 'tasks.json')
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8'))
  } catch {
    return null
  }
}
