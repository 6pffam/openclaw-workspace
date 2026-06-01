import { NextResponse } from 'next/server'

const TELEGRAM_TOKEN   = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

export async function POST(req: Request) {
  try {
    const { taskTitle, gitSha } = await req.json()

    if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
      return NextResponse.json({ ok: false, reason: 'No telegram config' })
    }

    const shaLine = gitSha ? `\nCommit \`${gitSha.slice(0, 7)}\` is now permanent.` : ''
    const text = `✅ *Task Approved*\n\n_${taskTitle}_\n\nApproved via Nexus Mission Control.${shaLine}`

    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: 'Markdown' }),
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
