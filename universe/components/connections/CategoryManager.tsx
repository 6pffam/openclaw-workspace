'use client'

import { useState } from 'react'
import type { ConnectionCategory } from '@/lib/connections'

const COLOR_PRESETS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#6b7280',
]

interface Props {
  categories: ConnectionCategory[]
  onUpdate: () => void
  filterCategory: string | null
  onFilterChange: (id: string | null) => void
}

export default function CategoryManager({ categories, onUpdate, filterCategory, onFilterChange }: Props) {
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#3b82f6')
  const [saving, setSaving] = useState(false)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setSaving(true)
    await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), color: newColor }),
    })
    setSaving(false)
    setNewName('')
    setAdding(false)
    onUpdate()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this category? Connections using it will lose this category assignment.')) return
    await fetch(`/api/categories/${id}`, { method: 'DELETE' })
    if (filterCategory === id) onFilterChange(null)
    onUpdate()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          Categories
        </span>
        <button
          onClick={() => setAdding(!adding)}
          className="text-xs px-2 py-1 rounded-lg"
          style={{ color: '#60a5fa', background: 'rgba(96,165,250,0.1)' }}
        >
          + New
        </button>
      </div>

      <div className="space-y-1 mb-3">
        <button
          onClick={() => onFilterChange(null)}
          className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all"
          style={{
            background: !filterCategory ? 'rgba(255,255,255,0.08)' : 'transparent',
            color: !filterCategory ? 'white' : 'rgba(255,255,255,0.45)',
            fontWeight: !filterCategory ? 600 : 400,
          }}
        >
          All connections
        </button>
        {categories.map(cat => (
          <div key={cat.id} className="group flex items-center gap-1">
            <button
              onClick={() => onFilterChange(filterCategory === cat.id ? null : cat.id)}
              className="flex-1 text-left flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all"
              style={{
                background: filterCategory === cat.id ? cat.color + '18' : 'transparent',
                color: filterCategory === cat.id ? cat.color : 'rgba(255,255,255,0.45)',
                fontWeight: filterCategory === cat.id ? 600 : 400,
              }}
            >
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: cat.color, flexShrink: 0, display: 'inline-block',
              }} />
              {cat.name}
            </button>
            <button
              onClick={() => handleDelete(cat.id)}
              className="opacity-0 group-hover:opacity-100 p-1 rounded text-xs transition-opacity"
              style={{ color: 'rgba(255,255,255,0.3)' }}
              title="Delete category"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {adding && (
        <form
          onSubmit={handleAdd}
          className="space-y-2 pt-2"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Category name"
            autoFocus
            className="w-full px-3 py-2 rounded-xl text-xs outline-none text-white placeholder:text-white/30"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          />
          <div className="flex flex-wrap gap-1.5">
            {COLOR_PRESETS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setNewColor(c)}
                style={{
                  width: 20, height: 20,
                  borderRadius: '50%',
                  background: c,
                  border: newColor === c ? '2px solid white' : '2px solid transparent',
                  padding: 0,
                }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="flex-1 py-1.5 rounded-lg text-xs"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: '#f59e0b', color: '#0d1b2a' }}
            >
              Add
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
