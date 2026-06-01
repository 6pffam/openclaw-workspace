import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('project_id')
  if (!projectId) return NextResponse.json({ error: 'Missing project_id' }, { status: 400 })

  const db = getDb()
  const tasks = db.prepare(
    `SELECT t.id, t.name, t.order_index,
            GROUP_CONCAT(DISTINCT tra.row_id) as assigned_row_ids,
            GROUP_CONCAT(DISTINCT td.depends_on_task_id) as depends_on_task_ids
     FROM tasks t
     LEFT JOIN task_row_assignments tra ON tra.task_id = t.id
     LEFT JOIN task_dependencies td ON td.task_id = t.id
     WHERE t.project_id = ?
     GROUP BY t.id
     ORDER BY t.order_index`
  ).all(Number(projectId))

  return NextResponse.json(tasks.map((t: any) => ({
    ...t,
    assigned_row_ids: t.assigned_row_ids ? t.assigned_row_ids.split(',').map(Number) : [],
    depends_on_task_ids: t.depends_on_task_ids ? t.depends_on_task_ids.split(',').map(Number) : [],
  })))
}

export async function POST(req: NextRequest) {
  const { project_id, name } = await req.json()
  const db = getDb()

  const maxOrder = db.prepare(
    `SELECT COALESCE(MAX(order_index), -1) as max_idx FROM tasks WHERE project_id = ?`
  ).get(Number(project_id)) as { max_idx: number }

  const result = db.prepare(
    `INSERT INTO tasks (project_id, name, order_index) VALUES (?, ?, ?)`
  ).run(project_id, name, maxOrder.max_idx + 1)

  return NextResponse.json({ id: result.lastInsertRowid, name })
}

export async function PATCH(req: NextRequest) {
  const { task_id, row_ids, name, depends_on_task_ids } = await req.json()
  const db = getDb()

  db.transaction(() => {
    if (name !== undefined) {
      db.prepare(`UPDATE tasks SET name = ? WHERE id = ?`).run(name, task_id)
    }
    if (row_ids !== undefined) {
      db.prepare(`DELETE FROM task_row_assignments WHERE task_id = ?`).run(task_id)
      const insert = db.prepare(`INSERT OR IGNORE INTO task_row_assignments (task_id, row_id) VALUES (?, ?)`)
      for (const rowId of row_ids) insert.run(task_id, rowId)
    }
    if (depends_on_task_ids !== undefined) {
      db.prepare(`DELETE FROM task_dependencies WHERE task_id = ?`).run(task_id)
      const insert = db.prepare(`INSERT OR IGNORE INTO task_dependencies (task_id, depends_on_task_id) VALUES (?, ?)`)
      for (const depId of depends_on_task_ids) insert.run(task_id, depId)
    }
  })()

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  const db = getDb()
  db.prepare(`DELETE FROM tasks WHERE id = ?`).run(id)
  return NextResponse.json({ ok: true })
}
