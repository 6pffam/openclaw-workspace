import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const iterationId = req.nextUrl.searchParams.get('iteration_id')
  if (!iterationId) return NextResponse.json({ error: 'Missing iteration_id' }, { status: 400 })

  const db = getDb()

  const priorities = db.prepare(
    `SELECT rp.row_id, rp.priority, rp.due_date, rp.start_date, rp.end_date
     FROM row_priorities rp
     WHERE rp.iteration_id = ?`
  ).all(Number(iterationId))

  const dependencies = db.prepare(
    `SELECT row_id, depends_on_row_id FROM row_dependencies WHERE iteration_id = ?`
  ).all(Number(iterationId))

  return NextResponse.json({ priorities, dependencies })
}
