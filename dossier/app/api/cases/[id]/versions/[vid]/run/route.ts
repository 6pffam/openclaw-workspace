import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import fs from 'fs';
import path from 'path';

const GATEWAY_URL = 'http://127.0.0.1:18789';
const SECRETS_PATH = '/Users/6pf/.openclaw/secrets.json';

function getGatewayToken(): string | null {
  try {
    const s = JSON.parse(fs.readFileSync(SECRETS_PATH, 'utf-8'));
    return s['gateway-auth-token'] ?? null;
  } catch {
    return null;
  }
}

async function triggerScout(caseFile: string, caseName: string, versionNumber: number): Promise<void> {
  const token = getGatewayToken();
  if (!token) return;
  const message = `DOSSIER CASE READY — process now:\n${caseFile}\n\nCase: ${caseName} v${versionNumber}. Run immediately.`;
  try {
    await fetch(`${GATEWAY_URL}/tools/invoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        tool: 'sessions_send',
        input: { agentId: 'scout', message },
      }),
    });
  } catch {
    // Gateway trigger failed — SCOUT will pick it up on next heartbeat (max 15m)
  }
}

const QUEUE_DIR = '/Users/6pf/.openclaw/workspace/dossier/cases/queue';
const RESULTS_DIR = '/Users/6pf/.openclaw/workspace/dossier/results';

function buildCategoriesMap(
  categories: Array<{ type: string; value: string }>
): Record<string, string | string[]> {
  const map: Record<string, string | string[]> = {};
  const multiTypes = new Set(['company', 'individual', 'topic', 'keyword', 'link', 'exclusion']);

  for (const cat of categories) {
    if (multiTypes.has(cat.type)) {
      const existing = map[cat.type];
      if (!existing) {
        map[cat.type] = cat.value ? [cat.value] : [];
      } else if (Array.isArray(existing)) {
        if (cat.value) existing.push(cat.value);
      }
    } else {
      map[cat.type] = cat.value ?? '';
    }
  }
  return map;
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; vid: string }> }
) {
  const { id, vid } = await params;
  const db = getDb();

  const c = db.prepare('SELECT * FROM cases WHERE id = ?').get(id) as
    | { id: string; name: string }
    | undefined;
  if (!c) return NextResponse.json({ error: 'Case not found' }, { status: 404 });

  const version = db.prepare('SELECT * FROM versions WHERE id = ? AND case_id = ?').get(vid, id) as
    | { id: string; version_number: number; status: string }
    | undefined;
  if (!version) return NextResponse.json({ error: 'Version not found' }, { status: 404 });

  if (version.status === 'running') {
    return NextResponse.json({ error: 'Already running' }, { status: 409 });
  }

  const categories = db
    .prepare('SELECT * FROM categories WHERE case_id = ? ORDER BY sort_order ASC')
    .all(id) as Array<{ type: string; value: string }>;

  // Ensure dirs exist
  fs.mkdirSync(QUEUE_DIR, { recursive: true });
  fs.mkdirSync(RESULTS_DIR, { recursive: true });

  const resultsPath = path.join(RESULTS_DIR, `${id}-v${version.version_number}.md`);
  const caseFile = path.join(QUEUE_DIR, `${id}-v${version.version_number}.json`);

  const payload = {
    caseId: id,
    versionId: vid,
    versionNumber: version.version_number,
    caseName: c.name,
    categories: buildCategoriesMap(categories),
    resultsPath,
    triggeredAt: new Date().toISOString(),
  };

  fs.writeFileSync(caseFile, JSON.stringify(payload, null, 2), 'utf-8');

  const now = Date.now();
  db.prepare('UPDATE versions SET status = ?, triggered_at = ?, results_path = ? WHERE id = ?')
    .run('running', now, resultsPath, vid);

  // Directly wake SCOUT via gateway (fire-and-forget; heartbeat is fallback)
  triggerScout(caseFile, c.name, version.version_number).catch(() => {});

  return NextResponse.json({ ok: true, versionId: vid, status: 'running' });
}
