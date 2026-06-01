'use client'

import { useState, useEffect, useRef } from 'react'
import type { ConnectionCategory } from '@/lib/connections'
import type { Contact } from '@/lib/contacts'

interface Props {
  onClose: () => void
  onCreated: () => void
  preselectedContactId?: string
}

function useContactSearch(query: string, excludeId?: string) {
  const [results, setResults] = useState<Contact[]>([])
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ search: query, limit: '20', offset: '0' })
        const res = await fetch(`/api/contacts?${params}`)
        if (res.ok) {
          const d = await res.json()
          setResults((d.contacts as Contact[]).filter(c => c.id !== excludeId))
        }
      } catch { /* ignore */ }
      setLoading(false)
    }, 200)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [query, excludeId])

  return { results, loading }
}

export default function AddConnectionModal({ onClose, onCreated, preselectedContactId }: Props) {
  const [categories, setCategories] = useState<ConnectionCategory[]>([])
  const [contactA, setContactA] = useState(preselectedContactId || '')
  const [contactB, setContactB] = useState('')
  const [contactAName, setContactAName] = useState('')
  const [contactBName, setContactBName] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [isDirectional, setIsDirectional] = useState(false)
  const [searchA, setSearchA] = useState('')
  const [searchB, setSearchB] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const { results: resultsA, loading: loadingA } = useContactSearch(searchA, contactB)
  const { results: resultsB, loading: loadingB } = useContactSearch(searchB, contactA)

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(setCategories).catch(() => {})
    if (preselectedContactId) {
      fetch(`/api/contacts/${preselectedContactId}`)
        .then(r => r.json())
        .then(d => {
          if (d.contact) {
            setContactAName(d.contact.display_name)
            setSearchA(d.contact.display_name)
          }
        })
        .catch(() => {})
    }
  }, [preselectedContactId])

  function toggleCategory(id: string) {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!contactA || !contactB) { setError('Select both contacts.'); return }
    if (!selectedCategories.length) { setError('Select at least one category.'); return }
    setSaving(true)
    const res = await fetch('/api/connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contact_a: contactA,
        contact_b: contactB,
        is_directional: isDirectional,
        category_ids: selectedCategories,
      }),
    })
    setSaving(false)
    if (res.ok) {
      onCreated()
    } else {
      const d = await res.json()
      setError(d.error || 'Failed to create connection.')
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#0f2236',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '20px 20px 0 0',
        width: '100%', maxWidth: 480,
        padding: '28px 28px max(24px, env(safe-area-inset-bottom))',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-base text-white">Add Connection</h2>
          <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.3)', fontSize: 20, lineHeight: 1 }}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Person A</label>
            <ContactPicker
              value={contactA}
              displayValue={searchA}
              options={resultsA}
              loading={loadingA}
              onSearch={v => { setSearchA(v); if (contactA) { setContactA(''); setContactAName('') } }}
              onSelect={(id, name) => { setContactA(id); setContactAName(name); setSearchA(name) }}
              placeholder="Type a name to search…"
            />
          </div>

          {/* Directional toggle */}
          <div className="flex items-center gap-3">
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
            <button
              type="button"
              onClick={() => setIsDirectional(!isDirectional)}
              className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.55)',
              }}
            >
              <span>{isDirectional ? '→' : '↔'}</span>
              {isDirectional ? 'Directional' : 'Symmetric'}
            </button>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Person B</label>
            <ContactPicker
              value={contactB}
              displayValue={searchB}
              options={resultsB}
              loading={loadingB}
              onSearch={v => { setSearchB(v); if (contactB) { setContactB(''); setContactBName('') } }}
              onSelect={(id, name) => { setContactB(id); setContactBName(name); setSearchB(name) }}
              placeholder="Type a name to search…"
            />
          </div>

          {contactA && contactB && (
            <div
              className="text-sm text-center py-2 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)' }}
            >
              <strong className="text-white">{contactAName}</strong>
              {' '}{isDirectional ? '→' : '↔'}{' '}
              <strong className="text-white">{contactBName}</strong>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Categories{' '}
              <span style={{ color: 'rgba(255,255,255,0.25)', fontWeight: 400 }}>(first selected = primary)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => {
                const selected = selectedCategories.includes(cat.id)
                const isPrimary = selectedCategories[0] === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    style={{
                      background: selected ? cat.color + '20' : 'rgba(255,255,255,0.04)',
                      color: selected ? cat.color : 'rgba(255,255,255,0.45)',
                      border: `1.5px solid ${selected ? cat.color + '50' : 'rgba(255,255,255,0.07)'}`,
                    }}
                  >
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: cat.color, display: 'inline-block', flexShrink: 0,
                    }} />
                    {cat.name}
                    {isPrimary && selected && <span style={{ fontSize: 9 }}>★</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {error && (
            <p className="text-sm" style={{ color: '#ef4444' }}>{error}</p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium"
              style={{
                background: 'rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.45)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: '#f59e0b', color: '#0d1b2a', opacity: saving ? 0.6 : 1 }}
            >
              {saving ? 'Saving…' : 'Add Connection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ContactPicker({
  value,
  displayValue,
  options,
  loading,
  onSearch,
  onSelect,
  placeholder,
}: {
  value: string
  displayValue: string
  options: Contact[]
  loading: boolean
  onSearch: (v: string) => void
  onSelect: (id: string, name: string) => void
  placeholder: string
}) {
  const [open, setOpen] = useState(false)
  const selected = !!value

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        value={displayValue}
        onChange={e => { onSearch(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-xl text-sm outline-none text-white placeholder:text-white/25"
        style={{
          background: selected ? 'rgba(96,165,250,0.08)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${selected ? 'rgba(96,165,250,0.3)' : 'rgba(255,255,255,0.08)'}`,
        }}
      />
      {open && !selected && (
        <div style={{
          position: 'absolute',
          top: '100%', left: 0, right: 0,
          background: '#0f2236',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          zIndex: 200, marginTop: 4, overflow: 'hidden',
        }}>
          {loading && (
            <div className="px-4 py-3 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Searching…</div>
          )}
          {!loading && options.length === 0 && displayValue.trim() && (
            <div className="px-4 py-3 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              No results for &ldquo;{displayValue}&rdquo;
            </div>
          )}
          {!loading && options.map(c => (
            <button
              key={c.id}
              type="button"
              onMouseDown={() => { onSelect(c.id, c.display_name); setOpen(false) }}
              className="w-full text-left px-4 py-2.5 text-sm transition-all"
              style={{ color: 'white' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span className="font-medium">{c.display_name}</span>
              {c.company && (
                <span style={{ color: 'rgba(255,255,255,0.3)', marginLeft: 8, fontSize: 11 }}>
                  {c.company}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
