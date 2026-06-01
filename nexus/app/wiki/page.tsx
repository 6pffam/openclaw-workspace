'use client'

import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'

const WikiGraph = dynamic(() => import('./WikiGraph'), { ssr: false })

interface WikiPage {
  slug: string
  title: string
  type: string
  status: string
  updated: string
  tags: string[]
  summary: string
}

interface GraphData {
  nodes: { id: string; title: string; type: string }[]
  links: { source: string; target: string }[]
}

const typeColor: Record<string, string> = {
  project:  '#f59e0b',
  person:   '#60a5fa',
  topic:    '#34d399',
  decision: '#a78bfa',
  meta:     'rgba(255,255,255,0.3)',
}

const typeGroups = ['project', 'person', 'topic', 'decision', 'meta']
const groupLabel: Record<string, string> = {
  project: '🏗️ Projects',
  person:  '👤 People',
  topic:   '📚 Topics',
  decision:'📋 Decisions',
  meta:    '⚙️ Meta',
}

export default function WikiPage() {
  const [pages, setPages] = useState<WikiPage[]>([])
  const [graph, setGraph] = useState<GraphData>({ nodes: [], links: [] })
  const [selected, setSelected] = useState<string | null>(null)
  const [content, setContent] = useState<string>('')
  const [view, setView] = useState<'reader' | 'graph'>('reader')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/wiki').then(r => r.json()).then(setPages)
    fetch('/api/wiki?view=graph').then(r => r.json()).then(setGraph)
  }, [])

  const loadPage = useCallback(async (slug: string) => {
    setSelected(slug)
    setLoading(true)
    const res = await fetch(`/api/wiki/page?slug=${encodeURIComponent(slug)}`)
    const data = await res.json()
    setContent(data.html || '<p>Page not found</p>')
    setLoading(false)
    setView('reader')
  }, [])

  // Load overview on first render
  useEffect(() => {
    if (pages.length && !selected) {
      loadPage('overview')
    }
  }, [pages, selected, loadPage])

  const filtered = pages.filter(p =>
    !search ||
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.summary.toLowerCase().includes(search.toLowerCase()) ||
    p.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  )

  const grouped = typeGroups
    .map(type => ({ type, pages: filtered.filter(p => p.type === type) }))
    .filter(g => g.pages.length > 0)

  const selectedPage = pages.find(p => p.slug === selected)

  return (
    <div className="flex h-[calc(100vh-52px)] overflow-hidden">

      {/* Sidebar */}
      <div
        className="flex-shrink-0 w-64 flex flex-col overflow-hidden"
        style={{ borderRight: '1px solid rgba(255,255,255,0.05)', backgroundColor: '#0a1623' }}
      >
        {/* Search */}
        <div className="p-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <input
            type="text"
            placeholder="Search wiki…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg text-xs text-white outline-none"
            style={{
              backgroundColor: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'white',
            }}
          />
        </div>

        {/* Page list */}
        <div className="flex-1 overflow-y-auto py-2">
          {grouped.map(group => (
            <div key={group.type} className="mb-3">
              <div
                className="px-4 py-1 text-xs font-semibold tracking-wider uppercase"
                style={{ color: 'rgba(255,255,255,0.25)' }}
              >
                {groupLabel[group.type] || group.type}
              </div>
              {group.pages.map(page => (
                <button
                  key={page.slug}
                  onClick={() => loadPage(page.slug)}
                  className="w-full text-left px-4 py-2 transition-all"
                  style={{
                    backgroundColor: selected === page.slug ? 'rgba(255,255,255,0.07)' : 'transparent',
                    borderLeft: selected === page.slug
                      ? `2px solid ${typeColor[page.type] || 'white'}`
                      : '2px solid transparent',
                  }}
                >
                  <div className="text-xs font-medium" style={{
                    color: selected === page.slug ? 'white' : 'rgba(255,255,255,0.6)'
                  }}>
                    {page.title}
                  </div>
                  {page.summary && (
                    <div className="text-xs mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      {page.summary}
                    </div>
                  )}
                </button>
              ))}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-3 text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
              No pages match &ldquo;{search}&rdquo;
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="p-3 flex-shrink-0 text-xs" style={{
          borderTop: '1px solid rgba(255,255,255,0.05)',
          color: 'rgba(255,255,255,0.2)',
        }}>
          {pages.length} pages · {graph.links.length} links
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <div
          className="flex-shrink-0 flex items-center justify-between px-6 py-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div>
            {selectedPage && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">{selectedPage.title}</span>
                {selectedPage.type && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${typeColor[selectedPage.type]}22`,
                      color: typeColor[selectedPage.type] || 'white',
                    }}
                  >
                    {selectedPage.type}
                  </span>
                )}
                {selectedPage.updated && (
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    updated {selectedPage.updated}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* View toggle */}
          <div
            className="flex gap-1 p-1 rounded-lg"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
          >
            {(['reader', 'graph'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="px-3 py-1 rounded text-xs font-medium transition-all"
                style={{
                  backgroundColor: view === v ? 'rgba(255,255,255,0.12)' : 'transparent',
                  color: view === v ? 'white' : 'rgba(255,255,255,0.4)',
                }}
              >
                {v === 'reader' ? '📄 Reader' : '🕸️ Graph'}
              </button>
            ))}
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-auto">
          {view === 'reader' ? (
            <div className="max-w-3xl mx-auto px-8 py-8">
              {loading ? (
                <div className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>Loading…</div>
              ) : (
                <div
                  className="wiki-content"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              )}
            </div>
          ) : (
            <div style={{ width: '100%', height: '100%' }}>
              <WikiGraph data={graph} onSelect={loadPage} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
