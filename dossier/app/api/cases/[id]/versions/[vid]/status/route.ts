import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import fs from 'fs';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; vid: string }> }
) {
  const { id, vid } = await params;
  const db = getDb();

  const row = db
    .prepare('SELECT id, case_id, status, results_path, completed_at FROM versions WHERE id = ? AND case_id = ?')
    .get(vid, id) as {
      id: string;
      case_id: string;
      status: string;
      results_path: string | null;
      completed_at: number | null;
    } | undefined;

  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Auto-heal: if running but results file exists, flip to ready
  if (row.status === 'running' && row.results_path && fs.existsSync(row.results_path)) {
    const now = Date.now();
    db.prepare('UPDATE versions SET status = ?, completed_at = ? WHERE id = ?')
      .run('ready', now, row.id);
    db.prepare('UPDATE cases SET status = ?, updated_at = ? WHERE id = ?')
      .run('ready', now, row.case_id);
    row.status = 'ready';
    row.completed_at = now;
  }

  return NextResponse.json({
    status: row.status,
    results_path: row.results_path,
    completed_at: row.completed_at,
  });
}
