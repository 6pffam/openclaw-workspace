'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import CategoryManager from '@/components/connections/CategoryManager'
import AddConnectionModal from '@/components/connections/AddConnectionModal'
import type { GraphNode, GraphLink, ConnectionCategory } from '@/lib/connections'

const ForceGraph = dynamic(() => import('@/components/connections/ForceGraph'), { ssr: false })

const PANEL_STYLE = {
  background: '#0f2236',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 14,
  padding: 16,
  width: 220,
}

export default function ConnectionsClient() {
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [links, setLinks] = useState<GraphLink[]>([])
  const [categories, setCategories] = useState<ConnectionCategory[]>([])
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [selectedLink, setSelectedLink] = useState<GraphLink | null>(null)
  const [deletingLinkId, setDeletingLinkId] = useState<string | null>(null)

  const loadGraph = useCallback(async () => {
    const url = filterCategory
      ? `/api/connections?mode=graph&category=${filterCategory}`
      : '/api/connections?mode=graph'
    const [graphRes, catsRes] = await Promise.all([
      fetch(url),
      fetch('/api/categories'),
    ])
    if (graphRes.ok) {
      const data = await graphRes.json()
      setNodes(data.nodes)
      setLinks(data.links)
    }
    if (catsRes.ok) setCategories(await catsRes.json())
    setLoading(false)
  }, [filterCategory])

  useEffect(() => { loadGraph() }, [loadGraph])

  async function handleDeleteLink(linkId: string) {
    setDeletingLinkId(linkId)
    await fetch(`/api/connections/${linkId}`, { method: 'DELETE' })
    setSelectedLink(null)
    setDeletingLinkId(null)
    loadGraph()
  }

  return (
    <div className="flex flex-col md:flex-row gap-3 md:gap-4" style={{ height: 'auto' }}>
      {/* Sidebar */}
      <div style={{
        background: '#0f2236',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16,
        padding: '16px 14px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        flexShrink: 0,
        width: '100%',
      }} className="md:w-[220px]">
        <div>
          <div
            className="text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            Graph
          </div>
          <div className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <div>{nodes.length} people</div>
            <div>{links.length} connections</div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16 }}>
          <CategoryManager
            categories={categories}
            onUpdate={loadGraph}
            filterCategory={filterCategory}
            onFilterChange={setFilterCategory}
          />
        </div>

        <div style={{ marginTop: 'auto' }}>
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: '#f59e0b', color: '#0d1b2a' }}
          >
            + Add Connection
          </button>
        </div>
      </div>

      {/* Graph canvas */}
      <div style={{
        flex: 1,
        minHeight: '60vh',
        background: '#0f2236',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
      }}>
        {loading ? (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,0.3)', fontSize: 14,
          }}>
            Loading graph…
          </div>
        ) : nodes.length === 0 ? (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 12,
          }}>
            <span style={{ fontSize: 48 }}>🕸️</span>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>No connections yet.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: '#f59e0b', color: '#0d1b2a' }}
            >
              Add your first connection
            </button>
          </div>
        ) : (
          <ForceGraph
            nodes={nodes}
            links={links}
            selectedNodeId={selectedNode?.id}
            onNodeClick={(node) => {
              setSelectedNode(node?.id ? node : null)
              setSelectedLink(null)
            }}
            onLinkClick={(link) => {
              setSelectedLink(link)
              setSelectedNode(null)
            }}
          />
        )}

        {/* Legend */}
        {nodes.length > 0 && (
          <div style={{
            position: 'absolute', bottom: 12, left: 12,
            background: 'rgba(13,27,42,0.9)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
            padding: '8px 12px',
            fontSize: 11,
            color: 'rgba(255,255,255,0.4)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: 4, color: 'rgba(255,255,255,0.7)' }}>Legend</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="20" height="8"><line x1="0" y1="4" x2="20" y2="4" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/></svg>
                Symmetric
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="20" height="8"><line x1="0" y1="4" x2="20" y2="4" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/></svg>
                Directional
              </div>
              <div>Inner ring = tier</div>
              <div>Outer rings = categories</div>
            </div>
          </div>
        )}

        {/* Node detail panel */}
        {selectedNode && (
          <div style={{ position: 'absolute', top: 12, right: 12, ...PANEL_STYLE }}>
            <button
              onClick={() => setSelectedNode(null)}
              style={{ position: 'absolute', top: 10, right: 12, color: 'rgba(255,255,255,0.3)', fontSize: 18 }}
            >×</button>
            <div className="font-semibold text-sm mb-1 text-white">{selectedNode.name}</div>
            <div className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {selectedNode.tier !== 'None' ? selectedNode.tier : 'No tier'}
            </div>
            <div className="flex flex-wrap gap-1 mb-3">
              {selectedNode.ringColors.map((color, i) => (
                <span key={i} style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: color, display: 'inline-block',
                }} />
              ))}
            </div>
            <div className="flex gap-2">
              <a
                href={`/contacts/${selectedNode.id}`}
                className="flex-1 text-center py-1.5 rounded-lg text-xs font-medium"
                style={{ background: 'rgba(96,165,250,0.12)', color: '#60a5fa' }}
              >
                View card
              </a>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex-1 py-1.5 rounded-lg text-xs font-medium"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.5)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                Connect
              </button>
            </div>
          </div>
        )}

        {/* Link detail panel */}
        {selectedLink && (
          <div style={{ position: 'absolute', top: 12, right: 12, ...PANEL_STYLE }}>
            <button
              onClick={() => setSelectedLink(null)}
              style={{ position: 'absolute', top: 10, right: 12, color: 'rgba(255,255,255,0.3)', fontSize: 18 }}
            >×</button>
            <div
              className="text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              Connection
            </div>
            <div className="flex flex-wrap gap-1 mb-3">
              {selectedLink.categoryNames.map((name, i) => (
                <span key={i} style={{
                  fontSize: 11, padding: '2px 8px', borderRadius: 99,
                  background: (i === 0 ? selectedLink.primaryColor : 'rgba(255,255,255,0.15)') + '20',
                  color: i === 0 ? selectedLink.primaryColor : 'rgba(255,255,255,0.4)',
                  border: `1px solid ${i === 0 ? selectedLink.primaryColor : 'rgba(255,255,255,0.1)'}30`,
                }}>
                  {name}{i === 0 ? ' ★' : ''}
                </span>
              ))}
            </div>
            <div className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {selectedLink.isDirectional ? 'Directional' : 'Symmetric'}
            </div>
            <button
              onClick={() => handleDeleteLink(selectedLink.id)}
              disabled={deletingLinkId === selectedLink.id}
              className="w-full py-1.5 rounded-lg text-xs font-medium"
              style={{
                background: 'rgba(239,68,68,0.12)',
                color: '#ef4444',
                border: '1px solid rgba(239,68,68,0.2)',
                opacity: deletingLinkId ? 0.6 : 1,
              }}
            >
              {deletingLinkId === selectedLink.id ? 'Removing…' : 'Remove connection'}
            </button>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddConnectionModal
          onClose={() => setShowAddModal(false)}
          onCreated={() => { setShowAddModal(false); loadGraph() }}
          preselectedContactId={selectedNode?.id}
        />
      )}
    </div>
  )
}
