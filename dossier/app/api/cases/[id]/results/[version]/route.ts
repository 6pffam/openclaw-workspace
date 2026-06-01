import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const RESULTS_DIR = '/Users/6pf/.openclaw/workspace/dossier/results';

function parseSections(content: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const parts = content.split(/^## /m);

  for (const part of parts) {
    if (!part.trim()) continue;
    const newlineIdx = part.indexOf('\n');
    if (newlineIdx === -1) continue;
    const heading = part.slice(0, newlineIdx).trim().toLowerCase().replace(/\s+/g, '_');
    const body = part.slice(newlineIdx + 1).trim();
    sections[heading] = body;
  }
  return sections;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; version: string }> }
) {
  const { id, version } = await params;
  const filePath = path.join(RESULTS_DIR, `${id}-v${version}.md`);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ found: false });
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { data: frontmatter, content } = matter(raw);
    const sections = parseSections(content);

    return NextResponse.json({
      found: true,
      frontmatter,
      sections: {
        key_findings: sections['key_findings'] ?? '',
        entities: sections['entities'] ?? '',
        timeline: sections['timeline'] ?? '',
        sources: sections['sources'] ?? '',
      },
      raw: content,
    });
  } catch (err) {
    console.error('Results parse error:', err);
    return NextResponse.json({ error: 'Failed to parse results' }, { status: 500 });
  }
}
