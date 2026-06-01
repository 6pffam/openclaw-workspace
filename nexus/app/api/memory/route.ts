import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

const MEMORY_DIR = '/Users/6pf/.openclaw/workspace/memory'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')

  try {
    if (date) {
      // Return content of a specific memory file
      const filePath = path.join(MEMORY_DIR, `${date}.md`)
      if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
      const content = fs.readFileSync(filePath, 'utf-8')
      return NextResponse.json({ date, content })
    }

    // Return list of all memory dates
    const files = fs.readdirSync(MEMORY_DIR)
      .filter(f => f.match(/^\d{4}-\d{2}-\d{2}\.md$/))
      .map(f => {
        const date = f.replace('.md', '')
        const stat = fs.statSync(path.join(MEMORY_DIR, f))
        const content = fs.readFileSync(path.join(MEMORY_DIR, f), 'utf-8')
        const preview = content.split('\n').slice(0, 4).join(' ').replace(/#+\s*/g, '').trim().slice(0, 120)
        return { date, sizeBytes: stat.size, preview }
      })
      .sort((a, b) => b.date.localeCompare(a.date))

    return NextResponse.json({ files })
  } catch {
    return NextResponse.json({ error: 'Failed to read memory' }, { status: 500 })
  }
}
