'use client'
import { useState, useEffect, useCallback } from 'react'
import { ChevronDown, ChevronRight, BarChart2, Archive, Trash2, Clock, Layers, Pencil, Check, X } from 'lucide-react'
import Link from 'next/link'

interface Iteration {
  id: number
  project_id: number
  name: string
  created_at: string
  archived: number
  project_name: string
}

interface Project {
  id: number
  name: string
  column_headers: string[]
  created_at: string
  row_count: number
}

const PRIORITY_COLORS: Record<string, string> = {
  Critical: '#ef4444',
  Medium: '#f59e0b',
  Low: '#34d399',
  Exclude: 'rgba(255,255,255,0.2)',
}

export default function ProjectsClient() {
  const [projects, setProjects] = useState<Project[]>([])
  const [iterations, setIterations] = useState<Iteration[]>([])
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [renamingId, setRenamingId] = useState<number | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const fetchAll = useCallback(async () => {
    const [pRes, iRes] = await Promise.all([
      fetch('/api/projects'),
      fetch('/api/iterations'),
    ])
    setProjects(await pRes.json())
    setIterations(await iRes.json())
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const toggleExpand = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const archiveIteration = async (id: number) => {
    await fetch('/api/iterations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, archived: true }),
    })
    fetchAll()
  }

  const startRename = (iter: Iteration) => {
    setRenamingId(iter.id)
    setRenameValue(iter.name)
  }

  const commitRename = async (id: number) => {
    const name = renameValue.trim()
    if (!name) { setRenamingId(null); return }
    await fetch('/api/iterations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name }),
    })
    setRenamingId(null)
    fetchAll()
  }

  const deleteIteration = async (id: number) => {
    if (!confirm('Delete this iteration permanently?')) return
    await fetch('/api/iterations', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    fetchAll()
  }

  const getProjectIterations = (projectId: number) =>
    iterations.filter(i => i.project_id === projectId)

  return (
    <div className="max-w-5xl mx-auto" style={{ paddingTop: 8 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 className="text-2xl font-semibold text-white" style={{ marginBottom: 4 }}>Projects & Iterations</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Browse all projects and their saved simulation iterations</p>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-2xl flex flex-col items-center justify-center py-20" style={{ background: '#0f2236', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Layers size={36} color="rgba(255,255,255,0.15)" style={{ marginBottom: 12 }} />
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>No projects yet</p>
          <Link href="/input" style={{ color: '#60a5fa', fontSize: 13, marginTop: 8, textDecoration: 'none' }}>Import your first project →</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {projects.map(project => {
            const iters = getProjectIterations(project.id)
            const isOpen = expanded.has(project.id)

            return (
              <div key={project.id} className="rounded-2xl" style={{ background: '#0f2236', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                {/* Project header */}
                <button
                  onClick={() => toggleExpand(project.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '16px 20px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {isOpen ? <ChevronDown size={16} color="rgba(255,255,255,0.4)" /> : <ChevronRight size={16} color="rgba(255,255,255,0.4)" />}
                  <div style={{ flex: 1 }}>
                    <p style={{ color: 'white', fontSize: 15, fontWeight: 600 }}>{project.name}</p>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 2 }}>
                      {project.row_count} rows · {iters.length} iteration{iters.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>
                    <Clock size={11} />
                    {new Date(project.created_at).toLocaleDateString()}
                  </div>
                </button>

                {/* Iterations */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '8px 16px 12px' }}>
                    {iters.length === 0 ? (
                      <div style={{ padding: '16px 8px', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                        No iterations yet — go to <Link href="/priorities" style={{ color: '#60a5fa', textDecoration: 'none' }}>Priorities</Link> to create one.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                        {iters.map(iter => (
                          <div
                            key={iter.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                              padding: '10px 14px',
                              borderRadius: 12,
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid rgba(255,255,255,0.05)',
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              {renamingId === iter.id ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <input
                                    autoFocus
                                    value={renameValue}
                                    onChange={e => setRenameValue(e.target.value)}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') commitRename(iter.id)
                                      if (e.key === 'Escape') setRenamingId(null)
                                    }}
                                    className="flex-1 px-2 py-1 rounded-lg text-sm outline-none text-white"
                                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(96,165,250,0.4)', fontSize: 13 }}
                                  />
                                  <button onClick={() => commitRename(iter.id)} style={{ background: 'none', border: 'none', color: '#34d399', cursor: 'pointer', padding: 2 }}><Check size={14} /></button>
                                  <button onClick={() => setRenamingId(null)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}><X size={14} /></button>
                                </div>
                              ) : (
                                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{iter.name}</p>
                              )}
                              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 2 }}>
                                {new Date(iter.created_at).toLocaleString()}
                              </p>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                              <Link
                                href={`/priorities?project=${project.id}&load=${iter.id}`}
                                title="Edit iteration"
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 4,
                                  padding: '4px 10px', borderRadius: 8,
                                  background: 'rgba(52,211,153,0.1)', color: '#34d399',
                                  fontSize: 11, fontWeight: 600, textDecoration: 'none',
                                  border: '1px solid rgba(52,211,153,0.2)',
                                }}
                              >
                                <Pencil size={12} />
                                Edit
                              </Link>
                              <button
                                onClick={() => startRename(iter)}
                                title="Rename"
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 4,
                                  padding: '4px 10px', borderRadius: 8,
                                  background: 'rgba(251,191,36,0.1)', color: '#fbbf24',
                                  fontSize: 11, fontWeight: 600, cursor: 'pointer',
                                  border: '1px solid rgba(251,191,36,0.2)',
                                }}
                              >
                                <Pencil size={12} />
                                Rename
                              </button>
                              <Link
                                href={`/report?project=${project.id}&iteration=${iter.id}`}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 4,
                                  padding: '4px 10px', borderRadius: 8,
                                  background: 'rgba(96,165,250,0.12)', color: '#60a5fa',
                                  fontSize: 11, fontWeight: 600, textDecoration: 'none',
                                  border: '1px solid rgba(96,165,250,0.2)',
                                }}
                              >
                                <BarChart2 size={12} />
                                Report
                              </Link>
                              <button
                                onClick={() => archiveIteration(iter.id)}
                                title="Archive"
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 4,
                                  padding: '4px 10px', borderRadius: 8,
                                  background: 'rgba(167,139,250,0.1)', color: '#a78bfa',
                                  fontSize: 11, fontWeight: 600, cursor: 'pointer',
                                  border: '1px solid rgba(167,139,250,0.2)',
                                }}
                              >
                                <Archive size={12} />
                                Archive
                              </button>
                              <button
                                onClick={() => deleteIteration(iter.id)}
                                title="Delete"
                                style={{
                                  display: 'flex', alignItems: 'center',
                                  padding: '4px 8px', borderRadius: 8,
                                  background: 'rgba(239,68,68,0.08)', color: '#ef4444',
                                  fontSize: 11, cursor: 'pointer',
                                  border: '1px solid rgba(239,68,68,0.15)',
                                }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
