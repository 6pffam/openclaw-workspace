import fs from 'fs'
import path from 'path'

const WIKI_DIR = path.resolve('/Users/6pf/.openclaw/workspace/wiki')

export interface WikiPage {
  slug: string        // e.g. "projects/nexus"
  path: string        // absolute path
  title: string
  type: string
  status: string
  updated: string
  tags: string[]
  summary: string     // first non-frontmatter, non-heading line
  links: string[]     // outbound [[wiki/...]] links
}

function parseFrontmatter(content: string): { meta: Record<string, string | string[]>; body: string } {
  if (!content.startsWith('---')) return { meta: {}, body: content }
  const end = content.indexOf('---', 3)
  if (end === -1) return { meta: {}, body: content }
  const yaml = content.slice(3, end).trim()
  const body = content.slice(end + 3).trim()
  const meta: Record<string, string | string[]> = {}
  for (const line of yaml.split('\n')) {
    const colon = line.indexOf(':')
    if (colon === -1) continue
    const key = line.slice(0, colon).trim()
    const val = line.slice(colon + 1).trim()
    if (val.startsWith('[')) {
      // parse array like [tag1, tag2]
      meta[key] = val.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean)
    } else {
      meta[key] = val
    }
  }
  return { meta, body }
}

function extractSummary(body: string): string {
  const lines = body.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('>')) {
      // skip blank, headings, but grab blockquotes as summary
      if (trimmed.startsWith('>')) return trimmed.slice(1).trim()
      continue
    }
    return trimmed.slice(0, 120)
  }
  return ''
}

function extractLinks(content: string): string[] {
  const matches = content.matchAll(/\[\[([^\]]+)\]\]/g)
  return [...new Set([...matches].map(m => m[1]))]
}

function scanDir(dir: string, base: string): WikiPage[] {
  const pages: WikiPage[] = []
  if (!fs.existsSync(dir)) return pages

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      pages.push(...scanDir(path.join(dir, entry.name), base))
    } else if (entry.name.endsWith('.md')) {
      const filePath = path.join(dir, entry.name)
      const content = fs.readFileSync(filePath, 'utf-8')
      const { meta, body } = parseFrontmatter(content)
      const relative = path.relative(base, filePath)
      const slug = relative.replace(/\.md$/, '')

      pages.push({
        slug,
        path: filePath,
        title: (meta.title as string) || slug,
        type: (meta.type as string) || 'page',
        status: (meta.status as string) || '',
        updated: (meta.updated as string) || '',
        tags: (meta.tags as string[]) || [],
        summary: extractSummary(body),
        links: extractLinks(content),
      })
    }
  }
  return pages
}

export function getAllWikiPages(): WikiPage[] {
  return scanDir(WIKI_DIR, WIKI_DIR).sort((a, b) => a.slug.localeCompare(b.slug))
}

export function getWikiPage(slug: string): { meta: WikiPage; content: string } | null {
  const filePath = path.join(WIKI_DIR, slug + '.md')
  if (!fs.existsSync(filePath)) return null
  const raw = fs.readFileSync(filePath, 'utf-8')
  const { body } = parseFrontmatter(raw)
  const pages = getAllWikiPages()
  const meta = pages.find(p => p.slug === slug)
  if (!meta) return null
  return { meta, content: body }
}

export function getWikiGraph(): { nodes: { id: string; title: string; type: string }[]; links: { source: string; target: string }[] } {
  const pages = getAllWikiPages()
  const slugSet = new Set(pages.map(p => p.slug))
  const nodes = pages.map(p => ({ id: p.slug, title: p.title, type: p.type }))
  const links: { source: string; target: string }[] = []

  for (const page of pages) {
    for (const link of page.links) {
      // normalize link: strip leading wiki/ if present, try to match slug
      const normalized = link.replace(/^wiki\//, '')
      if (slugSet.has(normalized)) {
        links.push({ source: page.slug, target: normalized })
      }
    }
  }
  return { nodes, links }
}
