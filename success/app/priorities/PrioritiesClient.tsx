'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Eye, Save, ChevronDown, X, Link as LinkIcon } from 'lucide-react'

interface Project { id: number; name: string; column_headers: string[]; row_count: number }
interface ProjectRow { id: number; row_index: number; [key: string]: unknown }
interface RowPriority { row_id: number; priority: string; due_date: string; start_date: string; end_date: string }
interface Dependency { row_id: number; depends_on_row_id: number }

const PRIORITY_OPTS = ['Critical', 'High', 'Medium', 'Low', 'Exclude']
const PRIORITY_COLORS: Record<string, string> = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#f59e0b',
  Low: '#34d399',
  Exclude: 'rgba(255,255,255,0.2)',
}

export default function PrioritiesClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [rows, setRows] = useState<ProjectRow[]>([])
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({})
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [priorities, setPriorities] = useState<Record<number, RowPriority>>({})
  const [dependencies, setDependencies] = useState<Dependency[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [iterName, setIterName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [depModal, setDepModal] = useState<number | null>(null)
  const [editingIterId, setEditingIterId] = useState<number | null>(null)
  const [editingIterName, setEditingIterName] = useState<string>('')

  const loadProject = useCallback(async (project: Project, iterationId?: number) => {
    setSelectedProject(project)
    setColumnFilters({})
    setSelectedRows(new Set())
    setPriorities({})
    setDependencies([])
    setShowPreview(false)
    setEditingIterId(null)
    setEditingIterName('')
    const res = await fetch(`/api/rows?project_id=${project.id}`)
    const data = await res.json()
    setRows(data)

    if (iterationId) {
      const pRes = await fetch(`/api/priorities?iteration_id=${iterationId}`)
      const { priorities: pData, dependencies: dData } = await pRes.json()
      const prioMap: Record<number, RowPriority> = {}
      for (const p of pData || []) prioMap[p.row_id] = { row_id: p.row_id, priority: p.priority, due_date: p.due_date || '', start_date: p.start_date || '', end_date: p.end_date || '' }
      setPriorities(prioMap)
      setDependencies(dData || [])
      setEditingIterId(iterationId)
      // Fetch iteration name
      const iRes = await fetch(`/api/iterations?project_id=${project.id}`)
      const iters = await iRes.json()
      const iter = iters.find((i: { id: number; name: string }) => i.id === iterationId)
      if (iter) setEditingIterName(iter.name)
    }
  }, [])

  // Handle ?project= and ?load= query params (coming from Projects tab Edit button)
  useEffect(() => {
    const projectId = searchParams.get('project')
    const loadIterId = searchParams.get('load')
    if (!projectId) return
    fetch('/api/projects')
      .then(r => r.json())
      .then((allProjects: Project[]) => {
        setProjects(allProjects)
        const project = allProjects.find(p => p.id === Number(projectId))
        if (project) loadProject(project, loadIterId ? Number(loadIterId) : undefined)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!searchParams.get('project')) {
      fetch('/api/projects').then(r => r.json()).then(setProjects)
    }
  }, [searchParams])

  const filteredRows = useMemo(() => {
    if (!selectedProject) return []
    return rows.filter(row => {
      for (const [col, vals] of Object.entries(columnFilters)) {
        if (vals.length === 0) continue
        if (col === '__priority__') {
          if (!vals.includes(priorities[row.id]?.priority || '')) return false
        } else if (col === '__due_date__') {
          if (!vals.includes(priorities[row.id]?.due_date || '')) return false
        } else {
          if (!vals.includes(String(row[col] ?? ''))) return false
        }
      }
      return true
    })
  }, [rows, columnFilters, selectedProject, priorities])

  const toggleRowSelect = (id: number) => {
    setSelectedRows(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (selectedRows.size === filteredRows.length) setSelectedRows(new Set())
    else setSelectedRows(new Set(filteredRows.map(r => r.id)))
  }

  const applyPriority = (priority: string) => {
    const next = { ...priorities }
    selectedRows.forEach(rid => {
      next[rid] = { row_id: rid, priority, due_date: next[rid]?.due_date || '', start_date: next[rid]?.start_date || '', end_date: next[rid]?.end_date || '' }
    })
    setPriorities(next)
  }

  const applyDueDate = (date: string) => {
    const next = { ...priorities }
    selectedRows.forEach(rid => {
      next[rid] = { row_id: rid, priority: next[rid]?.priority || 'Medium', due_date: date, start_date: next[rid]?.start_date || '', end_date: next[rid]?.end_date || '' }
    })
    setPriorities(next)
  }

  const applyStartDate = (date: string) => {
    const next = { ...priorities }
    selectedRows.forEach(rid => {
      next[rid] = { row_id: rid, priority: next[rid]?.priority || 'Medium', due_date: next[rid]?.due_date || '', start_date: date, end_date: next[rid]?.end_date || '' }
    })
    setPriorities(next)
  }

  const applyEndDate = (date: string) => {
    const next = { ...priorities }
    selectedRows.forEach(rid => {
      next[rid] = { row_id: rid, priority: next[rid]?.priority || 'Medium', due_date: next[rid]?.due_date || '', start_date: next[rid]?.start_date || '', end_date: date }
    })
    setPriorities(next)
  }

  const addDependency = (rowId: number, dependsOn: number) => {
    if (rowId === dependsOn) return
    setDependencies(prev => {
      const exists = prev.find(d => d.row_id === rowId && d.depends_on_row_id === dependsOn)
      if (exists) return prev
      return [...prev, { row_id: rowId, depends_on_row_id: dependsOn }]
    })
    setDepModal(null)
  }

  const removeDependency = (rowId: number, dependsOn: number) => {
    setDependencies(prev => prev.filter(d => !(d.row_id === rowId && d.depends_on_row_id === dependsOn)))
  }

  const saveIteration = async () => {
    if (!selectedProject || !iterName.trim()) return
    setSaving(true)
    const timestamp = new Date().toLocaleString()
    const name = `${iterName.trim()} — ${timestamp}`
    const res = await fetch('/api/iterations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: selectedProject.id,
        name,
        priorities: Object.values(priorities),
        dependencies,
      }),
    })
    setSaving(false)
    if (res.ok) {
      setSaveMsg(`Iteration "${name}" saved.`)
      setIterName('')
      setTimeout(() => setSaveMsg(''), 4000)
    }
  }

  // Mini Gantt data
  const ganttRows = useMemo(() => {
    if (!showPreview) return []
    return filteredRows
      .filter(r => priorities[r.id]?.priority !== 'Exclude')
      .map(r => ({
        ...r,
        priority: priorities[r.id]?.priority || 'Medium',
        due_date: priorities[r.id]?.due_date || '',
        start_date: priorities[r.id]?.start_date || '',
        end_date: priorities[r.id]?.end_date || '',
      }))
      .filter(r => r.due_date || r.start_date)
  }, [showPreview, filteredRows, priorities])

  const ganttRange = useMemo(() => {
    if (ganttRows.length === 0) return null
    const allDates = ganttRows.flatMap(r => [
      r.start_date ? new Date(r.start_date).getTime() : null,
      r.end_date   ? new Date(r.end_date).getTime()   : null,
      r.due_date   ? new Date(r.due_date).getTime()   : null,
    ]).filter((d): d is number => !!d && !isNaN(d))
    if (allDates.length === 0) return null
    const min = Math.min(...allDates)
    const max = Math.max(...allDates)
    return { min, max: max === min ? max + 86400000 * 7 : max }
  }, [ganttRows])

  const getColumnValues = (col: string) => {
    const vals = new Set(rows.map(r => String(r[col] ?? '')))
    return Array.from(vals).sort()
  }

  // Values for virtual filter columns
  const assignedPriorities = useMemo(
    () => PRIORITY_OPTS.filter(p => Object.values(priorities).some(v => v.priority === p)),
    [priorities]
  )
  const assignedDueDates = useMemo(
    () => [...new Set(Object.values(priorities).map(v => v.due_date).filter(Boolean))].sort(),
    [priorities]
  )

  if (!selectedProject) {
    return (
      <div className="max-w-5xl mx-auto" style={{ paddingTop: 8 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 className="text-2xl font-semibold text-white" style={{ marginBottom: 4 }}>Priorities</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Simulate project scenarios and set priorities</p>
        </div>
        <div className="rounded-2xl p-5" style={{ background: '#0f2236', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-xs font-semibold tracking-wider uppercase mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>Select a Project</h2>
          {projects.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>No projects available. Import one first.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {projects.map(p => (
                <button
                  key={p.id}
                  onClick={() => loadProject(p)}
                  className="rounded-xl px-4 py-3 text-left transition-all"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', color: 'white' }}
                >
                  <p style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{p.row_count} rows</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  const headers = selectedProject.column_headers

  return (
    <div className="max-w-5xl mx-auto" style={{ paddingTop: 8 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 className="text-2xl font-semibold text-white" style={{ marginBottom: 4 }}>Priorities</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Project:</span>
            <button
              onClick={() => setSelectedProject(null)}
              style={{ background: 'rgba(96,165,250,0.12)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 8, padding: '2px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              {selectedProject.name} ×
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowPreview(!showPreview)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 10,
            background: showPreview ? '#3b82f6' : 'rgba(255,255,255,0.06)',
            color: showPreview ? 'white' : 'rgba(255,255,255,0.6)',
            border: '1px solid rgba(255,255,255,0.08)',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Eye size={14} />
          See Preview
        </button>
      </div>

      {/* Mini Gantt Preview */}
      {showPreview && (
        <div className="rounded-2xl p-4 mb-5" style={{ background: '#0f2236', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-xs font-semibold tracking-wider uppercase mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>Gantt Preview</h2>
          {ganttRows.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, textAlign: 'center', padding: '16px 0' }}>
              Set due dates on rows to see them in the preview
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              {ganttRows.map(r => {
                const toPct = (d: string) => ganttRange
                  ? ((new Date(d).getTime() - ganttRange.min) / (ganttRange.max - ganttRange.min)) * 90
                  : 0
                const color = PRIORITY_COLORS[r.priority] || '#60a5fa'
                const label = String((r as Record<string, unknown>)[headers[0]] ?? `Row ${r.row_index + 1}`)
                const hasRange = !!(r.start_date && r.end_date)
                const startPct = r.start_date ? toPct(r.start_date) : null
                const endPct   = r.end_date   ? toPct(r.end_date)   : null
                const duePct   = r.due_date   ? toPct(r.due_date)   : null
                return (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', width: 120, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {label}
                    </span>
                    <div style={{ flex: 1, position: 'relative', height: 18, background: 'rgba(255,255,255,0.04)', borderRadius: 4 }}>
                      {/* Activity bar start→end */}
                      {hasRange && startPct !== null && endPct !== null && (
                        <div style={{
                          position: 'absolute',
                          left: `${startPct}%`,
                          width: `${Math.max(endPct - startPct, 1)}%`,
                          height: '100%',
                          background: color,
                          borderRadius: 4,
                          opacity: 0.55,
                        }} />
                      )}
                      {/* Due date diamond */}
                      {duePct !== null && (
                        <div style={{
                          position: 'absolute',
                          left: `${duePct}%`,
                          top: '50%',
                          transform: 'translate(-50%, -50%) rotate(45deg)',
                          width: 10, height: 10,
                          background: color,
                          opacity: 0.9,
                        }} />
                      )}
                      {/* Fallback bar if no range */}
                      {!hasRange && duePct === null && startPct !== null && (
                        <div style={{ position: 'absolute', left: `${startPct}%`, width: 10, height: '100%', background: color, borderRadius: 4, opacity: 0.85 }} />
                      )}
                    </div>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
                      {r.start_date && r.end_date ? `${r.start_date} → ${r.end_date}` : r.due_date}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Column filters */}
      <div className="rounded-2xl p-4 mb-4" style={{ background: '#0f2236', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h2 className="text-xs font-semibold tracking-wider uppercase mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>Filter by Column</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {/* Data columns from Excel */}
          {headers.map(col => (
            <div key={col} style={{ minWidth: 160 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{col}</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {getColumnValues(col).slice(0, 8).map(val => {
                  const active = columnFilters[col]?.includes(val)
                  return (
                    <button
                      key={val}
                      onClick={() => {
                        setColumnFilters(prev => {
                          const cur = prev[col] || []
                          return { ...prev, [col]: active ? cur.filter(v => v !== val) : [...cur, val] }
                        })
                      }}
                      style={{
                        padding: '2px 8px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
                        background: active ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.05)',
                        color: active ? '#60a5fa' : 'rgba(255,255,255,0.5)',
                        border: `1px solid ${active ? 'rgba(96,165,250,0.25)' : 'rgba(255,255,255,0.08)'}`,
                      }}
                    >
                      {val || '—'}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Priority filter — only shown when priorities are assigned */}
          {assignedPriorities.length > 0 && (
            <div style={{ minWidth: 160 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Priority</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {assignedPriorities.map(p => {
                  const active = columnFilters['__priority__']?.includes(p)
                  return (
                    <button
                      key={p}
                      onClick={() => {
                        setColumnFilters(prev => {
                          const cur = prev['__priority__'] || []
                          return { ...prev, __priority__: active ? cur.filter(v => v !== p) : [...cur, p] }
                        })
                      }}
                      style={{
                        padding: '2px 8px', borderRadius: 20, fontSize: 11, cursor: 'pointer', fontWeight: active ? 700 : 400,
                        background: active ? `${PRIORITY_COLORS[p]}22` : 'rgba(255,255,255,0.05)',
                        color: active ? PRIORITY_COLORS[p] : 'rgba(255,255,255,0.5)',
                        border: `1px solid ${active ? `${PRIORITY_COLORS[p]}44` : 'rgba(255,255,255,0.08)'}`,
                      }}
                    >
                      {p}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Due Date filter — only shown when due dates are assigned */}
          {assignedDueDates.length > 0 && (
            <div style={{ minWidth: 160 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Due Date</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {assignedDueDates.slice(0, 10).map(d => {
                  const active = columnFilters['__due_date__']?.includes(d)
                  return (
                    <button
                      key={d}
                      onClick={() => {
                        setColumnFilters(prev => {
                          const cur = prev['__due_date__'] || []
                          return { ...prev, __due_date__: active ? cur.filter(v => v !== d) : [...cur, d] }
                        })
                      }}
                      style={{
                        padding: '2px 8px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
                        background: active ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.05)',
                        color: active ? '#60a5fa' : 'rgba(255,255,255,0.5)',
                        border: `1px solid ${active ? 'rgba(96,165,250,0.25)' : 'rgba(255,255,255,0.08)'}`,
                      }}
                    >
                      {d}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedRows.size > 0 && (
        <div className="rounded-xl px-4 py-3 mb-4 flex items-center gap-4 flex-wrap" style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)' }}>
          <span style={{ color: '#60a5fa', fontSize: 13, fontWeight: 600 }}>{selectedRows.size} selected</span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Priority:</span>
            {PRIORITY_OPTS.map(p => (
              <button
                key={p}
                onClick={() => applyPriority(p)}
                style={{
                  padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  background: `${PRIORITY_COLORS[p]}22`,
                  color: PRIORITY_COLORS[p],
                  border: `1px solid ${PRIORITY_COLORS[p]}44`,
                }}
              >{p}</button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Start:</span>
            <input
              type="date"
              onChange={e => applyStartDate(e.target.value)}
              className="rounded-lg px-2 py-1 text-xs outline-none text-white"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>End:</span>
            <input
              type="date"
              onChange={e => applyEndDate(e.target.value)}
              className="rounded-lg px-2 py-1 text-xs outline-none text-white"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Due:</span>
            <input
              type="date"
              onChange={e => applyDueDate(e.target.value)}
              className="rounded-lg px-2 py-1 text-xs outline-none text-white"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
            />
          </div>
        </div>
      )}

      {/* Rows table */}
      <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 20 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#0f2236' }}>
                <th style={{ padding: '10px 14px', width: 32 }}>
                  <input type="checkbox" checked={selectedRows.size === filteredRows.length && filteredRows.length > 0} onChange={selectAll} style={{ cursor: 'pointer' }} />
                </th>
                {headers.map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: 10, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
                <th style={{ padding: '10px 14px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: 10, whiteSpace: 'nowrap' }}>Priority</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: 10, whiteSpace: 'nowrap' }}>Start</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: 10, whiteSpace: 'nowrap' }}>End</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: 10, whiteSpace: 'nowrap' }}>Due Date</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: 10, whiteSpace: 'nowrap' }}>Depends On</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, i) => {
                const isSelected = selectedRows.has(row.id)
                const prio = priorities[row.id]
                const isExcluded = prio?.priority === 'Exclude'
                const rowDeps = dependencies.filter(d => d.row_id === row.id)

                return (
                  <tr
                    key={row.id}
                    style={{
                      borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      background: isSelected ? 'rgba(96,165,250,0.05)' : 'transparent',
                      opacity: isExcluded ? 0.35 : 1,
                    }}
                  >
                    <td style={{ padding: '8px 14px' }}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleRowSelect(row.id)} style={{ cursor: 'pointer' }} />
                    </td>
                    {headers.map(h => (
                      <td key={h} style={{ padding: '8px 14px', color: isExcluded ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {String(row[h] ?? '')}
                      </td>
                    ))}
                    <td style={{ padding: '8px 14px' }}>
                      {prio ? (
                        <span style={{
                          padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                          background: `${PRIORITY_COLORS[prio.priority]}22`,
                          color: PRIORITY_COLORS[prio.priority],
                          border: `1px solid ${PRIORITY_COLORS[prio.priority]}44`,
                          whiteSpace: 'nowrap',
                        }}>{prio.priority}</span>
                      ) : <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>—</span>}
                    </td>
                    <td style={{ padding: '8px 14px', color: prio?.start_date ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)', fontSize: 12, whiteSpace: 'nowrap' }}>
                      {prio?.start_date || '—'}
                    </td>
                    <td style={{ padding: '8px 14px', color: prio?.end_date ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)', fontSize: 12, whiteSpace: 'nowrap' }}>
                      {prio?.end_date || '—'}
                    </td>
                    <td style={{ padding: '8px 14px', color: prio?.due_date ? 'rgba(96,165,250,0.9)' : 'rgba(255,255,255,0.2)', fontSize: 12, whiteSpace: 'nowrap' }}>
                      {prio?.due_date || '—'}
                    </td>
                    <td style={{ padding: '8px 14px' }}>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                        {rowDeps.map(d => {
                          const depRow = rows.find(r => r.id === d.depends_on_row_id)
                          const label = depRow ? String(depRow[headers[0]] ?? `Row ${depRow.row_index + 1}`) : `#${d.depends_on_row_id}`
                          return (
                            <span key={d.depends_on_row_id} style={{
                              display: 'flex', alignItems: 'center', gap: 3,
                              padding: '1px 7px', borderRadius: 20, fontSize: 10,
                              background: 'rgba(167,139,250,0.12)', color: '#a78bfa',
                              border: '1px solid rgba(167,139,250,0.2)',
                            }}>
                              {label.slice(0, 20)}
                              <button onClick={() => removeDependency(row.id, d.depends_on_row_id)} style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', opacity: 0.6, padding: 0, fontSize: 12 }}>×</button>
                            </span>
                          )
                        })}
                        <button
                          onClick={() => setDepModal(depModal === row.id ? null : row.id)}
                          style={{ background: 'none', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 20, padding: '1px 7px', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                        >
                          + dep
                        </button>
                        {depModal === row.id && (
                          <div style={{ position: 'absolute', zIndex: 50, background: '#132033', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 8, maxHeight: 160, overflowY: 'auto', minWidth: 180 }}>
                            {filteredRows.filter(r => r.id !== row.id).map(r => (
                              <button
                                key={r.id}
                                onClick={() => addDependency(row.id, r.id)}
                                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '5px 8px', fontSize: 11, color: 'rgba(255,255,255,0.7)', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6 }}
                              >
                                {String(r[headers[0]] ?? `Row ${r.row_index + 1}`)}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '8px 14px', borderTop: '1px solid rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>
          {filteredRows.length} of {rows.length} rows shown
        </div>
      </div>

      {/* Editing banner */}
      {editingIterId && (
        <div className="rounded-xl px-4 py-3 mb-4 flex items-center gap-3" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
          <span style={{ fontSize: 13, color: '#34d399' }}>✏️ Editing: <strong>{editingIterName}</strong></span>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>— Changes will be saved as a new iteration. The original is preserved.</span>
          <button onClick={() => { setEditingIterId(null); setEditingIterName(''); router.push('/priorities') }} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
        </div>
      )}

      {/* Save iteration */}
      <div className="rounded-2xl p-5" style={{ background: '#0f2236', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h2 className="text-xs font-semibold tracking-wider uppercase mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>Save Iteration</h2>
        {editingIterId && (
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 10 }}>
            Saving will create a new iteration with your changes. The original <strong style={{ color: 'rgba(255,255,255,0.6)' }}>{editingIterName}</strong> is kept intact.
          </p>
        )}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            value={iterName}
            onChange={e => setIterName(e.target.value)}
            placeholder={editingIterId ? `e.g. ${editingIterName} v2` : 'Iteration name (e.g. Base Scenario)'}
            className="flex-1 px-3 py-2 rounded-xl text-sm outline-none text-white placeholder:text-white/30"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          />
          <button
            onClick={saveIteration}
            disabled={!iterName.trim() || saving}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 18px', borderRadius: 10,
              background: iterName.trim() ? '#3b82f6' : 'rgba(255,255,255,0.06)',
              color: iterName.trim() ? 'white' : 'rgba(255,255,255,0.3)',
              fontSize: 13, fontWeight: 600, cursor: iterName.trim() ? 'pointer' : 'not-allowed',
              border: 'none', whiteSpace: 'nowrap',
            }}
          >
            <Save size={14} />
            {saving ? 'Saving…' : 'Save Iteration'}
          </button>
        </div>
        {saveMsg && (
          <p style={{ color: '#34d399', fontSize: 12, marginTop: 8 }}>✓ {saveMsg}</p>
        )}
      </div>
    </div>
  )
}
