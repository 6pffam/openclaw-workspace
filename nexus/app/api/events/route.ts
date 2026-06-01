import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const sessionsDir = '/Users/6pf/.openclaw/agents/main/sessions'
    const files = fs.readdirSync(sessionsDir)
      .filter(f => f.endsWith('.jsonl'))
      .map(f => {
        const stat = fs.statSync(path.join(sessionsDir, f))
        return { file: f, mtime: stat.mtime }
      })
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())
      .slice(0, 5)
    return NextResponse.json({ recentSessions: files })
  } catch {
    return NextResponse.json({ recentSessions: [] })
  }
}
