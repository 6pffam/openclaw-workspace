import fs from 'fs'
import path from 'path'

const WORKSPACE = '/Users/6pf/.openclaw/workspace'

export interface Project {
  id: string
  name: string
  path: string
  hasPackageJson: boolean
  hasAgentsFile: boolean
  lastModified: string
  phase: string
}

export interface RecentFile {
  name: string
  relativePath: string
  mtime: string
}

export interface ProjectDetail extends Project {
  readme: string | null
  recentFiles: RecentFile[]
}

export function scanProjects(): Project[] {
  try {
    const EXCLUDE = new Set(['active-work', 'raw'])
    const entries = fs.readdirSync(WORKSPACE, { withFileTypes: true })
    const dirs = entries.filter(e => e.isDirectory() && !e.name.startsWith('.') && !EXCLUDE.has(e.name))

    return dirs.map(dir => {
      const dirPath = path.join(WORKSPACE, dir.name)
      const hasPkg = fs.existsSync(path.join(dirPath, 'package.json'))
      const hasAgents = fs.existsSync(path.join(dirPath, 'AGENTS.md'))
      const stat = fs.statSync(dirPath)

      let phase = 'Exploring'
      if (hasPkg) phase = 'In Development'
      if (hasAgents && hasPkg) phase = 'Active Build'

      return {
        id: dir.name,
        name: dir.name.charAt(0).toUpperCase() + dir.name.slice(1),
        path: dirPath,
        hasPackageJson: hasPkg,
        hasAgentsFile: hasAgents,
        lastModified: stat.mtime.toISOString(),
        phase,
      }
    }).sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
  } catch {
    return []
  }
}

const SKIP = new Set(['node_modules', '.git', '.next', 'dist', 'build'])

function walkDir(dir: string, base: string, results: RecentFile[]) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (SKIP.has(entry.name)) continue
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walkDir(full, base, results)
      } else {
        const stat = fs.statSync(full)
        results.push({
          name: entry.name,
          relativePath: path.relative(base, full),
          mtime: stat.mtime.toISOString(),
        })
      }
    }
  } catch {}
}

export function getProjectDetail(id: string): ProjectDetail | null {
  const projects = scanProjects()
  const project = projects.find(p => p.id === id)
  if (!project) return null

  let readme: string | null = null
  for (const name of ['README.md', 'readme.md', 'README.txt']) {
    const p = path.join(project.path, name)
    if (fs.existsSync(p)) {
      try { readme = fs.readFileSync(p, 'utf-8') } catch {}
      break
    }
  }

  const allFiles: RecentFile[] = []
  walkDir(project.path, project.path, allFiles)
  const recentFiles = allFiles
    .sort((a, b) => new Date(b.mtime).getTime() - new Date(a.mtime).getTime())
    .slice(0, 10)

  return { ...project, readme, recentFiles }
}

