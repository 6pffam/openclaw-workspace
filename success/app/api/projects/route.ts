import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  const db = getDb()
  const projects = db.prepare(`
    SELECT p.id, p.name, p.column_headers, p.created_at,
           COUNT(pr.id) as row_count
    FROM projects p
    LEFT JOIN project_rows pr ON pr.project_id = p.id
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `).all()

  return NextResponse.json(projects.map((p: any) => ({
    ...p,
    column_headers: JSON.parse(p.column_headers),
    column_types: JSON.parse(p.column_types || '{}'),
  })))
}

export async function POST(req: NextRequest) {
  const { name, column_headers, column_types, rows } = await req.json()
  const db = getDb()

  const existing = db.prepare(`SELECT id FROM projects WHERE name = ?`).get(name)
  if (existing) {
    return NextResponse.json({ error: 'Project name already exists' }, { status: 409 })
  }

  const insertProject = db.prepare(
    `INSERT INTO projects (name, column_headers, column_types) VALUES (?, ?, ?)`
  )
  const insertRow = db.prepare(
    `INSERT INTO project_rows (project_id, row_data, row_index) VALUES (?, ?, ?)`
  )

  const result = db.transaction(() => {
    const proj = insertProject.run(name, JSON.stringify(column_headers), JSON.stringify(column_types || {}))
    const projectId = proj.lastInsertRowid
    rows.forEach((row: Record<string, unknown>, i: number) => {
      insertRow.run(projectId, JSON.stringify(row), i)
    })
    return projectId
  })()

  return NextResponse.json({ id: result, name })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  const db = getDb()
  db.prepare(`DELETE FROM projects WHERE id = ?`).run(id)
  return NextResponse.json({ ok: true })
}
