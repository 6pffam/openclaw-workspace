import { NextRequest, NextResponse } from 'next/server'
import { isCronOrAuthenticated } from '@/lib/cron-auth'

export async function POST(req: NextRequest) {
  if (!await isCronOrAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { text } = await req.json()
  if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 })

  const results: Array<{ channel: string; ok: boolean; error?: string }> = []

  // Discord webhook (preferred)
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  if (webhookUrl) {
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      })
      results.push({ channel: 'discord', ok: res.ok })
    } catch (e: unknown) {
      results.push({ channel: 'discord', ok: false, error: String(e) })
    }
  }

  // Telegram fallback
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN
  const telegramChatId = process.env.TELEGRAM_CHAT_ID
  if (telegramToken && telegramChatId && !webhookUrl) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: text.replace(/\*\*/g, '*'),
          parse_mode: 'Markdown',
        }),
      })
      results.push({ channel: 'telegram', ok: res.ok })
    } catch (e: unknown) {
      results.push({ channel: 'telegram', ok: false, error: String(e) })
    }
  }

  if (results.length === 0) {
    return NextResponse.json({
      error: 'No notification channel configured. Set DISCORD_WEBHOOK_URL in .env.local',
    }, { status: 500 })
  }

  return NextResponse.json({ ok: true, results })
}
