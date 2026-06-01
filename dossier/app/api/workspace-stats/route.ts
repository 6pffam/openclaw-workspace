import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import fs from 'fs';
import path from 'path';

const WORKSPACE = '/Users/6pf/.openclaw/workspace';

function safeReadJson<T>(filePath: string, fallback: T): T {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return fallback;
  }
}

function safeListDir(dirPath: string): string[] {
  try {
    return fs.readdirSync(dirPath);
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    // Crew count
    const crew = safeReadJson<{ members?: unknown[] }>(
      path.join(WORKSPACE, 'nexus/data/crew.json'),
      { members: [] }
    );
    const crewCount = crew.members?.length ?? 0;

    // Crew list for display
    const crewMembers = (crew.members ?? []) as Array<{
      name: string;
      role: string;
      status: string;
      emoji: string;
      agentId: string | null;
    }>;

    // Artifact count
    const artifactFiles = safeListDir(path.join(WORKSPACE, 'artifacts'));
    const artifactCount = artifactFiles.filter(f => !f.startsWith('.')).length;

    // Last memory date
    const memoryFiles = safeListDir(path.join(WORKSPACE, 'memory'));
    const dateMd = memoryFiles
      .filter(f => /^\d{4}-\d{2}-\d{2}\.md$/.test(f))
      .sort()
      .reverse();
    const lastMemoryDate = dateMd[0] ? dateMd[0].replace('.md', '') : null;

    // Active cases from SQLite
    const db = getDb();
    const { count: activeCases } = db.prepare(
      "SELECT COUNT(*) as count FROM cases WHERE status != 'archived'"
    ).get() as { count: number };

    return NextResponse.json({
      crewCount,
      crewMembers,
      artifactCount,
      lastMemoryDate,
      activeCases,
    });
  } catch (err) {
    console.error('GET /api/workspace-stats error:', err);
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}
