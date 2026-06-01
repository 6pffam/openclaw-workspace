'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, Trash2, CheckSquare } from 'lucide-react'

const PRIORITY_OPTS = ['Critical', 'High', 'Medium', 'Low', 'Exclude'] as const
type PriorityOpt = typeof PRIORITY_OPTS[number]
const PRIORITY_COLORS: Record<PriorityOpt, string> = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#f59e0b',
  Low: '#34d399',
  Exclude: 'rgba(255,255,255,0.35)',
}

interface Project { id: number; name: string; column_headers: string[] }
interface ProjectRow { id: number; row_index: number; [key: string]: unknown }
interface Task { id: number; name: string; order_index: number; assigned_row_ids: number[]; depends_on_task_ids: number[] }

function DepDropdown({
  tasks, depMenuTaskId, depMenuPos, onClose, onToggle,
}: {
  tasks: Task[]
  depMenuTaskId: number
  depMenuPos: { top: number; left: number }
  onClose: () => void
  onToggle: (menuTask: Task, tId: number) => void
}) {
  const menuTask = tasks.find(t => t.id === depMenuTaskId)
  if (!menuTask) return null
  const others = tasks.filter(t => t.id !== depMenuTaskId)
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={onClose} />
      <div style={{
        position: 'fixed', top: depMenuPos.top, left: depMenuPos.left, zIndex: 999,
        background: '#132033', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 10, padding: 6, minWidth: 180, maxHeight: 200, overflowY: 'auto',
        boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
      }}>
        {others.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, padding: '4px 6px' }}>No other tasks</p>
        ) : others.map(t => {
          const isSet = menuTask.depends_on_task_ids.includes(t.id)
          return (
            <button
              key={t.id}
              onClick={() => onToggle(menuTask, t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left',
                padding: '6px 8px', fontSize: 11,
                color: isSet ? '#fbbf24' : 'rgba(255,255,255,0.7)',
                background: isSet ? 'rgba(251,191,36,0.08)' : 'none',
                border: 'none', cursor: 'pointer', borderRadius: 6,
              }}
            >
              <span style={{ width: 14, textAlign: 'center', fontSize: 12, flexShrink: 0 }}>
                {isSet ? '\u2713' : ''}
              </span>
              {t.name}
            </button>
          )
        })}
      </div>
    </>
  )
}

export default function TasksClient() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [rows, setRows] = useState<ProjectRow[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTaskName, setNewTaskName] = useState('')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [filterGroup, setFilterGroup] = useState<'All' | 'Assigned' | 'Unassigned'>('All')
  const [filterPriority, setFilterPriority] = useState<PriorityOpt | null>(null)
  const [depMenuTaskId, setDepMenuTaskId] = useState<number | null>(null)
  const [depMenuPos, setDepMenuPos] = useState<{ top: number; left: number } | null>(null)
  const [rowPriorities, setRowPriorities] = useState<Record<number, PriorityOpt>>({})

  useEffect(() => {
    fetch('/api/projects').then(r => r.json()).then(setProjects)
  }, [])

  const loadProject = useCallback(async (project: Project) => {
    setSelectedProject(project)
    setSelectedTask(null)
    setFilterGroup('All')
    setFilterPriority(null)
    setRowPriorities({})
    const [rRes, tRes, iRes] = await Promise.all([
      fetch(`/api/rows?project_id=${project.id}`),
      fetch(`/api/tasks?project_id=${project.id}`),
      fetch(`/api/iterations?project_id=${project.id}`),
    ])
    setRows(await rRes.json())
    setTasks(await tRes.json())
    const iterations = await iRes.json()
    if (iterations.length > 0) {
      const pRes = await fetch(`/api/priorities?iteration_id=${iterations[0].id}`)
      const pData = await pRes.json()
      const prioMap: Record<number, PriorityOpt> = {}
      for (const p of pData.priorities || []) prioMap[p.row_id] = p.priority
      setRowPriorities(prioMap)
    }
  }, [])

  const addTask = async () => {
    if (!newTaskName.trim() || !selectedProject) return
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: selectedProject.id, name: newTaskName.trim() }),
    })
    const data = await res.json()
    setTasks(prev => [...prev, { ...data, order_index: prev.length, assigned_row_ids: [], depends_on_task_ids: [] }])
    setNewTaskName('')
  }

  const deleteTask = async (id: number) => {
    await fetch('/api/tasks', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setTasks(prev => prev.filter(t => t.id !== id))
    if (selectedTask?.id === id) setSelectedTask(null)
  }

  const toggleRowAssignment = async (task: Task, rowId: number) => {
    const isAssigned = task.assigned_row_ids.includes(rowId)
    const newIds = isAssigned
      ? task.assigned_row_ids.filter(id => id !== rowId)
      : [...task.assigned_row_ids, rowId]

    await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: task.id, row_ids: newIds }),
    })

    const updated = { ...task, assigned_row_ids: newIds }
    setTasks(prev => prev.map(t => t.id === task.id ? updated : t))
    setSelectedTask(updated)
  }

  const assignAll = async (task: Task) => {
    const allIds = rows.map(r => r.id)
    await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: task.id, row_ids: allIds }),
    })
    const updated = { ...task, assigned_row_ids: allIds }
    setTasks(prev => prev.map(t => t.id === task.id ? updated : t))
    setSelectedTask(updated)
  }

  const toggleAllFiltered = async (task: Task) => {
    const filteredIds = filteredRows.map(r => r.id)
    const allAssigned = filteredIds.length > 0 && filteredIds.every(id => task.assigned_row_ids.includes(id))
    let newIds: number[]
    if (allAssigned) {
      const filteredSet = new Set(filteredIds)
      newIds = task.assigned_row_ids.filter(id => !filteredSet.has(id))
    } else {
      newIds = [...new Set([...task.assigned_row_ids, ...filteredIds])]
    }
    await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: task.id, row_ids: newIds }),
    })
    const updated = { ...task, assigned_row_ids: newIds }
    setTasks(prev => prev.map(t => t.id === task.id ? updated : t))
    setSelectedTask(updated)
  }

  const toggleTaskDependency = async (task: Task, depTaskId: number) => {
    const already = task.depends_on_task_ids.includes(depTaskId)
    const newDeps = already
      ? task.depends_on_task_ids.filter(id => id !== depTaskId)
      : [...task.depends_on_task_ids, depTaskId]
    await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: task.id, depends_on_task_ids: newDeps }),
    })
    const updated = { ...task, depends_on_task_ids: newDeps }
    setTasks(prev => prev.map(t => t.id === task.id ? updated : t))
    setSelectedTask(updated)
  }

  const clearAll = async (task: Task) => {
    await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: task.id, row_ids: [] }),
    })
    const updated = { ...task, assigned_row_ids: [] }
    setTasks(prev => prev.map(t => t.id === task.id ? updated : t))
    setSelectedTask(updated)
  }

  const filteredRows = useMemo(() => {
    if (!selectedTask) return []
    return rows.filter(r => {
      const matchesAssignment =
        filterGroup === 'Assigned' ? selectedTask.assigned_row_ids.includes(r.id) :
        filterGroup === 'Unassigned' ? !selectedTask.assigned_row_ids.includes(r.id) : true
      const matchesPriority = filterPriority ? rowPriorities[r.id] === filterPriority : true
      return matchesAssignment && matchesPriority
    })
  }, [selectedTask, rows, filterGroup, filterPriority, rowPriorities])

  // Priority values that actually exist in this project's latest iteration
  const availablePriorities = useMemo(
    () => PRIORITY_OPTS.filter(p => Object.values(rowPriorities).includes(p)),
    [rowPriorities]
  )

  if (!selectedProject) {
    return (
      <div className="max-w-5xl mx-auto" style={{ paddingTop: 8 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 className="text-2xl font-semibold text-white" style={{ marginBottom: 4 }}>Tasks</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Define project steps and assign them to data rows</p>
        </div>
        <div className="rounded-2xl p-5" style={{ background: '#0f2236', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-xs font-semibold tracking-wider uppercase mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>Select a Project</h2>
          {projects.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>No projects available.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {projects.map(p => (
                <button key={p.id} onClick={() => loadProject(p)} className="rounded-xl px-4 py-3 text-left" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', color: 'white' }}>
                  <p style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</p>
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
    <>
    <div className="max-w-5xl mx-auto" style={{ paddingTop: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 className="text-2xl font-semibold text-white" style={{ marginBottom: 4 }}>Tasks</h1>
          <button
            onClick={() => setSelectedProject(null)}
            style={{ background: 'rgba(96,165,250,0.12)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 8, padding: '2px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            {selectedProject.name} ×
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
        {/* Task list */}
        <div>
          <div className="rounded-2xl p-4" style={{ background: '#0f2236', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 className="text-xs font-semibold tracking-wider uppercase mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>Task Steps</h2>

            {/* Add task */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              <input
                value={newTaskName}
                onChange={e => setNewTaskName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTask()}
                placeholder="New task step…"
                className="flex-1 px-3 py-2 rounded-xl text-sm outline-none text-white placeholder:text-white/30"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
              <button
                onClick={addTask}
                style={{ padding: '8px', borderRadius: 10, background: '#3b82f6', color: 'white', cursor: 'pointer', border: 'none' }}
              >
                <Plus size={14} />
              </button>
            </div>

            {tasks.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, textAlign: 'center', padding: '12px 0' }}>No tasks yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {tasks.map((task, i) => {
                  const isActive = selectedTask?.id === task.id
                  return (
                    <div
                      key={task.id}
                      style={{
                        borderRadius: 10,
                        background: isActive ? 'rgba(96,165,250,0.1)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${isActive ? 'rgba(96,165,250,0.25)' : 'rgba(255,255,255,0.05)'}`,
                        position: 'relative',
                      }}
                    >
                      {/* Task header row */}
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', cursor: 'pointer' }}
                        onClick={() => setSelectedTask(isActive ? null : task)}
                      >
                        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, fontWeight: 600, minWidth: 18 }}>{i + 1}.</span>
                        <span style={{ flex: 1, color: isActive ? '#60a5fa' : 'rgba(255,255,255,0.75)', fontSize: 13 }}>{task.name}</span>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
                          {task.assigned_row_ids.length}/{rows.length}
                        </span>
                        <button
                          onClick={e => { e.stopPropagation(); deleteTask(task.id) }}
                          style={{ background: 'none', border: 'none', color: 'rgba(239,68,68,0.4)', cursor: 'pointer', padding: 2 }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>

                      {/* Dependency section */}
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '6px 10px 8px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                          <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>After:</span>
                          {task.depends_on_task_ids.map(depId => {
                            const depTask = tasks.find(t => t.id === depId)
                            if (!depTask) return null
                            return (
                              <span key={depId} style={{
                                display: 'flex', alignItems: 'center', gap: 3,
                                padding: '1px 6px', borderRadius: 20, fontSize: 10,
                                background: 'rgba(251,191,36,0.12)', color: '#fbbf24',
                                border: '1px solid rgba(251,191,36,0.2)',
                              }}>
                                {depTask.name.length > 18 ? depTask.name.slice(0, 18) + '…' : depTask.name}
                                <button
                                  onClick={() => toggleTaskDependency(task, depId)}
                                  style={{ background: 'none', border: 'none', color: '#fbbf24', cursor: 'pointer', opacity: 0.6, padding: 0, fontSize: 12, lineHeight: 1 }}
                                >×</button>
                              </span>
                            )
                          })}
                          {/* Add dependency button */}
                          <div>
                            <button
                              onClick={(e) => {
                                if (depMenuTaskId === task.id) {
                                  setDepMenuTaskId(null)
                                  setDepMenuPos(null)
                                } else {
                                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                                  setDepMenuPos({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX })
                                  setDepMenuTaskId(task.id)
                                }
                              }}
                              style={{
                                background: 'none', border: '1px dashed rgba(255,255,255,0.15)',
                                borderRadius: 20, padding: '1px 7px', cursor: 'pointer',
                                color: 'rgba(255,255,255,0.3)', fontSize: 10,
                              }}
                            >+ dep</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Row assignment panel */}
        <div>
          {!selectedTask ? (
            <div className="rounded-2xl flex flex-col items-center justify-center" style={{ background: '#0f2236', border: '1px solid rgba(255,255,255,0.06)', minHeight: 300 }}>
              <CheckSquare size={32} color="rgba(255,255,255,0.1)" style={{ marginBottom: 10 }} />
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Select a task to assign rows</p>
            </div>
          ) : (
            <div className="rounded-2xl p-4" style={{ background: '#0f2236', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h2 style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>{selectedTask.name}</h2>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => assignAll(selectedTask)} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 8, background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)', cursor: 'pointer', fontWeight: 600 }}>All</button>
                  <button onClick={() => clearAll(selectedTask)} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)', cursor: 'pointer', fontWeight: 600 }}>Clear</button>
                </div>
              </div>

              {/* Filter chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                {/* Assignment filter */}
                {(['All', 'Assigned', 'Unassigned'] as const).map(grp => (
                  <button
                    key={grp}
                    onClick={() => setFilterGroup(grp)}
                    style={{
                      padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      background: filterGroup === grp ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.04)',
                      color: filterGroup === grp ? '#60a5fa' : 'rgba(255,255,255,0.4)',
                      border: `1px solid ${filterGroup === grp ? 'rgba(96,165,250,0.25)' : 'rgba(255,255,255,0.08)'}`,
                    }}
                  >
                    {grp} {grp === 'Assigned' ? `(${selectedTask.assigned_row_ids.length})` : grp === 'Unassigned' ? `(${rows.length - selectedTask.assigned_row_ids.length})` : `(${rows.length})`}
                  </button>
                ))}
                {/* Priority filter — only shown when priorities are loaded */}
                {availablePriorities.length > 0 && (
                  <>
                    <span style={{ color: 'rgba(255,255,255,0.15)', alignSelf: 'center', fontSize: 12 }}>|</span>
                    {availablePriorities.map(p => (
                      <button
                        key={p}
                        onClick={() => setFilterPriority(filterPriority === p ? null : p)}
                        style={{
                          padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                          background: filterPriority === p ? `${PRIORITY_COLORS[p]}22` : 'rgba(255,255,255,0.04)',
                          color: filterPriority === p ? PRIORITY_COLORS[p] : 'rgba(255,255,255,0.4)',
                          border: `1px solid ${filterPriority === p ? `${PRIORITY_COLORS[p]}44` : 'rgba(255,255,255,0.08)'}`,
                        }}
                      >
                        {p}
                      </button>
                    ))}
                  </>
                )}
              </div>

              {/* Row list */}
              <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
                {/* Select-all header */}
                {filteredRows.length > 0 && (
                  <div
                    className="flex items-center gap-3 px-4 py-2 cursor-pointer"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#132033' }}
                    onClick={() => toggleAllFiltered(selectedTask)}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: 5,
                      border: `2px solid ${
                        filteredRows.every(r => selectedTask.assigned_row_ids.includes(r.id)) ? '#60a5fa' :
                        filteredRows.some(r => selectedTask.assigned_row_ids.includes(r.id)) ? 'rgba(96,165,250,0.5)' :
                        'rgba(255,255,255,0.2)'
                      }`,
                      background: filteredRows.every(r => selectedTask.assigned_row_ids.includes(r.id)) ? '#60a5fa' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      {filteredRows.every(r => selectedTask.assigned_row_ids.includes(r.id)) && (
                        <span style={{ color: 'white', fontSize: 11, fontWeight: 700 }}>✓</span>
                      )}
                      {!filteredRows.every(r => selectedTask.assigned_row_ids.includes(r.id)) &&
                        filteredRows.some(r => selectedTask.assigned_row_ids.includes(r.id)) && (
                        <span style={{ color: '#60a5fa', fontSize: 14, lineHeight: 1 }}>−</span>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
                      {filteredRows.every(r => selectedTask.assigned_row_ids.includes(r.id))
                        ? 'Deselect all'
                        : `Select all ${filteredRows.length} rows`}
                    </span>
                  </div>
                )}
                {filteredRows.map((row, i) => {
                  const isAssigned = selectedTask.assigned_row_ids.includes(row.id)
                  return (
                    <div
                      key={row.id}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-all hover:bg-white/[0.02]"
                      style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                      onClick={() => toggleRowAssignment(selectedTask, row.id)}
                    >
                      <div style={{
                        width: 18, height: 18, borderRadius: 5, border: `2px solid ${isAssigned ? '#60a5fa' : 'rgba(255,255,255,0.2)'}`,
                        background: isAssigned ? '#60a5fa' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        {isAssigned && <span style={{ color: 'white', fontSize: 11, fontWeight: 700 }}>✓</span>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ color: isAssigned ? 'white' : 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                          {String(row[headers[0]] ?? `Row ${row.row_index + 1}`)}
                        </p>
                        {headers.length > 1 && (
                          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 2 }}>
                            {String(row[headers[1]] ?? '')}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    {depMenuTaskId !== null && depMenuPos !== null && DepDropdown({
      tasks,
      depMenuTaskId,
      depMenuPos,
      onClose: () => { setDepMenuTaskId(null); setDepMenuPos(null) },
      onToggle: (menuTask, tId) => {
        toggleTaskDependency(menuTask, tId)
        setDepMenuTaskId(null)
        setDepMenuPos(null)
      },
    })}
    </>
  )
}
