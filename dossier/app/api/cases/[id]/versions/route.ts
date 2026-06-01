import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  const c = db.prepare('SELECT id FROM cases WHERE id = ?').get(id);
  if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const categories = db
    .prepare('SELECT * FROM categories WHERE case_id = ? ORDER BY sort_order ASC')
    .all(id);

  const maxRow = db
    .prepare('SELECT MAX(version_number) as max_v FROM versions WHERE case_id = ?')
    .get(id) as { max_v: number | null };

  const nextVersion = (maxRow?.max_v ?? 0) + 1;
  const versionId = randomUUID();
  const now = Date.now();

  db.prepare(`
    INSERT INTO versions (id, case_id, version_number, snapshot, status, created_at)
    VALUES (?, ?, ?, ?, 'draft', ?)
  `).run(versionId, id, nextVersion, JSON.stringify(categories), now);

  const created = db.prepare('SELECT * FROM versions WHERE id = ?').get(versionId);
  return NextResponse.json({ version: created }, { status: 201 });
}
