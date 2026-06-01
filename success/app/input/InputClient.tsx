'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Upload, FileSpreadsheet, Trash2, CheckCircle, AlertCircle, Clock } from 'lucide-react'

export type ColumnType = 'text' | 'number' | 'date'

// ─── Badge ────────────────────────────────────────────────────────────────────
const TYPE_STYLES: Record<ColumnType, { bg: string; color: string; label: string }> = {
  date:   { bg: 'rgba(251,191,36,0.15)',  color: '#fbbf24', label: 'date' },
  number: { bg: 'rgba(96,165,250,0.15)',  color: '#60a5fa', label: 'num' },
  text:   { bg: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)', label: 'text' },
}
const TYPE_CYCLE: ColumnType[] = ['text', 'number', 'date']

function TypeBadge({ type, onToggle }: { type: ColumnType; onToggle: () => void }) {
  const s = TYPE_STYLES[type]
  return (
    <button
      onClick={e => { e.preventDefault(); onToggle() }}
      title="Click to change type"
      style={{
        display: 'inline-block',
        padding: '1px 6px',
        borderRadius: 4,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        background: s.bg,
        color: s.color,
        border: 'none',
        cursor: 'pointer',
        marginTop: 3,
      }}
    >
      {s.label}
    </button>
  )
}

interface Project {
  id: number
  name: string
  column_headers: string[]
  column_types: Record<string, ColumnType>
  created_at: string
  row_count: number
}

interface ParsedFile {
  headers: string[]
  rows: Record<string, unknown>[]
  columnTypes: Record<string, ColumnType>
}

export default function InputClient() {
  const [projects, setProjects] = useState<Project[]>([])
  const [projectName, setProjectName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [parsed, setParsed] = useState<ParsedFile | null>(null)
  const [columnTypes, setColumnTypes] = useState<Record<string, ColumnType>>({})
  const [parsing, setParsing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const fetchProjects = useCallback(async () => {
    const res = await fetch('/api/projects')
    setProjects(await res.json())
  }, [])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  const handleFile = async (f: File) => {
    setFile(f)
    setParsed(null)
    setStatus(null)
    setParsing(true)

    try {
      const form = new FormData()
      form.append('file', f)
      const res = await fetch('/api/parse-excel', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) {
        setStatus({ type: 'error', msg: data.error || 'Parse failed' })
        setParsing(false)
        return
      }
      setParsed(data)
      setColumnTypes(data.columnTypes)
    } catch (err: unknown) {
      setStatus({ type: 'error', msg: err instanceof Error ? err.message : 'Unknown error' })
    }
    setParsing(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const handleSubmit = async () => {
    if (!file || !projectName.trim() || !parsed) return
    setLoading(true)
    setStatus(null)

    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: projectName.trim(),
        column_headers: parsed.headers,
        column_types: columnTypes,
        rows: parsed.rows,
      }),
    })

    setLoading(false)
    if (res.ok) {
      setStatus({ type: 'success', msg: `Project "${projectName}" imported with ${parsed.rows.length} rows.` })
      setFile(null)
      setParsed(null)
      setProjectName('')
      setColumnTypes({})
      fetchProjects()
    } else {
      const err = await res.json()
      setStatus({ type: 'error', msg: err.error || 'Import failed.' })
    }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete project "${name}"? This will remove all iterations and data.`)) return
    await fetch('/api/projects', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    fetchProjects()
  }

  const canSubmit = !!file && !!projectName.trim() && !!parsed && !loading

  return (
    <div className="max-w-5xl mx-auto" style={{ paddingTop: 8 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 className="text-2xl font-semibold text-white" style={{ marginBottom: 4 }}>Import Project Data</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Upload an Excel file to create a new project dataset</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        {/* Main upload card */}
        <div>
          <div className="rounded-2xl p-5" style={{ background: '#0f2236', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 className="text-xs font-semibold tracking-wider uppercase mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
              New Project
            </h2>

            {/* Project name */}
            <label className="block text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Project Name</label>
            <input
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              placeholder="e.g. Q3 Infrastructure Rollout"
              className="w-full px-3 py-2 rounded-xl text-sm outline-none text-white placeholder:text-white/30 mb-4"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            />

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              style={{
                position: 'relative',
                border: `2px dashed ${dragging ? '#60a5fa' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: 16,
                padding: '36px 24px',
                textAlign: 'center',
                cursor: 'pointer',
                background: dragging ? 'rgba(96,165,250,0.05)' : 'rgba(255,255,255,0.02)',
                transition: 'all 0.15s',
                marginBottom: 16,
              }}
            >
              {/* Transparent overlay input — most reliable cross-browser file trigger */}
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) handleFile(f)
                  e.target.value = ''
                }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer',
                  zIndex: 10,
                }}
              />

              <div style={{ pointerEvents: 'none' }}>
                {parsing ? (
                  <div>
                    <div style={{ width: 32, height: 32, border: '3px solid rgba(96,165,250,0.3)', borderTopColor: '#60a5fa', borderRadius: '50%', margin: '0 auto 10px', animation: 'spin 0.8s linear infinite' }} />
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Parsing file…</p>
                  </div>
                ) : file && parsed ? (
                  <div>
                    <FileSpreadsheet size={32} color="#60a5fa" style={{ margin: '0 auto 8px' }} />
                    <p style={{ color: '#60a5fa', fontSize: 14, fontWeight: 600 }}>{file.name}</p>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 4 }}>
                      {parsed.rows.length} rows · {parsed.headers.length} columns
                    </p>
                  </div>
                ) : (
                  <div>
                    <Upload size={28} color="rgba(255,255,255,0.25)" style={{ margin: '0 auto 10px' }} />
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Drop your Excel file here or click to browse</p>
                    <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, marginTop: 4 }}>.xlsx or .xls · Single sheet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Preview table */}
            {parsed && (
              <div style={{ marginBottom: 16, overflowX: 'auto', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {parsed.headers.map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', whiteSpace: 'nowrap' }}>
                          <div style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: 10, marginBottom: 2 }}>{h}</div>
                          <TypeBadge
                            type={columnTypes[h] ?? 'text'}
                            onToggle={() => {
                              const cur = columnTypes[h] ?? 'text'
                              const next = TYPE_CYCLE[(TYPE_CYCLE.indexOf(cur) + 1) % TYPE_CYCLE.length]
                              setColumnTypes(prev => ({ ...prev, [h]: next }))
                            }}
                          />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.rows.slice(0, 5).map((row, i) => (
                      <tr key={i} style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                        {parsed.headers.map(h => (
                          <td key={h} style={{ padding: '7px 12px', color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {String(row[h] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsed.rows.length > 5 && (
                  <div style={{ padding: '8px 12px', color: 'rgba(255,255,255,0.3)', fontSize: 11, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    +{parsed.rows.length - 5} more rows · Click any badge to override type
                  </div>
                )}
              </div>
            )}

            {/* Status */}
            {status && (
              <div className="flex items-center gap-2 rounded-xl px-4 py-3 mb-4" style={{
                background: status.type === 'success' ? 'rgba(52,211,153,0.12)' : 'rgba(239,68,68,0.12)',
                color: status.type === 'success' ? '#34d399' : '#ef4444',
                border: `1px solid ${status.type === 'success' ? 'rgba(52,211,153,0.2)' : 'rgba(239,68,68,0.2)'}`,
                fontSize: 13,
              }}>
                {status.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                {status.msg}
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full px-4 py-2.5 rounded-xl text-sm font-medium"
              style={{
                background: canSubmit ? '#3b82f6' : 'rgba(255,255,255,0.06)',
                color: canSubmit ? 'white' : 'rgba(255,255,255,0.3)',
                cursor: canSubmit ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s',
              }}
            >
              {loading ? 'Importing…' : !file ? 'Select a file first' : !projectName.trim() ? 'Enter a project name' : !parsed ? 'Waiting for parse…' : 'Import Project'}
            </button>
          </div>
        </div>

        {/* Existing projects sidebar */}
        <div>
          <div className="rounded-2xl p-5" style={{ background: '#0f2236', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 className="text-xs font-semibold tracking-wider uppercase mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Existing Projects
            </h2>
            {projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <span style={{ fontSize: 28 }}>📂</span>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>No projects yet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {projects.map(p => (
                  <div key={p.id} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ color: 'white', fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{p.name}</p>
                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>
                          {p.row_count} rows · {p.column_headers.length} cols
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                          <Clock size={10} color="rgba(255,255,255,0.25)" />
                          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>
                            {new Date(p.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        style={{ color: 'rgba(239,68,68,0.5)', cursor: 'pointer', background: 'none', border: 'none', padding: 4 }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
