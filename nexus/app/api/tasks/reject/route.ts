import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { readTaskData } from '@/lib/tasks'
import type { Task } from '@/lib/tasks'

const TASKS_FILE = path.join('/Users/6pf/.openclaw/workspace', 'nexus', 'data', 'tasks.json')
const NEXUS_DIR  = path.join('/Users/6pf/.openclaw/workspace', 'nexus')
const TELEGRAM_TOKEN   = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

async function sendTelegram(text: string) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) return
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: 'Markdown' }),
  })
}

export async function POST(req: Request) {
  try {
    const { id } = await req.json() as { id: string }
    const data = readTaskData()
    if (!data) return NextResponse.json({ error: 'No task data' }, { status: 404 })

    const task = data.tasks.find((t: Task) => t.id === id)
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

    const sha = task.gitSha
    let revertStatus: 'ok' | 'conflict' | 'no-sha' = 'no-sha'

    if (sha) {
      try {
        // Attempt revert — non-interactive, no editor
        execSync(`git revert ${sha} --no-edit`, {
          cwd: NEXUS_DIR,
          env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
        })
        revertStatus = 'ok'
      } catch {
        // Revert conflicted — abort cleanly
        try { execSync('git revert --abort', { cwd: NEXUS_DIR }) } catch { /* already clean */ }
        revertStatus = 'conflict'
      }
    }

    // Update task: mark rejected
    data.tasks = data.tasks.map((t: Task) =>
      t.id === id
        ? { ...t, status: 'rejected' as const, rejectedAt: new Date().toISOString(), revertStatus }
        : t
    )
    data.updatedAt = new Date().toISOString()
    fs.writeFileSync(TASKS_FILE, JSON.stringify(data, null, 2))

    // Notify via Telegram
    if (revertStatus === 'ok') {
      await sendTelegram(
        `❌ *Task Rejected — Reverted*\n\n_${task.title}_\n\n` +
        `Git commit \`${sha?.slice(0, 7)}\` has been automatically reverted.\n` +
        `Codebase is back to its previous state.`
      )
    } else if (revertStatus === 'conflict') {
      await sendTelegram(
        `❌ *Task Rejected — Manual Revert Needed*\n\n_${task.title}_\n\n` +
        `Attempted to revert \`${sha?.slice(0, 7)}\` but hit a merge conflict.\n` +
        `⚠️ Manual cleanup required — check the nexus repo.`
      )
    } else {
      await sendTelegram(
        `❌ *Task Rejected*\n\n_${task.title}_\n\n` +
        `No git SHA was recorded for this task — no automatic revert possible.\n` +
        `Please review and revert manually if needed.`
      )
    }

    return NextResponse.json({ ok: true, revertStatus })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to reject', detail: String(err) }, { status: 500 })
  }
}
