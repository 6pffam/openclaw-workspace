import { NextResponse } from 'next/server'

const TELEGRAM_TOKEN   = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

export async function POST(req: Request) {
  try {
    const { projectId, projectName, goal } = await req.json()

    // Build the message that triggers the planning conversation
    const goalLine = goal ? `\n\n*Initial goal:* ${goal}` : ''
    const text = [
      `📋 *Plan Request: ${projectName ?? projectId}*`,
      ``,
      `Kone has requested a WBS plan for project \`${projectId}\` via Nexus.${goalLine}`,
      ``,
      `I'll start the planning conversation now.`,
    ].join('\n')

    // Notify Kone via Telegram
    if (TELEGRAM_TOKEN && TELEGRAM_CHAT_ID) {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text,
          parse_mode: 'Markdown',
        }),
      })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Plan request error:', e)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
