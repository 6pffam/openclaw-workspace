'use client'
import { useState, useEffect, useCallback } from 'react'
import { Archive, RotateCcw, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface Iteration {
  id: number
  name: string
  project_id: number
  project_name: string
  created_at: string
  archived_at: string
}

export default function ArchiveClient() {
  const [archived, setArchived] = useState<Iteration[]>([])

  const fetchArchived = useCallback(async () => {
    const res = await fetch('/api/iterations?archived=true')
    setArchived(await res.json())
  }, [])

  useEffect(() => { fetchArchived() }, [fetchArchived])

  const restore = async (id: number) => {
    await fetch('/api/iterations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, archived: false }),
    })
    fetchArchived()
  }

  const remove = async (id: number) => {
    if (!confirm('Permanently delete this archived iteration?')) return
    await fetch('/api/iterations', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    fetchArchived()
  }

  // Group by project
  const grouped: Record<string, Iteration[]> = {}
  archived.forEach(i => {
    if (!grouped[i.project_name]) grouped[i.project_name] = []
    grouped[i.project_name].push(i)
  })

  return (
    <div className="max-w-5xl mx-auto" style={{ paddingTop: 8 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 className="text-2xl font-semibold text-white" style={{ marginBottom: 4 }}>Archive</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Historical iterations stored for reference</p>
      </div>

      {archived.length === 0 ? (
        <div className="rounded-2xl flex flex-col items-center justify-center" style={{ background: '#0f2236', border: '1px solid rgba(255,255,255,0.06)', minHeight: 280 }}>
          <Archive size={36} color="rgba(255,255,255,0.1)" style={{ marginBottom: 12 }} />
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>No archived iterations yet</p>
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, marginTop: 6 }}>Archive iterations from the Projects tab</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {Object.entries(grouped).map(([projectName, iters]) => (
            <div key={projectName} className="rounded-2xl" style={{ background: '#0f2236', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{projectName}</p>
              </div>
              <div style={{ padding: '8px 12px 12px' }}>
                {iters.map(iter => (
                  <div
                    key={iter.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px', borderRadius: 12, marginTop: 6,
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.04)',
                      opacity: 0.85,
                    }}
                  >
                    <Archive size={14} color="rgba(255,255,255,0.2)" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: 500 }}>{iter.name}</p>
                      <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, marginTop: 2 }}>
                        Archived {new Date(iter.archived_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Link
                        href={`/report?project=${iter.project_id}&iteration=${iter.id}`}
                        style={{
                          fontSize: 11, padding: '4px 10px', borderRadius: 8,
                          background: 'rgba(96,165,250,0.08)', color: '#60a5fa',
                          border: '1px solid rgba(96,165,250,0.15)', textDecoration: 'none', fontWeight: 600,
                        }}
                      >View</Link>
                      <button
                        onClick={() => restore(iter.id)}
                        title="Restore"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          padding: '4px 10px', borderRadius: 8, cursor: 'pointer',
                          background: 'rgba(52,211,153,0.08)', color: '#34d399',
                          border: '1px solid rgba(52,211,153,0.15)', fontSize: 11, fontWeight: 600,
                        }}
                      >
                        <RotateCcw size={12} />
                        Restore
                      </button>
                      <button
                        onClick={() => remove(iter.id)}
                        style={{
                          display: 'flex', alignItems: 'center',
                          padding: '4px 8px', borderRadius: 8, cursor: 'pointer',
                          background: 'rgba(239,68,68,0.08)', color: '#ef4444',
                          border: '1px solid rgba(239,68,68,0.12)',
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
