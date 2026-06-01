'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Avatar from '@/components/contacts/Avatar'
import type { InterlockContact } from '@/lib/interlocks'

interface InterlockData {
  overdue: InterlockContact[]
  dueSoon: InterlockContact[]
  active: InterlockContact[]
  noCadence: InterlockContact[]
}

const TIER_CADENCE: Record<string, number> = {
  'Inner Circle': 30,
  'Active Network': 90,
  'Long Orbit': 365,
}

export default function InterlocksClient() {
  const [data, setData] = useState<InterlockData | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [editingCadenceId, setEditingCadenceId] = useState<string | null>(null)
  const [cadenceInput, setCadenceInput] = useState('')
  const [showActive, setShowActive] = useState(false)
  const [showNoCadence, setShowNoCadence] = useState(false)
  const [sendingDigest, setSendingDigest] = useState(false)
  const [digestSent, setDigestSent] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch('/api/interlocks')
    if (res.ok) setData(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleReachedOut(contactId: string, cadenceDays?: number) {
    setConfirmingId(contactId)
    const body: Record<string, number | null> = {}
    if (cadenceDays !== undefined) body.cadence_days = cadenceDays
    await fetch(`/api/contacts/${contactId}/interlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setConfirmingId(null)
    setEditingCadenceId(null)
    load()
  }

  async function handleSaveAndConfirm(contactId: string) {
    const days = parseInt(cadenceInput)
    if (!isNaN(days) && days > 0) {
      await handleReachedOut(contactId, days)
    } else {
      await handleReachedOut(contactId)
    }
  }

  async function handleSendDigest() {
    setSendingDigest(true)
    const res = await fetch('/api/interlocks?mode=digest')
    if (res.ok) {
      const { text } = await res.json()
      await fetch('/api/discord/digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      setDigestSent(true)
      setTimeout(() => setDigestSent(false), 3000)
    }
    setSendingDigest(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16" style={{ color: 'rgba(255,255,255,0.3)' }}>
        Loading…
      </div>
    )
  }
  if (!data) return null

  const totalWithCadence = data.overdue.length + data.dueSoon.length + data.active.length
  const totalOverdue = data.overdue.length + data.dueSoon.length

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Interlocks</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {totalWithCadence} tracked · {totalOverdue > 0 ? `${totalOverdue} need attention` : 'all up to date'}
          </p>
        </div>
        <button
          onClick={handleSendDigest}
          disabled={sendingDigest}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{
            background: digestSent ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.06)',
            color: digestSent ? '#34d399' : 'rgba(255,255,255,0.55)',
            border: digestSent ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(255,255,255,0.08)',
            opacity: sendingDigest ? 0.6 : 1,
          }}
        >
          {digestSent ? '✓ Sent to Discord' : sendingDigest ? 'Sending…' : '📣 Send digest'}
        </button>
      </div>

      {/* Summary bar */}
      {totalWithCadence > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <SummaryCard count={data.overdue.length}  label="Overdue"     color="#f59e0b" bg="rgba(245,158,11,0.1)" />
          <SummaryCard count={data.dueSoon.length}  label="Due soon"    color="#fbbf24" bg="rgba(251,191,36,0.08)" />
          <SummaryCard count={data.active.length}   label="Up to date"  color="#34d399" bg="rgba(52,211,153,0.08)" />
        </div>
      )}

      {data.overdue.length > 0 && (
        <Section title={`Overdue — ${data.overdue.length}`} accent="#f59e0b" defaultOpen>
          {data.overdue.map(item => (
            <InterlockRow
              key={item.contact.id} item={item}
              isConfirming={confirmingId === item.contact.id}
              isEditingCadence={editingCadenceId === item.contact.id}
              cadenceInput={cadenceInput}
              onReachedOut={() => handleReachedOut(item.contact.id)}
              onEditCadence={() => { setEditingCadenceId(item.contact.id); setCadenceInput(String(item.effectiveCadenceDays || '')) }}
              onCadenceChange={setCadenceInput}
              onSaveAndConfirm={() => handleSaveAndConfirm(item.contact.id)}
              onCancelEdit={() => setEditingCadenceId(null)}
            />
          ))}
        </Section>
      )}

      {data.dueSoon.length > 0 && (
        <Section title={`Due soon — ${data.dueSoon.length}`} accent="#fbbf24" defaultOpen>
          {data.dueSoon.map(item => (
            <InterlockRow
              key={item.contact.id} item={item}
              isConfirming={confirmingId === item.contact.id}
              isEditingCadence={editingCadenceId === item.contact.id}
              cadenceInput={cadenceInput}
              onReachedOut={() => handleReachedOut(item.contact.id)}
              onEditCadence={() => { setEditingCadenceId(item.contact.id); setCadenceInput(String(item.effectiveCadenceDays || '')) }}
              onCadenceChange={setCadenceInput}
              onSaveAndConfirm={() => handleSaveAndConfirm(item.contact.id)}
              onCancelEdit={() => setEditingCadenceId(null)}
            />
          ))}
        </Section>
      )}

      {data.active.length > 0 && (
        <Section
          title={`Up to date — ${data.active.length}`}
          accent="#34d399"
          defaultOpen={false}
          collapsed={!showActive}
          onToggle={() => setShowActive(!showActive)}
        >
          {data.active.map(item => (
            <InterlockRow
              key={item.contact.id} item={item}
              isConfirming={confirmingId === item.contact.id}
              isEditingCadence={editingCadenceId === item.contact.id}
              cadenceInput={cadenceInput}
              onReachedOut={() => handleReachedOut(item.contact.id)}
              onEditCadence={() => { setEditingCadenceId(item.contact.id); setCadenceInput(String(item.effectiveCadenceDays || '')) }}
              onCadenceChange={setCadenceInput}
              onSaveAndConfirm={() => handleSaveAndConfirm(item.contact.id)}
              onCancelEdit={() => setEditingCadenceId(null)}
            />
          ))}
        </Section>
      )}

      {data.noCadence.length > 0 && (
        <Section
          title={`No cadence set — ${data.noCadence.length}`}
          accent="rgba(255,255,255,0.25)"
          defaultOpen={false}
          collapsed={!showNoCadence}
          onToggle={() => setShowNoCadence(!showNoCadence)}
        >
          {data.noCadence.map(item => (
            <InterlockRow
              key={item.contact.id} item={item}
              isConfirming={confirmingId === item.contact.id}
              isEditingCadence={editingCadenceId === item.contact.id}
              cadenceInput={cadenceInput}
              onReachedOut={() => handleReachedOut(item.contact.id)}
              onEditCadence={() => { setEditingCadenceId(item.contact.id); setCadenceInput('') }}
              onCadenceChange={setCadenceInput}
              onSaveAndConfirm={() => handleSaveAndConfirm(item.contact.id)}
              onCancelEdit={() => setEditingCadenceId(null)}
            />
          ))}
        </Section>
      )}

      {totalWithCadence === 0 && data.noCadence.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <span className="text-5xl">🔁</span>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            No contacts with importance tiers yet.
          </p>
          <Link
            href="/contacts"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: '#f59e0b', color: '#0d1b2a' }}
          >
            Set tiers on contacts →
          </Link>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SummaryCard({ count, label, color, bg }: {
  count: number; label: string; color: string; bg: string
}) {
  return (
    <div style={{
      background: bg,
      border: `1px solid ${color}30`,
      borderRadius: 14,
      padding: '14px 16px',
    }}>
      <div style={{ fontSize: 24, fontWeight: 700, color }}>{count}</div>
      <div style={{ fontSize: 12, color, marginTop: 2 }}>{label}</div>
    </div>
  )
}

function Section({ title, accent, children, defaultOpen, collapsed, onToggle }: {
  title: string
  accent: string
  children: React.ReactNode
  defaultOpen?: boolean
  collapsed?: boolean
  onToggle?: () => void
}) {
  const isCollapsed = collapsed !== undefined ? collapsed : false

  return (
    <div className="mb-4">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 w-full text-left mb-2 py-1"
        style={{ cursor: onToggle ? 'pointer' : 'default' }}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: accent, display: 'inline-block' }} />
        <span className="text-sm font-semibold text-white">{title}</span>
        {onToggle && (
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>
            {isCollapsed ? '▶' : '▼'}
          </span>
        )}
      </button>
      {!isCollapsed && (
        <div style={{
          background: '#0f2236',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 14,
          overflow: 'hidden',
        }}>
          {children}
        </div>
      )}
    </div>
  )
}

function InterlockRow({
  item,
  isConfirming,
  isEditingCadence,
  cadenceInput,
  onReachedOut,
  onEditCadence,
  onCadenceChange,
  onSaveAndConfirm,
  onCancelEdit,
}: {
  item: InterlockContact
  isConfirming: boolean
  isEditingCadence: boolean
  cadenceInput: string
  onReachedOut: () => void
  onEditCadence: () => void
  onCadenceChange: (v: string) => void
  onSaveAndConfirm: () => void
  onCancelEdit: () => void
}) {
  const { contact, status, daysOverdue, effectiveCadenceDays, daysSinceContact } = item

  const statusColor = status === 'overdue'   ? '#f59e0b'
    : status === 'due-soon' ? '#fbbf24'
    : status === 'active'   ? '#34d399'
    : 'rgba(255,255,255,0.25)'

  const urgencyText = status === 'overdue'
    ? `${daysOverdue}d overdue`
    : status === 'due-soon'
    ? `due in ${Math.abs(daysOverdue || 0)}d`
    : status === 'active'
    ? `${Math.abs(daysOverdue || 0)}d remaining`
    : 'no cadence'

  const lastContactText = daysSinceContact !== null
    ? daysSinceContact === 0 ? 'today' : daysSinceContact === 1 ? 'yesterday' : `${daysSinceContact}d ago`
    : 'never'

  return (
    <div
      className="px-5 py-4 first:border-none"
      style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
    >
      <div className="flex items-center gap-4">
        <Avatar
          name={contact.display_name}
          photoUrl={contact.photo_override || contact.photo_url}
          tier={contact.importance_tier ?? undefined}
          size={36}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/contacts/${contact.id}`}
              className="font-medium text-sm text-white hover:underline"
            >
              {contact.display_name}
            </Link>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {contact.importance_tier ?? 'Not yet reviewed'}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <span style={{ color: statusColor, fontWeight: 500 }}>{urgencyText}</span>
            <span>·</span>
            <span>last contact: {lastContactText}</span>
            {effectiveCadenceDays && (
              <>
                <span>·</span>
                <button onClick={onEditCadence} className="hover:underline" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  every {effectiveCadenceDays}d
                </button>
              </>
            )}
          </div>

          {isEditingCadence && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Reach out every</span>
              <input
                type="number"
                value={cadenceInput}
                onChange={e => onCadenceChange(e.target.value)}
                className="w-16 px-2 py-1 rounded-lg text-xs outline-none text-white"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
                placeholder={String(TIER_CADENCE[contact.importance_tier ?? ''] || '')}
                autoFocus
              />
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>days</span>
              <button
                onClick={onSaveAndConfirm}
                className="px-3 py-1 rounded-lg text-xs font-medium"
                style={{ background: '#f59e0b', color: '#0d1b2a' }}
              >
                Save & confirm ✓
              </button>
              <button onClick={onCancelEdit} className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Cancel
              </button>
            </div>
          )}
        </div>

        {!isEditingCadence && (
          <button
            onClick={onReachedOut}
            disabled={isConfirming}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium shrink-0 transition-all"
            style={{  minHeight: 44,
              background: isConfirming
                ? 'rgba(52,211,153,0.15)'
                : status === 'overdue'
                ? 'rgba(245,158,11,0.15)'
                : 'rgba(255,255,255,0.06)',
              color: isConfirming
                ? '#34d399'
                : status === 'overdue'
                ? '#f59e0b'
                : 'rgba(255,255,255,0.5)',
              border: `1px solid ${isConfirming ? 'rgba(52,211,153,0.3)' : status === 'overdue' ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.08)'}`,
              opacity: isConfirming ? 0.8 : 1,
            }}
          >
            {isConfirming ? '✓' : '✓ Reached out'}
          </button>
        )}
      </div>
    </div>
  )
}
