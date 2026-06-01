import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('project_id')
  if (!projectId) return NextResponse.json({ error: 'Missing project_id' }, { status: 400 })

  const db = getDb()
  const rows = db.prepare(
    `SELECT id, row_data, row_index FROM project_rows WHERE project_id = ? ORDER BY row_index`
  ).all(Number(projectId))

  return NextResponse.json(rows.map((r: any) => ({
    id: r.id,
    row_index: r.row_index,
    ...JSON.parse(r.row_data),
  })))
}
