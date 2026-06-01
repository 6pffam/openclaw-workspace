import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { randomUUID } from 'crypto';

const CATEGORY_DEFAULTS = [
  { type: 'intent', label: 'Intent', sort_order: 0 },
  { type: 'company', label: 'Company', sort_order: 1 },
  { type: 'individual', label: 'Individual', sort_order: 2 },
  { type: 'time_range', label: 'Time Range', sort_order: 3 },
  { type: 'topic', label: 'Topic', sort_order: 4 },
  { type: 'keyword', label: 'Keyword', sort_order: 5 },
  { type: 'link', label: 'Link', sort_order: 6 },
  { type: 'exclusion', label: 'Exclusion', sort_order: 7 },
];

export async function GET() {
  try {
    const db = getDb();
    const cases = db.prepare(`
      SELECT 
        c.*,
        v.status as version_status,
        v.version_number as latest_version
      FROM cases c
      LEFT JOIN versions v ON v.id = (
        SELECT id FROM versions WHERE case_id = c.id ORDER BY version_number DESC LIMIT 1
      )
      ORDER BY c.updated_at DESC
    `).all();

    return NextResponse.json({ cases });
  } catch (err) {
    console.error('GET /api/cases error:', err);
    return NextResponse.json({ error: 'Failed to fetch cases' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, intent } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const db = getDb();
    const now = Date.now();
    const caseId = randomUUID();
    const versionId = randomUUID();

    const insertCase = db.prepare(`
      INSERT INTO cases (id, name, intent, status, created_at, updated_at)
      VALUES (?, ?, ?, 'draft', ?, ?)
    `);

    const insertVersion = db.prepare(`
      INSERT INTO versions (id, case_id, version_number, status, created_at)
      VALUES (?, ?, 1, 'draft', ?)
    `);

    const insertCategory = db.prepare(`
      INSERT INTO categories (id, case_id, type, label, value, sort_order, created_at)
      VALUES (?, ?, ?, ?, '', ?, ?)
    `);

    const transaction = db.transaction(() => {
      insertCase.run(caseId, name.trim(), intent?.trim() || null, now, now);
      insertVersion.run(versionId, caseId, now);

      for (const cat of CATEGORY_DEFAULTS) {
        insertCategory.run(randomUUID(), caseId, cat.type, cat.label, cat.sort_order, now);
      }
    });

    transaction();

    const created = db.prepare('SELECT * FROM cases WHERE id = ?').get(caseId);
    return NextResponse.json({ case: created }, { status: 201 });
  } catch (err) {
    console.error('POST /api/cases error:', err);
    return NextResponse.json({ error: 'Failed to create case' }, { status: 500 });
  }
}
