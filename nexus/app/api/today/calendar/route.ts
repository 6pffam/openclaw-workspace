import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export const dynamic = 'force-dynamic'

const GOG_ENV = {
  ...process.env,
  GOG_KEYRING_PASSWORD: 'nexus-gog-2026',
  PATH: '/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin',
}

export interface CalendarEvent {
  id: string
  summary: string
  start: string
  end: string
  location?: string
  allDay?: boolean
}

function parseEvents(raw: string): CalendarEvent[] {
  try {
    const parsed = JSON.parse(raw)
    const items = Array.isArray(parsed) ? parsed : (parsed.events ?? parsed.items ?? [])
    return items.map((e: Record<string, unknown>) => {
      const startObj = e.start as Record<string, string> | undefined
      const endObj = e.end as Record<string, string> | undefined
      const allDay = Boolean(startObj?.date && !startObj?.dateTime)
      return {
        id: String(e.id ?? e.iCalUID ?? Math.random()),
        summary: String(e.summary ?? 'Untitled'),
        start: String(startObj?.dateTime ?? startObj?.date ?? ''),
        end: String(endObj?.dateTime ?? endObj?.date ?? ''),
        location: e.location ? String(e.location) : undefined,
        allDay,
      }
    })
  } catch {
    return []
  }
}

export async function GET() {
  try {
    // Check auth
    const { stdout: authCheck } = await execAsync('gog auth list', { env: GOG_ENV }).catch(() => ({ stdout: '' }))
    if (!authCheck.includes('6pffam@gmail.com')) {
      return NextResponse.json({
        configured: false,
        message: 'Google Calendar not connected. Run: gog auth add 6pffam@gmail.com --services calendar',
        events: [],
      })
    }

    // Fetch today + tomorrow in Zurich time
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const zurich = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Zurich' }))
    const y = zurich.getFullYear(), m = pad(zurich.getMonth() + 1), d = pad(zurich.getDate())
    const todayStart = `${y}-${m}-${d}T00:00:00+02:00`
    const tomorrowEnd = `${y}-${m}-${pad(zurich.getDate() + 1)}T23:59:59+02:00`

    const { stdout } = await execAsync(
      `gog calendar events primary --from "${todayStart}" --to "${tomorrowEnd}" --json`,
      { env: GOG_ENV }
    )

    const events = parseEvents(stdout)
    return NextResponse.json({ configured: true, events })
  } catch {
    return NextResponse.json({
      configured: false,
      message: 'Google Calendar not connected.',
      events: [],
    })
  }
}
