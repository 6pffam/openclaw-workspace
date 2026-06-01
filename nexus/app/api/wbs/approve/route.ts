import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const WORKSPACE        = '/Users/6pf/.openclaw/workspace'
const TELEGRAM_TOKEN   = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

export async function POST(req: Request) {
  try {
    const { slug, projectName } = await req.json()

    // Write an approval marker so the agent knows execution is approved
    const approvalDir = path.join(WORKSPACE, 'active-work', '.approvals')
    fs.mkdirSync(approvalDir, { recursive: true })
    fs.writeFileSync(
      path.join(approvalDir, `${slug}.json`),
      JSON.stringify({
        slug,
        projectName,
        approvedAt: new Date().toISOString(),
        approvedVia: 'nexus',
      }, null, 2)
    )

    // Notify via Telegram
    const text = [
      `✅ *Plan Approved: ${projectName ?? slug}*`,
      ``,
      `Execution approved via Nexus Mission Control.`,
      `Starting first step now.`,
    ].join('\n')

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
    console.error('Approve error:', e)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
