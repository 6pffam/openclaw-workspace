'use client'
import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { BarChart2, Printer, Image } from 'lucide-react'

interface Project { id: number; name: string; column_headers: string[] }
interface Iteration { id: number; name: string; project_id: number; project_name: string; created_at: string }
interface RowPriority { row_id: number; priority: string; due_date: string; start_date: string; end_date: string }
interface Dependency { row_id: number; depends_on_row_id: number }
interface ProjectRow { id: number; row_index: number; [key: string]: unknown }

// ─── Theme definitions ────────────────────────────────────────────────────────

const DEFAULT_PRIORITY_COLORS: Record<string, string> = {
  Critical: '#ef4444',
  High:     '#f97316',
  Medium:   '#f59e0b',
  Low:      '#34d399',
}

const IBM_PRIORITY_COLORS: Record<string, string> = {
  Critical: '#FA4D56',  // IBM Red 50
  High:     '#A56EFF',  // IBM Purple 50
  Medium:   '#0F62FE',  // IBM Blue 60
  Low:      '#009D9A',  // IBM Teal 50
}

interface Theme {
  font: string
  pageBg: string
  cardBg: string
  cardBorder: string
  cardRadius: string
  trackBg: string
  trackBorder: string
  trackRadius: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  textFaint: string
  accent: string
  accentBg: string
  accentBorder: string
  statBg: string
  statBorder: string
  statRadius: string
  inputBg: string
  inputBorder: string
  divider: string
  gridLine: string
  btnSecondaryBg: string
  btnSecondaryColor: string
  btnSecondaryBorder: string
  btnRadius: string
  labelRadius: string
  priorityColors: Record<string, string>
  progressTrackBg: string
}

const defaultTheme: Theme = {
  font:               'inherit',
  pageBg:             'transparent',
  cardBg:             '#0f2236',
  cardBorder:         '1px solid rgba(255,255,255,0.06)',
  cardRadius:         '16px',
  trackBg:            'rgba(255,255,255,0.03)',
  trackBorder:        '1px solid rgba(255,255,255,0.04)',
  trackRadius:        '6px',
  textPrimary:        '#ffffff',
  textSecondary:      'rgba(255,255,255,0.85)',
  textMuted:          'rgba(255,255,255,0.5)',
  textFaint:          'rgba(255,255,255,0.3)',
  accent:             '#60a5fa',
  accentBg:           'rgba(96,165,250,0.1)',
  accentBorder:       'rgba(96,165,250,0.2)',
  statBg:             '#0f2236',
  statBorder:         '1px solid rgba(255,255,255,0.06)',
  statRadius:         '12px',
  inputBg:            'rgba(255,255,255,0.04)',
  inputBorder:        '1px solid rgba(255,255,255,0.08)',
  divider:            '1px solid rgba(255,255,255,0.06)',
  gridLine:           'rgba(255,255,255,0.08)',
  btnSecondaryBg:     'rgba(255,255,255,0.06)',
  btnSecondaryColor:  'rgba(255,255,255,0.6)',
  btnSecondaryBorder: '1px solid rgba(255,255,255,0.08)',
  btnRadius:          '10px',
  labelRadius:        '20px',
  priorityColors:     DEFAULT_PRIORITY_COLORS,
  progressTrackBg:    'rgba(255,255,255,0.08)',
}

const ibmTheme: Theme = {
  font:               "'IBM Plex Sans', sans-serif",
  pageBg:             '#000000',
  cardBg:             '#161616',
  cardBorder:         '1px solid #393939',
  cardRadius:         '0px',
  trackBg:            '#1c1c1c',
  trackBorder:        '1px solid #393939',
  trackRadius:        '0px',
  textPrimary:        '#F4F4F4',
  textSecondary:      '#F4F4F4',
  textMuted:          '#C6C6C6',
  textFaint:          '#8D8D8D',
  accent:             '#0F62FE',
  accentBg:           'rgba(15,98,254,0.15)',
  accentBorder:       '#0F62FE',
  statBg:             '#161616',
  statBorder:         '1px solid #393939',
  statRadius:         '0px',
  inputBg:            '#262626',
  inputBorder:        '1px solid #525252',
  divider:            '1px solid #393939',
  gridLine:           '#393939',
  btnSecondaryBg:     'transparent',
  btnSecondaryColor:  '#C6C6C6',
  btnSecondaryBorder: '1px solid #525252',
  btnRadius:          '0px',
  labelRadius:        '0px',
  priorityColors:     IBM_PRIORITY_COLORS,
  progressTrackBg:    '#393939',
}

// ─── Component ────────────────────────────────────────────────────────────────

function ReportInner() {
  const searchParams = useSearchParams()
  const [projects,          setProjects]          = useState<Project[]>([])
  const [iterations,        setIterations]        = useState<Iteration[]>([])
  const [selectedProject,   setSelectedProject]   = useState<string>('')
  const [selectedIteration, setSelectedIteration] = useState<string>('')
  const [rows,              setRows]              = useState<ProjectRow[]>([])
  const [priorities,        setPriorities]        = useState<RowPriority[]>([])
  const [dependencies,      setDependencies]      = useState<Dependency[]>([])
  const [headers,           setHeaders]           = useState<string[]>([])
  const [ibmMode,           setIbmMode]           = useState(false)

  const t = ibmMode ? ibmTheme : defaultTheme

  useEffect(() => {
    Promise.all([
      fetch('/api/projects').then(r => r.json()),
      fetch('/api/iterations').then(r => r.json()),
    ]).then(([p, i]) => {
      setProjects(p)
      setIterations(i)
      const pid = searchParams.get('project')
      const iid = searchParams.get('iteration')
      if (pid) setSelectedProject(pid)
      if (iid) setSelectedIteration(iid)
    })
  }, [searchParams])

  const projectIterations = useMemo(
    () => iterations.filter(i => i.project_id === Number(selectedProject)),
    [iterations, selectedProject]
  )

  const loadIterationData = useCallback(async (iterationId: string, projectId: string) => {
    const project = projects.find(p => p.id === Number(projectId))
    if (!project) return
    setHeaders(project.column_headers)
    const [rowsRes, prioRes] = await Promise.all([
      fetch(`/api/rows?project_id=${projectId}`),
      fetch(`/api/priorities?iteration_id=${iterationId}`),
    ])
    const rowData = await rowsRes.json()
    const { priorities: prioData, dependencies: depData } = await prioRes.json()
    setRows(rowData)
    setPriorities(prioData)
    setDependencies(depData)
  }, [projects])

  useEffect(() => {
    if (selectedIteration && selectedProject) {
      loadIterationData(selectedIteration, selectedProject)
    }
  }, [selectedIteration, selectedProject, loadIterationData])

  const ganttData = useMemo(() => {
    return rows
      .map(row => {
        const prio = priorities.find(p => p.row_id === row.id)
        return {
          ...row,
          priority:   prio?.priority  || 'Medium',
          due_date:   prio?.due_date   || '',
          start_date: prio?.start_date || '',
          end_date:   prio?.end_date   || '',
        }
      })
      .filter(r => r.priority !== 'Exclude' && (r.due_date || r.start_date))
      .sort((a, b) => {
        const aDate = a.start_date || a.due_date
        const bDate = b.start_date || b.due_date
        return new Date(aDate).getTime() - new Date(bDate).getTime()
      })
  }, [rows, priorities])

  const dateRange = useMemo(() => {
    if (ganttData.length === 0) return null
    const allDates = ganttData.flatMap(r => [
      r.start_date ? new Date(r.start_date).getTime() : null,
      r.end_date   ? new Date(r.end_date).getTime()   : null,
      r.due_date   ? new Date(r.due_date).getTime()   : null,
    ]).filter((d): d is number => !!d && !isNaN(d))
    if (allDates.length === 0) return null
    const min = Math.min(...allDates)
    const max = Math.max(...allDates)
    const pad = (max - min) * 0.05
    return { min: min - pad, max: max + pad }
  }, [ganttData])

  const prioritySummary = useMemo(() => {
    const counts: Record<string, number> = {}
    priorities.forEach(p => { counts[p.priority] = (counts[p.priority] || 0) + 1 })
    return counts
  }, [priorities])

  const trackRef  = useRef<HTMLDivElement>(null)
  const chartRef  = useRef<HTMLDivElement>(null)
  const [trackWidth, setTrackWidth] = useState(0)

  useEffect(() => {
    if (!trackRef.current) return
    const ro = new ResizeObserver(entries => setTrackWidth(entries[0].contentRect.width))
    ro.observe(trackRef.current)
    return () => ro.disconnect()
  }, [ganttData])

  const getBarPct = (date: string) => {
    if (!dateRange) return 0
    return ((new Date(date).getTime() - dateRange.min) / (dateRange.max - dateRange.min)) * 94
  }

  const depArrows = useMemo(() => {
    if (!trackWidth || ganttData.length === 0) return []
    const ROW_H  = 38
    const LABEL_W = 200
    const DIAMOND_R = 7
    const arrows: { x1: number; y1: number; x2: number; y2: number; color: string }[] = []
    ganttData.forEach((row, rowIdx) => {
      const rowDeps = dependencies.filter(d => d.row_id === row.id)
      rowDeps.forEach(dep => {
        const predIdx = ganttData.findIndex(r => r.id === dep.depends_on_row_id)
        if (predIdx < 0) return
        const pred = ganttData[predIdx]
        const predAnchor = pred.end_date || pred.due_date
        const succAnchor = row.start_date || row.due_date
        if (!predAnchor || !succAnchor) return
        const predPct = getBarPct(predAnchor) / 100
        const succPct = getBarPct(succAnchor) / 100
        const x1 = LABEL_W + predPct * trackWidth + DIAMOND_R
        const x2 = LABEL_W + succPct * trackWidth - DIAMOND_R
        const y1 = predIdx * ROW_H + ROW_H / 2
        const y2 = rowIdx  * ROW_H + ROW_H / 2
        const color = t.priorityColors[pred.priority] || t.accent
        arrows.push({ x1, y1, x2, y2, color })
      })
    })
    return arrows
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dependencies, ganttData, trackWidth, dateRange, t])

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const selectedIterObj = iterations.find(i => i.id === Number(selectedIteration))

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{
      maxWidth: '75vw', margin: '0 auto', paddingTop: 8,
      fontFamily: t.font,
      background: ibmMode ? t.pageBg : 'transparent',
      padding: ibmMode ? '32px 32px 48px' : '8px 0 0',
      transition: 'background 0.2s',
    }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{
            fontSize: ibmMode ? 20 : 22,
            fontWeight: ibmMode ? 300 : 600,
            color: t.textPrimary,
            letterSpacing: ibmMode ? '0.02em' : '-0.02em',
            marginBottom: 4,
            fontFamily: t.font,
          }}>
            {ibmMode ? 'Executive Report' : 'Executive Report'}
          </h1>
          <p style={{ color: t.textFaint, fontSize: 13, fontFamily: t.font }}>
            Gantt visualization of project iterations
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* IBM View toggle */}
          <button
            onClick={() => setIbmMode(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px',
              borderRadius: ibmMode ? '0px' : '10px',
              background: ibmMode ? '#0F62FE' : 'rgba(255,255,255,0.05)',
              color: ibmMode ? '#ffffff' : 'rgba(255,255,255,0.45)',
              border: ibmMode ? '1px solid #0F62FE' : '1px solid rgba(255,255,255,0.1)',
              fontSize: 12, fontWeight: ibmMode ? 500 : 600,
              cursor: 'pointer',
              letterSpacing: ibmMode ? '0.04em' : 'normal',
              fontFamily: ibmMode ? "'IBM Plex Sans', sans-serif" : 'inherit',
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: 10, opacity: 0.85 }}>◈</span>
            IBM
          </button>

          {ganttData.length > 0 && (
            <>
              <button
                onClick={async () => {
                  if (!chartRef.current) return
                  const { toPng } = await import('html-to-image')
                  const dataUrl = await toPng(chartRef.current, {
                    pixelRatio: 3,
                    backgroundColor: ibmMode ? '#000000' : '#0f2236',
                  })
                  const link = document.createElement('a')
                  link.download = `${selectedIterObj?.name ?? 'report'}.png`
                  link.href = dataUrl
                  link.click()
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px',
                  borderRadius: t.btnRadius,
                  background: t.accentBg,
                  color: t.accent,
                  border: `1px solid ${t.accentBorder}`,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  fontFamily: t.font,
                }}
              >
                <Image size={14} />
                Export Image
              </button>

              <button
                onClick={() => window.print()}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px',
                  borderRadius: t.btnRadius,
                  background: t.btnSecondaryBg,
                  color: t.btnSecondaryColor,
                  border: t.btnSecondaryBorder,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  fontFamily: t.font,
                }}
              >
                <Printer size={14} />
                Print / PDF
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Selectors ── */}
      <div style={{
        padding: '16px',
        marginBottom: 20,
        background: t.cardBg,
        border: t.cardBorder,
        borderRadius: t.cardRadius,
      }}>
        {ibmMode && (
          <p style={{
            fontSize: 10, fontWeight: 600, letterSpacing: '0.1em',
            color: t.textFaint, textTransform: 'uppercase',
            marginBottom: 12, fontFamily: t.font,
          }}>Configure</p>
        )}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{
              display: 'block', fontSize: 10, fontWeight: 600,
              color: t.textFaint, marginBottom: 6,
              textTransform: 'uppercase', letterSpacing: '0.05em',
              fontFamily: t.font,
            }}>Project</label>
            <select
              value={selectedProject}
              onChange={e => {
                setSelectedProject(e.target.value)
                setSelectedIteration('')
                setRows([])
                setPriorities([])
              }}
              style={{
                width: '100%', padding: '8px 12px',
                borderRadius: t.cardRadius,
                background: t.inputBg,
                border: t.inputBorder,
                color: t.textPrimary,
                fontSize: 13, outline: 'none',
                fontFamily: t.font,
              }}
            >
              <option value="">Select project…</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{
              display: 'block', fontSize: 10, fontWeight: 600,
              color: t.textFaint, marginBottom: 6,
              textTransform: 'uppercase', letterSpacing: '0.05em',
              fontFamily: t.font,
            }}>Iteration</label>
            <select
              value={selectedIteration}
              onChange={e => setSelectedIteration(e.target.value)}
              disabled={!selectedProject}
              style={{
                width: '100%', padding: '8px 12px',
                borderRadius: t.cardRadius,
                background: t.inputBg,
                border: t.inputBorder,
                color: t.textPrimary,
                fontSize: 13, outline: 'none',
                opacity: selectedProject ? 1 : 0.4,
                fontFamily: t.font,
              }}
            >
              <option value="">Select iteration…</option>
              {projectIterations.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── Summary stats ── */}
      {selectedIteration && priorities.length > 0 && (
        <div style={{ display: 'flex', gap: ibmMode ? 1 : 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{
            padding: '12px 16px', flex: 1, minWidth: 120,
            background: t.statBg, border: t.statBorder, borderRadius: t.statRadius,
            borderLeft: ibmMode ? `3px solid ${t.textFaint}` : undefined,
          }}>
            <p style={{ fontSize: 10, color: t.textFaint, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: t.font }}>Total Rows</p>
            <p style={{ fontSize: 22, fontWeight: ibmMode ? 300 : 700, color: t.textPrimary, fontFamily: t.font }}>{rows.length}</p>
          </div>

          <div style={{
            padding: '12px 16px', flex: 1, minWidth: 120,
            background: t.statBg, border: t.statBorder, borderRadius: t.statRadius,
            borderLeft: ibmMode ? `3px solid ${t.accent}` : undefined,
          }}>
            <p style={{ fontSize: 10, color: t.textFaint, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: t.font }}>In Report</p>
            <p style={{ fontSize: 22, fontWeight: ibmMode ? 300 : 700, color: t.accent, fontFamily: t.font }}>{ganttData.length}</p>
          </div>

          {Object.entries(prioritySummary).filter(([k]) => k !== 'Exclude').map(([prio, count]) => {
            const color = t.priorityColors[prio] || t.accent
            return (
              <div key={prio} style={{
                padding: '12px 16px', flex: 1, minWidth: 100,
                background: t.statBg,
                border: ibmMode ? t.statBorder : `1px solid ${color}33`,
                borderRadius: t.statRadius,
                borderLeft: ibmMode ? `3px solid ${color}` : undefined,
              }}>
                <p style={{ fontSize: 10, color: t.textFaint, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: t.font }}>{prio}</p>
                <p style={{ fontSize: 22, fontWeight: ibmMode ? 300 : 700, color, fontFamily: t.font }}>{count}</p>
              </div>
            )
          })}

          {dateRange && (
            <div style={{
              padding: '12px 16px', flex: 1, minWidth: 200,
              background: t.statBg, border: t.statBorder, borderRadius: t.statRadius,
              borderLeft: ibmMode ? `3px solid #8D8D8D` : undefined,
            }}>
              <p style={{ fontSize: 10, color: t.textFaint, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: t.font }}>Timeline</p>
              <p style={{ fontSize: 12, fontWeight: 600, color: t.textPrimary, fontFamily: t.font }}>
                {formatDate(ganttData[0].start_date || ganttData[0].due_date)} — {formatDate(ganttData[ganttData.length - 1].end_date || ganttData[ganttData.length - 1].due_date)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Gantt chart ── */}
      {!selectedIteration ? (
        <div style={{
          background: t.cardBg, border: t.cardBorder, borderRadius: t.cardRadius,
          minHeight: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <BarChart2 size={40} color={t.textFaint} style={{ marginBottom: 12 }} />
          <p style={{ color: t.textFaint, fontSize: 14, fontFamily: t.font }}>Select a project and iteration to view the Gantt chart</p>
        </div>
      ) : ganttData.length === 0 ? (
        <div style={{
          background: t.cardBg, border: t.cardBorder, borderRadius: t.cardRadius,
          minHeight: 240, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <p style={{ color: t.textFaint, fontSize: 13, fontFamily: t.font }}>No rows with due dates in this iteration</p>
        </div>
      ) : (
        <div ref={chartRef} style={{
          background: t.cardBg,
          border: t.cardBorder,
          borderRadius: t.cardRadius,
          overflow: 'hidden',
        }}>
          {/* Chart header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: t.divider,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              {ibmMode && (
                <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.12em', color: t.textFaint, textTransform: 'uppercase', marginBottom: 6, fontFamily: t.font }}>
                  Project Timeline
                </p>
              )}
              <p style={{ fontSize: ibmMode ? 18 : 15, fontWeight: ibmMode ? 300 : 700, color: t.textPrimary, fontFamily: t.font }}>
                {selectedIterObj?.name}
              </p>
              <p style={{ fontSize: 11, color: t.textFaint, marginTop: 2, fontFamily: t.font }}>
                {selectedIterObj?.project_name}
              </p>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: ibmMode ? 16 : 12, flexWrap: 'wrap' }}>
              {Object.entries(t.priorityColors).map(([p, c]) => (
                <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: ibmMode ? 12 : 10,
                    height: ibmMode ? 12 : 10,
                    borderRadius: ibmMode ? 0 : 3,
                    background: c,
                  }} />
                  <span style={{ fontSize: 11, color: t.textMuted, fontFamily: t.font }}>{p}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Gantt rows */}
          <div style={{ padding: '12px 20px 24px', position: 'relative' }} ref={trackRef}>

            {/* Dependency arrows */}
            {depArrows.length > 0 && (
              <svg
                style={{ position: 'absolute', top: 36, left: 20, pointerEvents: 'none', zIndex: 10, overflow: 'visible' }}
                width="100%"
                height={ganttData.length * 38}
              >
                <defs>
                  {Object.entries(t.priorityColors).map(([p, c]) => (
                    <marker key={p} id={`arrow-${p}-${ibmMode ? 'ibm' : 'def'}`} markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                      <path d="M0,0 L0,6 L6,3 z" fill={c} opacity="0.7" />
                    </marker>
                  ))}
                  <marker id={`arrow-default-${ibmMode ? 'ibm' : 'def'}`} markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L6,3 z" fill={t.accent} opacity="0.7" />
                  </marker>
                </defs>
                {depArrows.map((a, idx) => {
                  const pKey = Object.keys(t.priorityColors).find(k => t.priorityColors[k] === a.color)
                  const suffix = ibmMode ? 'ibm' : 'def'
                  const markerId = pKey ? `arrow-${pKey}-${suffix}` : `arrow-default-${suffix}`
                  const cx1 = a.x1 + Math.abs(a.x2 - a.x1) * 0.4
                  const cx2 = a.x2 - Math.abs(a.x2 - a.x1) * 0.4
                  return (
                    <path key={idx}
                      d={`M ${a.x1} ${a.y1} C ${cx1} ${a.y1}, ${cx2} ${a.y2}, ${a.x2} ${a.y2}`}
                      stroke={a.color} strokeOpacity={0.55} strokeWidth={1.5}
                      strokeDasharray="4 3" fill="none"
                      markerEnd={`url(#${markerId})`}
                    />
                  )
                })}
              </svg>
            )}

            {/* Date axis */}
            {dateRange && (
              <div style={{ display: 'flex', marginLeft: 200, marginBottom: ibmMode ? 10 : 8, borderBottom: ibmMode ? `1px solid ${t.gridLine}` : 'none', paddingBottom: ibmMode ? 6 : 0 }}>
                <span style={{ fontSize: 10, color: t.textFaint, fontFamily: t.font }}>
                  {formatDate(new Date(dateRange.min + (dateRange.max - dateRange.min) * 0.05).toISOString().split('T')[0])}
                </span>
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: 10, color: t.textFaint, fontFamily: t.font }}>
                  {formatDate(new Date(dateRange.max - (dateRange.max - dateRange.min) * 0.05).toISOString().split('T')[0])}
                </span>
              </div>
            )}

            {ganttData.map((row, i) => {
              const color    = t.priorityColors[row.priority] || t.accent
              const label    = String((row as Record<string, unknown>)[headers[0]] ?? `Row ${row.row_index + 1}`)
              const subLabel = headers[1] ? String((row as Record<string, unknown>)[headers[1]] ?? '') : ''
              const hasRange = !!(row.start_date && row.end_date)
              const startPct = row.start_date ? getBarPct(row.start_date) : null
              const endPct   = row.end_date   ? getBarPct(row.end_date)   : null
              const duePct   = row.due_date   ? getBarPct(row.due_date)   : null
              const dateLabel = row.start_date && row.end_date
                ? `${formatDate(row.start_date)} → ${formatDate(row.end_date)}`
                : row.due_date ? formatDate(row.due_date) : ''

              return (
                <div key={row.id} style={{ display: 'flex', alignItems: 'center', marginBottom: ibmMode ? 8 : 6, position: 'relative' }}>
                  {/* Row label */}
                  <div style={{ width: 200, flexShrink: 0, paddingRight: 12 }}>
                    <p style={{
                      fontSize: 12, fontWeight: ibmMode ? 400 : 600,
                      color: t.textSecondary,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      fontFamily: t.font,
                    }}>{label}</p>
                    {subLabel && (
                      <p style={{ fontSize: 10, color: t.textFaint, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: t.font }}>
                        {subLabel}
                      </p>
                    )}
                  </div>

                  {/* Bar track */}
                  <div style={{
                    flex: 1, height: ibmMode ? 28 : 32,
                    background: t.trackBg,
                    borderRadius: t.trackRadius,
                    position: 'relative', overflow: 'visible',
                    border: t.trackBorder,
                  }}>
                    {/* Vertical grid lines - IBM only */}
                    {ibmMode && dateRange && [0.25, 0.5, 0.75].map(frac => (
                      <div key={frac} style={{
                        position: 'absolute', left: `${frac * 94}%`, top: 0, bottom: 0,
                        width: 1, background: t.gridLine, opacity: 0.4, zIndex: 0,
                      }} />
                    ))}

                    {/* Activity bar */}
                    {hasRange && startPct !== null && endPct !== null && (
                      <div
                        title={`${row.priority} · ${formatDate(row.start_date)} → ${formatDate(row.end_date)}`}
                        style={{
                          position: 'absolute',
                          left: `${startPct}%`,
                          width: `${Math.max(endPct - startPct, 0.5)}%`,
                          top: '15%', height: '70%',
                          background: color,
                          borderRadius: ibmMode ? 0 : 4,
                          opacity: ibmMode ? 0.85 : 0.65,
                          boxShadow: ibmMode ? 'none' : `0 0 6px ${color}44`,
                          zIndex: 1,
                        }}
                      />
                    )}

                    {/* Due date diamond / marker */}
                    {duePct !== null && (
                      <div
                        title={`Due: ${formatDate(row.due_date)}`}
                        style={{
                          position: 'absolute',
                          left: `${duePct}%`,
                          top: '50%',
                          transform: ibmMode
                            ? 'translate(-50%, -50%)'
                            : 'translate(-50%, -50%) rotate(45deg)',
                          width: ibmMode ? 10 : 12,
                          height: ibmMode ? 10 : 12,
                          background: hasRange ? `${color}cc` : color,
                          borderRadius: ibmMode ? 0 : 2,
                          boxShadow: ibmMode ? 'none' : `0 0 8px ${color}66`,
                          cursor: 'pointer',
                          zIndex: 2,
                        }}
                      />
                    )}

                    {/* Fallback milestone */}
                    {!hasRange && duePct === null && startPct !== null && (
                      <div style={{
                        position: 'absolute', left: `${startPct}%`,
                        top: '50%',
                        transform: ibmMode ? 'translate(-50%, -50%)' : 'translate(-50%, -50%) rotate(45deg)',
                        width: ibmMode ? 10 : 12,
                        height: ibmMode ? 10 : 12,
                        background: color,
                        borderRadius: ibmMode ? 0 : 2,
                        zIndex: 2,
                      }} />
                    )}
                  </div>

                  {/* Date label */}
                  <div style={{ width: 160, flexShrink: 0, paddingLeft: 10 }}>
                    <span style={{ fontSize: 10, color: t.textFaint, whiteSpace: 'nowrap', fontFamily: t.font }}>{dateLabel}</span>
                  </div>

                  {/* Priority badge */}
                  <div style={{ width: 72, flexShrink: 0 }}>
                    <span style={{
                      padding: ibmMode ? '2px 6px' : '2px 7px',
                      borderRadius: t.labelRadius,
                      fontSize: 10, fontWeight: 700,
                      background: ibmMode ? 'transparent' : `${color}22`,
                      color,
                      border: ibmMode ? `1px solid ${color}` : `1px solid ${color}44`,
                      whiteSpace: 'nowrap',
                      fontFamily: t.font,
                      letterSpacing: ibmMode ? '0.04em' : 'normal',
                    }}>{row.priority}</span>
                  </div>
                </div>
              )
            })}

            {/* IBM footer rule */}
            {ibmMode && (
              <div style={{ marginTop: 20, borderTop: `1px solid ${t.gridLine}`, paddingTop: 12 }}>
                <p style={{ fontSize: 10, color: t.textFaint, fontFamily: t.font, letterSpacing: '0.04em' }}>
                  {selectedIterObj?.project_name} · {selectedIterObj?.name} · {ganttData.length} items
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ReportClient() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: 'rgba(255,255,255,0.3)' }}>Loading…</div>}>
      <ReportInner />
    </Suspense>
  )
}
