import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  const c = db.prepare('SELECT id FROM cases WHERE id = ?').get(id);
  if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const incoming: Array<{
    id?: string;
    type: string;
    label: string;
    value: string;
    sort_order: number;
  }> = body.categories ?? [];

  const now = Date.now();
  const incomingIds = incoming.filter((x) => x.id).map((x) => x.id as string);

  const upsert = db.prepare(`
    INSERT INTO categories (id, case_id, type, label, value, sort_order, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      label = excluded.label,
      value = excluded.value,
      sort_order = excluded.sort_order,
      type = excluded.type
  `);

  const deleteOld = db.prepare(
    `DELETE FROM categories WHERE case_id = ? AND id NOT IN (${
      incomingIds.length ? incomingIds.map(() => '?').join(',') : "'__never__'"
    })`
  );

  const updateCase = db.prepare('UPDATE cases SET updated_at = ? WHERE id = ?');

  const transaction = db.transaction(() => {
    for (const cat of incoming) {
      const catId = cat.id ?? randomUUID();
      upsert.run(catId, id, cat.type, cat.label, cat.value ?? '', cat.sort_order ?? 0, now);
    }
    if (incomingIds.length > 0) {
      deleteOld.run(id, ...incomingIds);
    } else {
      db.prepare('DELETE FROM categories WHERE case_id = ?').run(id);
    }
    updateCase.run(now, id);
  });

  transaction();

  const updated = db
    .prepare('SELECT * FROM categories WHERE case_id = ? ORDER BY sort_order ASC, created_at ASC')
    .all(id);

  return NextResponse.json({ categories: updated });
}
