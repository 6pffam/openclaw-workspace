'use client'

import { useEffect, useState } from 'react'
import type { Task } from '@/lib/tasks'

const COLUMNS = [
  { key: 'pending-approval', label: 'Needs Approval', color: '#ef4444' },
  { key: 'in-progress',      label: 'In Progress',    color: 'rgba(255,255,255,0.4)' },
  { key: 'backlog',          label: 'Backlog',         color: 'rgba(255,255,255,0.4)' },
  { key: 'done',             label: 'Done',            color: 'rgba(255,255,255,0.4)' },
  { key: 'rejected',         label: 'Rejected',        color: '#a78bfa' },
  { key: 'paused',           label: 'Paused',          color: '#f59e0b' },
]

const PRIORITY_COLOR: Record<string, string> = {
  urgent: '#ef4444',
  high:   '#f59e0b',
  medium: '#60a5fa',
  low:    'rgba(255,255,255,0.3)',
}

const ASSIGNEE_EMOJI: Record<string, string> = {
  'ceo':               '👤',
  'chief-of-staff':    '🎯',
  'coder':             '💻',
  'qa':                '🔍',
  'project-manager':   '📋',
  'researcher':        '🔬',
  'financial-advisor': '💰',
}

const NEXT_STATUS: Record<string, string> = {
  'backlog':     'in-progress',
  'in-progress': 'done',
  'done':        'backlog',
}

const ACTION_LABEL: Record<string, string> = {
  'backlog':     'Start',
  'in-progress': 'Complete',
  'done':        'Reopen',
}

async function patchStatus(id: string, status: string) {
  await fetch('/api/tasks', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, status }),
  })
}

function TaskCard({ task, onUpdate }: { task: Task; onUpdate: () => void }) {
  const isApproval = task.status === 'pending-approval'
  const isRejected = task.status === 'rejected'
  const isInProgress = task.status === 'in-progress'
  const isPaused = task.status === 'paused'
  const dotColor = PRIORITY_COLOR[task.priority] ?? 'rgba(255,255,255,0.3)'
  const emoji = ASSIGNEE_EMOJI[task.assignee] ?? '🤖'

  async function handleApprove() {
    await patchStatus(task.id, 'done')
    await fetch('/api/tasks/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskTitle: task.title, gitSha: task.gitSha }),
    })
    onUpdate()
  }

  async function handleReject() {
    await fetch('/api/tasks/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: task.id }),
    })
    onUpdate()
  }

  async function handleRequestApproval() {
    await patchStatus(task.id, 'pending-approval')
    onUpdate()
  }

  async function handleAction() {
    await patchStatus(task.id, NEXT_STATUS[task.status])
    onUpdate()
  }

  return (
    <div
      className="rounded-xl p-4 mb-3"
      style={{
        backgroundColor: isApproval
          ? 'rgba(239,68,68,0.08)'
          : isRejected
          ? 'rgba(167,139,250,0.06)'
          : isPaused
          ? 'rgba(245,158,11,0.06)'
          : '#0f2236',
        border: isApproval
          ? '1px solid rgba(239,68,68,0.3)'
          : isRejected
          ? '1px solid rgba(167,139,250,0.2)'
          : isPaused
          ? '1px solid rgba(245,158,11,0.2)'
          : '1px solid rgba(255,255,255,0.04)',
      }}
    >
      {/* Title row */}
      <div className="flex items-start gap-2 mb-2">
        <p className="text-white text-sm font-medium leading-snug flex-1">{task.title}</p>
        <span className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ backgroundColor: dotColor }} />
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs leading-relaxed mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {task.description}
        </p>
      )}

      {/* Git SHA badge */}
      {task.gitSha && (
        <div className="mb-2">
          <span
            className="text-xs px-2 py-0.5 rounded font-mono"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }}
          >
            {task.gitSha.slice(0, 7)}
          </span>
        </div>
      )}

      {/* Revert status badge for rejected tasks */}
      {isRejected && task.revertStatus && (
        <div className="mb-2">
          {task.revertStatus === 'ok' && (
            <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(52,211,153,0.1)', color: '#34d399' }}>
              ✓ Auto-reverted
            </span>
          )}
          {task.revertStatus === 'conflict' && (
            <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
              ⚠ Revert conflict — manual cleanup needed
            </span>
          )}
        </div>
      )}

      {/* Actions row */}
      <div className="flex items-center justify-between gap-2 mt-3">
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
          {emoji} {task.assignee}
        </span>

        <div className="flex gap-1.5">
          {/* Pending approval: Approve + Reject */}
          {isApproval && (
            <>
              <button
                onClick={handleReject}
                className="text-xs px-3 py-1 rounded-lg transition-all"
                style={{ backgroundColor: 'rgba(167,139,250,0.15)', color: '#a78bfa' }}
              >
                Reject
              </button>
              <button
                onClick={handleApprove}
                className="text-xs px-3 py-1 rounded-lg transition-all font-medium"
                style={{ backgroundColor: 'rgba(52,211,153,0.15)', color: '#34d399' }}
              >
                Approve
              </button>
            </>
          )}

          {/* In-progress: Pause + Request Approval + Complete */}
          {isInProgress && (
            <>
              <button
                onClick={() => patchStatus(task.id, 'paused').then(onUpdate)}
                className="text-xs px-3 py-1 rounded-lg transition-all"
                style={{ backgroundColor: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}
              >
                Pause
              </button>
              <button
                onClick={handleRequestApproval}
                className="text-xs px-3 py-1 rounded-lg transition-all"
                style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: 'rgba(239,68,68,0.7)' }}
              >
                Request Approval
              </button>
              <button
                onClick={handleAction}
                className="text-xs px-3 py-1 rounded-lg transition-all"
                style={{ backgroundColor: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}
              >
                Complete
              </button>
            </>
          )}

          {/* Paused: Resume button */}
          {isPaused && (
            <button
              onClick={() => patchStatus(task.id, 'in-progress').then(onUpdate)}
              className="text-xs px-3 py-1 rounded-lg transition-all font-medium"
              style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}
            >
              Resume
            </button>
          )}

          {/* All other statuses: single action */}
          {!isApproval && !isInProgress && !isRejected && !isPaused && (
            <button
              onClick={handleAction}
              className="text-xs px-3 py-1 rounded-lg transition-all"
              style={{ backgroundColor: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}
            >
              {ACTION_LABEL[task.status] ?? 'Move'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function NewTaskForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [assignee, setAssignee] = useState('ceo')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, assignee }),
    })
    setTitle('')
    setOpen(false)
    onCreated()
  }

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      className="text-xs px-4 py-1.5 rounded-lg transition-all"
      style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
    >
      + New Task
    </button>
  )

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        autoFocus value={title} onChange={e => setTitle(e.target.value)}
        placeholder="Task title..."
        className="text-xs px-3 py-1.5 rounded-lg outline-none flex-1"
        style={{ backgroundColor: '#0f2236', border: '1px solid rgba(255,255,255,0.12)', color: 'white' }}
      />
      <select
        value={assignee} onChange={e => setAssignee(e.target.value)}
        className="text-xs px-2 py-1.5 rounded-lg outline-none"
        style={{ backgroundColor: '#0f2236', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)' }}
      >
        <option value="ceo">CEO</option>
        <option value="chief-of-staff">Chief of Staff</option>
        <option value="coder">Coder</option>
        <option value="qa">QA</option>
        <option value="project-manager">PM</option>
        <option value="researcher">Researcher</option>
        <option value="financial-advisor">Finance</option>
      </select>
      <button type="submit"
        className="text-xs px-3 py-1.5 rounded-lg"
        style={{ backgroundColor: 'rgba(96,165,250,0.2)', color: '#60a5fa' }}
      >Add</button>
      <button type="button" onClick={() => setOpen(false)}
        className="text-xs px-3 py-1.5 rounded-lg"
        style={{ backgroundColor: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)' }}
      >Cancel</button>
    </form>
  )
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])

  async function fetchTasks() {
    try {
      const res = await fetch('/api/tasks')
      const data = await res.json()
      setTasks(data.tasks ?? [])
    } catch {}
  }

  useEffect(() => { fetchTasks() }, [])

  const approvalCount = tasks.filter(t => t.status === 'pending-approval').length

  return (
    <div className="max-w-screen-xl mx-auto pt-8">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Tasks</h1>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {tasks.length} tasks{approvalCount > 0 ? ` · ${approvalCount} need your approval` : ''}
          </p>
        </div>
        <NewTaskForm onCreated={fetchTasks} />
      </div>

      <div className="kanban-scroll md:grid md:grid-cols-2 lg:grid-cols-6 gap-4">
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.key)
          const isUrgent = col.key === 'pending-approval' && colTasks.length > 0
          const badgeBg = isUrgent ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)'
          const badgeColor = isUrgent ? '#ef4444' : 'rgba(255,255,255,0.3)'

          return (
            <div key={col.key} className="kanban-col">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: col.color }}>
                  {col.label}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: badgeBg, color: badgeColor }}>
                  {colTasks.length}
                </span>
              </div>
              {colTasks.map(task => (
                <TaskCard key={task.id} task={task} onUpdate={fetchTasks} />
              ))}
              {colTasks.length === 0 && (
                <div
                  className="rounded-xl p-4 text-xs text-center"
                  style={{ color: 'rgba(255,255,255,0.12)', border: '1px dashed rgba(255,255,255,0.06)' }}
                >
                  Empty
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
