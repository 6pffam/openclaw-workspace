import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('project_id')
  const includeArchived = req.nextUrl.searchParams.get('archived') === 'true'
  const db = getDb()

  let query = `SELECT i.id, i.project_id, i.name, i.created_at, i.archived, i.archived_at,
    p.name as project_name
    FROM iterations i
    JOIN projects p ON p.id = i.project_id
    WHERE i.archived = ?`
  const params: unknown[] = [includeArchived ? 1 : 0]

  if (projectId) {
    query += ` AND i.project_id = ?`
    params.push(Number(projectId))
  }

  query += ` ORDER BY i.created_at DESC`

  const iterations = db.prepare(query).all(...params)
  return NextResponse.json(iterations)
}

export async function POST(req: NextRequest) {
  const { project_id, name, priorities, dependencies } = await req.json()
  const db = getDb()

  const result = db.transaction(() => {
    const iter = db.prepare(
      `INSERT INTO iterations (project_id, name) VALUES (?, ?)`
    ).run(project_id, name)
    const iterationId = iter.lastInsertRowid

    if (priorities && priorities.length > 0) {
      const insertPrio = db.prepare(
        `INSERT OR REPLACE INTO row_priorities (iteration_id, row_id, priority, due_date, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)`
      )
      for (const p of priorities) {
        insertPrio.run(iterationId, p.row_id, p.priority, p.due_date || null, p.start_date || null, p.end_date || null)
      }
    }

    if (dependencies && dependencies.length > 0) {
      const insertDep = db.prepare(
        `INSERT OR IGNORE INTO row_dependencies (iteration_id, row_id, depends_on_row_id) VALUES (?, ?, ?)`
      )
      for (const d of dependencies) {
        insertDep.run(iterationId, d.row_id, d.depends_on_row_id)
      }
    }

    return iterationId
  })()

  return NextResponse.json({ id: result, name })
}

export async function PATCH(req: NextRequest) {
  const { id, archived, name } = await req.json()
  const db = getDb()

  if (archived !== undefined) {
    db.prepare(
      `UPDATE iterations SET archived = ?, archived_at = ? WHERE id = ?`
    ).run(archived ? 1 : 0, archived ? new Date().toISOString() : null, id)
  }

  if (name !== undefined) {
    db.prepare(`UPDATE iterations SET name = ? WHERE id = ?`).run(name, id)
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  const db = getDb()
  db.prepare(`DELETE FROM iterations WHERE id = ?`).run(id)
  return NextResponse.json({ ok: true })
}
