import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  const c = db.prepare('SELECT * FROM cases WHERE id = ?').get(id);
  if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const categories = db
    .prepare('SELECT * FROM categories WHERE case_id = ? ORDER BY sort_order ASC, created_at ASC')
    .all(id);

  const versions = db
    .prepare('SELECT * FROM versions WHERE case_id = ? ORDER BY version_number DESC')
    .all(id);

  return NextResponse.json({ case: c, categories, versions });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  const c = db.prepare('SELECT * FROM cases WHERE id = ?').get(id);
  if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const existing = c as { name: string; intent: string | null };
  const name = typeof body.name === 'string' ? body.name.trim() : existing.name;
  const intent = typeof body.intent === 'string' ? body.intent.trim() : existing.intent;

  db.prepare('UPDATE cases SET name = ?, intent = ?, updated_at = ? WHERE id = ?')
    .run(name, intent || null, Date.now(), id);

  const updated = db.prepare('SELECT * FROM cases WHERE id = ?').get(id);
  return NextResponse.json({ case: updated });
}
