'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Avatar from '@/components/contacts/Avatar'
import TierBadge from '@/components/contacts/TierBadge'
import type { Contact } from '@/lib/contacts'

// ─── Constants ───────────────────────────────────────────────────────────────

const TIER_CHIPS = [
  { label: 'All', value: 'all' },
  { label: 'Inner Circle', value: 'Inner Circle' },
  { label: 'Active Network', value: 'Active Network' },
  { label: 'Long Orbit', value: 'Long Orbit' },
  { label: 'None', value: 'None' },
  { label: 'Not yet reviewed', value: 'not-yet-reviewed' },
]

const BULK_TIER_OPTIONS = [
  { label: 'Inner Circle', value: 'Inner Circle' },
  { label: 'Active Network', value: 'Active Network' },
  { label: 'Long Orbit', value: 'Long Orbit' },
  { label: 'None', value: 'None' },
  { label: 'Not yet reviewed', value: 'not-yet-reviewed' },
]

// ─── Filter Panel (must be defined outside ContactsClient to avoid remount on every render) ───

interface FilterPanelProps {
  allCompanies: string[]
  allCountries: string[]
  companyQuery: string
  setCompanyQuery: (v: string) => void
  selectedCompanies: string[]
  addCompany: (c: string) => void
  removeCompany: (c: string) => void
  country: string
  setCountry: (v: string) => void
  keywordInput: string
  setKeywordInput: (v: string) => void
  selectedKeywords: string[]
  addKeyword: (k: string) => void
  removeKeyword: (k: string) => void
  activeFilterCount: number
  clearAllFilters: () => void
  companyInputRef: React.RefObject<HTMLInputElement | null>
}

function FilterPanel({
  allCompanies, allCountries, companyQuery, setCompanyQuery,
  selectedCompanies, addCompany, removeCompany,
  country, setCountry,
  keywordInput, setKeywordInput, selectedKeywords, addKeyword, removeKeyword,
  activeFilterCount, clearAllFilters, companyInputRef,
}: FilterPanelProps) {
  const filteredCompanies = allCompanies.filter(c =>
    c.toLowerCase().includes(companyQuery.toLowerCase()) &&
    !selectedCompanies.includes(c)
  )

  return (
    <div className="flex flex-col gap-5">
      {/* Company typeahead */}
      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Company
        </label>
        <input
          ref={companyInputRef}
          type="text"
          value={companyQuery}
          onChange={e => setCompanyQuery(e.target.value)}
          placeholder="Search companies…"
          className="w-full px-3 py-2 rounded-lg text-sm outline-none text-white placeholder:text-white/30"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        />
        {companyQuery.length > 0 && filteredCompanies.length > 0 && (
          <div
            className="mt-1 rounded-lg overflow-hidden"
            style={{
              background: '#0f2236',
              border: '1px solid rgba(255,255,255,0.08)',
              maxHeight: 160,
              overflowY: 'auto',
            }}
          >
            {filteredCompanies.slice(0, 8).map(c => (
              <button
                key={c}
                onClick={() => addCompany(c)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 transition-colors"
                style={{ color: 'rgba(255,255,255,0.7)' }}
              >
                {c}
              </button>
            ))}
          </div>
        )}
        {selectedCompanies.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {selectedCompanies.map(c => (
              <span
                key={c}
                className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                style={{
                  background: 'rgba(59,130,246,0.15)',
                  color: '#60a5fa',
                  border: '1px solid rgba(59,130,246,0.25)',
                }}
              >
                {c}
                <button
                  onClick={() => removeCompany(c)}
                  className="opacity-60 hover:opacity-100 ml-0.5"
                  aria-label={`Remove ${c}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Country dropdown */}
      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Country
        </label>
        <select
          value={country}
          onChange={e => setCountry(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none appearance-none"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: country ? 'white' : 'rgba(255,255,255,0.3)',
          }}
        >
          <option value="">Any country</option>
          {allCountries.map(c => (
            <option key={c} value={c} style={{ background: '#0d1b2a', color: 'white' }}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Keyword chips */}
      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Keyword
        </label>
        <input
          type="text"
          value={keywordInput}
          onChange={e => setKeywordInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault()
              const val = keywordInput.replace(/,/g, '').trim()
              if (val) addKeyword(val)
            } else if (e.key === 'Backspace' && keywordInput === '' && selectedKeywords.length > 0) {
              removeKeyword(selectedKeywords[selectedKeywords.length - 1])
            }
          }}
          placeholder={selectedKeywords.length === 0 ? 'Type and press Enter…' : 'Add another…'}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none text-white placeholder:text-white/30"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        />
        {selectedKeywords.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {selectedKeywords.map(k => (
              <span
                key={k}
                className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                style={{
                  background: 'rgba(52,211,153,0.12)',
                  color: '#34d399',
                  border: '1px solid rgba(52,211,153,0.2)',
                }}
              >
                {k}
                <button
                  onClick={() => removeKeyword(k)}
                  className="opacity-60 hover:opacity-100 ml-0.5"
                  aria-label={`Remove ${k}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {activeFilterCount > 0 && (
        <button
          onClick={clearAllFilters}
          className="text-xs text-center hover:underline mt-1"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          Clear all filters
        </button>
      )}
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ContactsClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // ── Data state
  const [contacts, setContacts] = useState<Contact[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)
  const [googleConnected, setGoogleConnected] = useState<boolean | null>(null)
  const [googleAuthUrl, setGoogleAuthUrl] = useState<string | null>(null)

  // ── Filter state
  const [search, setSearch] = useState('')
  const [selectedTiers, setSelectedTiers] = useState<Set<string>>(new Set())
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])
  const [country, setCountry] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])

  // ── Meta (companies + countries for dropdowns)
  const [allCompanies, setAllCompanies] = useState<string[]>([])
  const [allCountries, setAllCountries] = useState<string[]>([])
  const [companyQuery, setCompanyQuery] = useState('')
  const companyInputRef = useRef<HTMLInputElement>(null)

  // ── Selection state
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
  const [bulkTier, setBulkTier] = useState('Inner Circle')
  const [applyingBulk, setApplyingBulk] = useState(false)

  // ── Mobile drawer
  const [drawerOpen, setDrawerOpen] = useState(false)

  const googleError = searchParams.get('google_error')
  const justConnected = searchParams.get('google_connected')

  // ── Derived
  const activeFilterCount =
    selectedTiers.size +
    selectedCompanies.length +
    (country ? 1 : 0) +
    selectedKeywords.length

  // ─── Fetch contacts ──────────────────────────────────────────────────────

  const fetchContacts = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    for (const t of selectedTiers) params.append('tiers', t)
    for (const c of selectedCompanies) params.append('companies', c)
    if (country) params.set('country', country)
    for (const k of selectedKeywords) params.append('keywords', k)
    params.set('limit', '300')
    params.set('offset', '0')

    const res = await fetch(`/api/contacts?${params}`)
    if (res.ok) {
      const data = await res.json()
      setContacts(data.contacts)
      setTotal(data.total)
    }
    setLoading(false)
  }, [search, selectedTiers, selectedCompanies, country, selectedKeywords])

  const fetchMeta = useCallback(async () => {
    const res = await fetch('/api/contacts/meta')
    if (res.ok) {
      const data = await res.json()
      setAllCompanies(data.companies || [])
      setAllCountries(data.countries || [])
    }
  }, [])

  const checkGoogle = useCallback(async () => {
    const res = await fetch('/api/google/auth')
    if (res.ok) {
      const data = await res.json()
      setGoogleConnected(data.connected)
      if (!data.connected && data.authUrl) setGoogleAuthUrl(data.authUrl)
    }
  }, [])

  useEffect(() => { checkGoogle() }, [checkGoogle])
  useEffect(() => { fetchMeta() }, [fetchMeta])
  useEffect(() => { fetchContacts() }, [fetchContacts])

  useEffect(() => {
    if (justConnected) {
      setSyncResult('Google connected! Running initial sync…')
      handleSync()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [justConnected])

  // ─── Actions ─────────────────────────────────────────────────────────────

  async function handleSync() {
    setSyncing(true)
    setSyncResult(null)
    const res = await fetch('/api/google/sync', { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      setSyncResult(`Synced ${data.synced} contacts.`)
      fetchContacts()
      fetchMeta()
      setGoogleConnected(true)
    } else {
      const data = await res.json()
      setSyncResult(`Sync failed: ${data.error}`)
    }
    setSyncing(false)
  }

  async function handleBulkApply() {
    if (selectedContacts.size === 0) return
    setApplyingBulk(true)
    const tier = bulkTier === 'not-yet-reviewed' ? null : bulkTier
    const res = await fetch('/api/contacts/bulk-tier', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactIds: Array.from(selectedContacts), tier }),
    })
    if (res.ok) {
      setSelectedContacts(new Set())
      fetchContacts()
    }
    setApplyingBulk(false)
  }

  // ─── Tier chip logic ──────────────────────────────────────────────────────

  function toggleTier(value: string) {
    if (value === 'all') {
      setSelectedTiers(new Set())
      return
    }
    const next = new Set(selectedTiers)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    setSelectedTiers(next)
  }

  // ─── Selection logic ──────────────────────────────────────────────────────

  function toggleContact(id: string) {
    const next = new Set(selectedContacts)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedContacts(next)
  }

  function selectAll() {
    if (selectedContacts.size === contacts.length && contacts.length > 0) {
      setSelectedContacts(new Set())
    } else {
      setSelectedContacts(new Set(contacts.map(c => c.id)))
    }
  }

  // ─── Company typeahead ────────────────────────────────────────────────────

  function addCompany(company: string) {
    if (!selectedCompanies.includes(company)) {
      setSelectedCompanies(prev => [...prev, company])
    }
    setCompanyQuery('')
  }

  function removeCompany(company: string) {
    setSelectedCompanies(prev => prev.filter(c => c !== company))
  }

  function clearAllFilters() {
    setSelectedTiers(new Set())
    setSelectedCompanies([])
    setCountry('')
    setSelectedKeywords([])
    setKeywordInput('')
    setCompanyQuery('')
  }

  function addKeyword(k: string) {
    if (!selectedKeywords.includes(k)) {
      setSelectedKeywords(prev => [...prev, k])
    }
    setKeywordInput('')
  }

  function removeKeyword(k: string) {
    setSelectedKeywords(prev => prev.filter(x => x !== k))
  }

  // ─── Filter panel props (passed to top-level FilterPanel component) ─────────
  const filterPanelProps: FilterPanelProps = {
    allCompanies, allCountries, companyQuery, setCompanyQuery,
    selectedCompanies, addCompany, removeCompany,
    country, setCountry,
    keywordInput, setKeywordInput, selectedKeywords, addKeyword, removeKeyword,
    activeFilterCount, clearAllFilters, companyInputRef,
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="relative">
      {/* ── Header row ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Contacts</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {total} {total === 1 ? 'person' : 'people'} in your universe
          </p>
        </div>
        <div className="flex items-center gap-2">
          {googleConnected === false && googleAuthUrl && (
            <a
              href={googleAuthUrl}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
              style={{ background: '#60a5fa', color: '#0d1b2a' }}
            >
              <span>🔗</span>
              Connect Google Contacts
            </a>
          )}
          {googleConnected && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: 'rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.6)',
                border: '1px solid rgba(255,255,255,0.08)',
                opacity: syncing ? 0.6 : 1,
              }}
            >
              <span>{syncing ? '⟳' : '↻'}</span>
              {syncing ? 'Syncing…' : 'Sync'}
            </button>
          )}
        </div>
      </div>

      {/* ── Notifications ── */}
      {googleError && (
        <div
          className="mb-4 px-4 py-3 rounded-xl text-sm"
          style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          Google error: {decodeURIComponent(googleError)}
        </div>
      )}
      {syncResult && (
        <div
          className="mb-4 px-4 py-3 rounded-xl text-sm"
          style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}
        >
          {syncResult}
        </div>
      )}

      {/* ── Top search bar (full width) + mobile Filters button ── */}
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, company, email…"
          className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none text-white placeholder:text-white/30"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            minHeight: 44,
          }}
        />
        {/* Mobile-only: Filters button */}
        <button
          className="md:hidden flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium relative shrink-0"
          style={{
            background: activeFilterCount > 0 ? 'rgba(96,165,250,0.12)' : 'rgba(255,255,255,0.04)',
            color: activeFilterCount > 0 ? '#60a5fa' : 'rgba(255,255,255,0.5)',
            border: `1px solid ${activeFilterCount > 0 ? 'rgba(96,165,250,0.25)' : 'rgba(255,255,255,0.08)'}`,
            minHeight: 44,
          }}
          onClick={() => setDrawerOpen(true)}
        >
          <span>⚙</span>
          Filters
          {activeFilterCount > 0 && (
            <span
              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
              style={{ background: '#60a5fa', color: '#0d1b2a' }}
            >
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Two-column layout: sidebar + list ── */}
      <div className="flex gap-5">

        {/* ── Desktop sidebar ── */}
        <aside
          className="hidden md:block shrink-0 self-start sticky top-4"
          style={{
            width: 240,
            background: '#0f2236',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16,
            padding: '20px 16px',
          }}
        >
          <FilterPanel {...filterPanelProps} />
        </aside>

        {/* ── Right column: tier chips + list ── */}
        <div className="flex-1 min-w-0">

          {/* Tier chips */}
          <div className="flex items-center gap-1.5 flex-wrap mb-4">
            {TIER_CHIPS.map(chip => {
              const isAll = chip.value === 'all'
              const active = isAll ? selectedTiers.size === 0 : selectedTiers.has(chip.value)
              return (
                <button
                  key={chip.value}
                  onClick={() => toggleTier(chip.value)}
                  className="px-3 rounded-full text-xs font-medium transition-all shrink-0"
                  style={{
                    background: active ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
                    color: active ? 'white' : 'rgba(255,255,255,0.4)',
                    border: active ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.06)',
                    minHeight: 34,
                  }}
                >
                  {chip.label}
                </button>
              )
            })}
          </div>

          {/* Contact list */}
          {loading ? (
            <div className="flex items-center justify-center py-16" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Loading…
            </div>
          ) : contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <span className="text-4xl">👤</span>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {total === 0 && !search
                  ? 'No contacts yet. Connect Google Contacts to import.'
                  : 'No contacts match your filter.'}
              </p>
            </div>
          ) : (
            <div
              style={{
                background: '#0f2236',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16,
                overflow: 'hidden',
              }}
            >
              {/* Select-all header row */}
              <div
                className="flex items-center gap-3 px-5 py-3"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
              >
                <input
                  type="checkbox"
                  checked={contacts.length > 0 && selectedContacts.size === contacts.length}
                  onChange={selectAll}
                  className="w-4 h-4 rounded accent-blue-400 cursor-pointer"
                  aria-label="Select all"
                />
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {selectedContacts.size > 0
                    ? `${selectedContacts.size} of ${contacts.length} selected`
                    : `${contacts.length} contact${contacts.length !== 1 ? 's' : ''}`}
                </span>
              </div>

              {contacts.map((contact, i) => {
                const isSelected = selectedContacts.has(contact.id)
                const isSelecting = selectedContacts.size > 0

                return (
                  <div
                    key={contact.id}
                    className="group flex items-center gap-3 px-5 py-4 transition-all cursor-pointer"
                    style={{
                      borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      background: isSelected ? 'rgba(96,165,250,0.06)' : 'transparent',
                    }}
                    onClick={() => {
                      if (isSelecting) {
                        toggleContact(contact.id)
                      } else {
                        router.push(`/contacts/${contact.id}`)
                      }
                    }}
                  >
                    {/* Checkbox — visible on hover or when any selected */}
                    <div
                      className="shrink-0 transition-opacity"
                      style={{ opacity: isSelected || isSelecting ? 1 : 0 }}
                      onClick={e => { e.stopPropagation(); toggleContact(contact.id) }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleContact(contact.id)}
                        className="w-4 h-4 rounded accent-blue-400 cursor-pointer"
                        onClick={e => e.stopPropagation()}
                      />
                    </div>

                    {/* When nothing selected, show checkbox area on hover via CSS group */}
                    {!isSelecting && (
                      <div
                        className="group-hover:opacity-100 opacity-0 shrink-0 absolute transition-opacity"
                        style={{ marginLeft: -4 }}
                        onClick={e => { e.stopPropagation(); toggleContact(contact.id) }}
                      >
                        <input
                          type="checkbox"
                          checked={false}
                          onChange={() => toggleContact(contact.id)}
                          className="w-4 h-4 rounded accent-blue-400 cursor-pointer"
                          onClick={e => e.stopPropagation()}
                        />
                      </div>
                    )}

                    <Avatar
                      name={contact.display_name}
                      photoUrl={contact.photo_override || contact.photo_url}
                      tier={contact.importance_tier ?? undefined}
                      size={38}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate text-white">
                          {contact.display_name}
                        </span>
                        {contact.importance_tier && (
                          <TierBadge tier={contact.importance_tier} />
                        )}
                        {!contact.importance_tier && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              background: 'rgba(255,255,255,0.04)',
                              color: 'rgba(255,255,255,0.25)',
                              border: '1px solid rgba(255,255,255,0.06)',
                              fontSize: 10,
                            }}
                          >
                            not reviewed
                          </span>
                        )}
                      </div>
                      <div className="text-xs mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {[contact.job_title, contact.company].filter(Boolean).join(' · ') ||
                          contact.emails[0]?.value || ''}
                      </div>
                    </div>
                    {contact.tags.length > 0 && (
                      <div className="hidden md:flex items-center gap-1">
                        {contact.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {!isSelecting && (
                      <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 18 }}>›</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile drawer ── */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 md:hidden"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={() => setDrawerOpen(false)}
          />
          {/* Drawer */}
          <div
            className="fixed inset-y-0 left-0 z-50 md:hidden overflow-y-auto"
            style={{
              width: 280,
              background: '#0d1b2a',
              borderRight: '1px solid rgba(255,255,255,0.08)',
              padding: '24px 16px',
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <span className="font-semibold text-sm text-white">Filters</span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="text-white/40 hover:text-white/70 text-lg leading-none"
              >
                ✕
              </button>
            </div>
            <FilterPanel {...filterPanelProps} />
          </div>
        </>
      )}

      {/* ── Floating bulk action bar ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 flex justify-center pointer-events-none"
        style={{
          paddingBottom: 24,
          transition: 'transform 0.25s ease, opacity 0.25s ease',
          transform: selectedContacts.size > 0 ? 'translateY(0)' : 'translateY(120%)',
          opacity: selectedContacts.size > 0 ? 1 : 0,
        }}
      >
        <div
          className="flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl pointer-events-auto"
          style={{
            background: '#1a2f46',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}
        >
          <span className="text-sm font-medium text-white">
            {selectedContacts.size} selected
          </span>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
          <select
            value={bulkTier}
            onChange={e => setBulkTier(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm outline-none"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'white',
            }}
          >
            {BULK_TIER_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value} style={{ background: '#0d1b2a' }}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            onClick={handleBulkApply}
            disabled={applyingBulk}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{
              background: '#3b82f6',
              color: 'white',
              opacity: applyingBulk ? 0.7 : 1,
            }}
          >
            {applyingBulk ? 'Applying…' : 'Apply'}
          </button>
          <button
            onClick={() => setSelectedContacts(new Set())}
            className="text-xs hover:underline"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  )
}
