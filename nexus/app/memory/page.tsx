'use client'

import { useEffect, useState } from 'react'

interface MemoryFile {
  date: string
  sizeBytes: number
  preview: string
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  return `${(bytes / 1024).toFixed(1)}KB`
}

export default function MemoryPage() {
  const [files, setFiles] = useState<MemoryFile[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [content, setContent] = useState<string>('')
  const [loadingContent, setLoadingContent] = useState(false)

  useEffect(() => {
    fetch('/api/memory')
      .then(r => r.json())
      .then(d => {
        setFiles(d.files ?? [])
        // Auto-select most recent
        if (d.files?.length > 0) setSelected(d.files[0].date)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!selected) return
    setLoadingContent(true)
    fetch(`/api/memory?date=${selected}`)
      .then(r => r.json())
      .then(d => setContent(d.content ?? ''))
      .catch(() => setContent('Failed to load.'))
      .finally(() => setLoadingContent(false))
  }, [selected])

  return (
    <div className="max-w-6xl mx-auto pt-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white tracking-tight">Memory</h1>
        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {files.length} daily session logs
        </p>
      </div>

      {/* Mobile date picker */}
      <div className="block md:hidden mb-4">
        <select
          value={selected ?? ''}
          onChange={e => setSelected(e.target.value)}
          className="w-full rounded-xl px-3 py-2 text-sm"
          style={{
            backgroundColor: '#0f2236',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.8)',
          }}
        >
          {files.map(f => (
            <option key={f.date} value={f.date}>{formatDate(f.date)}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-6">
        {/* Date list — desktop only */}
        <div className="hidden md:block w-64 shrink-0 space-y-2">
          {files.map(f => (
            <button
              key={f.date}
              onClick={() => setSelected(f.date)}
              className="w-full text-left rounded-xl p-3 transition-all"
              style={{
                backgroundColor: selected === f.date ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.03)',
                border: selected === f.date
                  ? '1px solid rgba(96,165,250,0.3)'
                  : '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <div className="text-xs font-semibold" style={{ color: selected === f.date ? '#60a5fa' : 'rgba(255,255,255,0.7)' }}>
                {formatDate(f.date)}
              </div>
              <div className="text-xs mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {f.preview || 'No preview'}
              </div>
              <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
                {formatSize(f.sizeBytes)}
              </div>
            </button>
          ))}

          {files.length === 0 && (
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>No memory files found.</p>
          )}
        </div>

        {/* Content viewer */}
        <div className="flex-1 min-w-0 md:block">
          {selected ? (
            <div
              className="rounded-2xl p-6"
              style={{ backgroundColor: '#0f2236', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white">{formatDate(selected)}</h2>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{selected}</span>
              </div>

              {loadingContent ? (
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Loading…</p>
              ) : (
                <pre
                  className="text-xs leading-relaxed whitespace-pre-wrap font-mono overflow-auto"
                  style={{ color: 'rgba(255,255,255,0.7)', maxHeight: '70vh' }}
                >
                  {content}
                </pre>
              )}
            </div>
          ) : (
            <div
              className="rounded-2xl p-6 flex items-center justify-center"
              style={{ backgroundColor: '#0f2236', border: '1px solid rgba(255,255,255,0.06)', minHeight: '200px' }}
            >
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Select a date to read</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
