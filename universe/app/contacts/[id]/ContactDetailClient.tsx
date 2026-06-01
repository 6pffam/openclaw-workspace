'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Avatar from '@/components/contacts/Avatar'
import TierBadge from '@/components/contacts/TierBadge'
import { formatDate, daysAgo } from '@/lib/utils'
import type { Contact, ImportanceTier } from '@/lib/contacts'

const TIERS: Array<ImportanceTier | null> = ['Inner Circle', 'Active Network', 'Long Orbit', 'None', null]
const REVIEW_STATUSES = ['unreviewed', 'reviewed', 'needs_attention']

const inputStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: 'white',
}

interface Props {
  contactId: string
}

export default function ContactDetailClient({ contactId }: Props) {
  const router = useRouter()
  const [contact, setContact] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [notes, setNotes] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [origin, setOrigin] = useState('')
  const [tier, setTier] = useState<ImportanceTier | null>(null)
  const [reviewStatus, setReviewStatus] = useState('unreviewed')
  const [logEntry, setLogEntry] = useState('')

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/contacts/${contactId}`)
      if (!res.ok) { router.push('/contacts'); return }
      const data: Contact = await res.json()
      setContact(data)
      setNotes(data.notes || '')
      setTagsInput((data.tags || []).join(', '))
      setOrigin(data.origin || '')
      setTier(data.importance_tier ?? null)
      setReviewStatus(data.review_status)
      setLoading(false)
    }
    load()
  }, [contactId, router])

  async function handleSave() {
    if (!contact) return
    setSaving(true)
    const body = {
      notes,
      tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
      origin,
      importance_tier: tier,
      review_status: reviewStatus,
      ...(logEntry ? { log_entry: logEntry } : {}),
    }
    const res = await fetch(`/api/contacts/${contactId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const updated: Contact = await res.json()
      setContact(updated)
      setLogEntry('')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16" style={{ color: 'rgba(255,255,255,0.3)' }}>
        Loading…
      </div>
    )
  }
  if (!contact) return null

  return (
    <div>
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm mb-6"
        style={{ color: 'rgba(255,255,255,0.4)' }}
      >
        ← Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Left: identity + Google data */}
        <div className="lg:col-span-1 space-y-4">
          <div
            className="rounded-2xl p-6"
            style={{ background: '#0f2236', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex flex-col items-center text-center gap-3 mb-4">
              <Avatar
                name={contact.display_name}
                photoUrl={contact.photo_override || contact.photo_url}
                tier={contact.importance_tier ?? undefined}
                size={64}
              />
              <div>
                <h2 className="font-semibold text-lg text-white">
                  {contact.display_name}
                </h2>
                {(contact.job_title || contact.company) && (
                  <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {[contact.job_title, contact.company].filter(Boolean).join(' · ')}
                  </p>
                )}
                <div className="mt-2">
                  <TierBadge tier={contact.importance_tier ?? ''} />
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              {contact.emails.map((e, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>✉</span>
                  <a href={`mailto:${e.value}`} style={{ color: '#60a5fa' }}>{e.value}</a>
                </div>
              ))}
              {contact.phones.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>📞</span>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>{p.value}</span>
                </div>
              ))}
              {contact.birthday && (
                <div className="flex items-center gap-2">
                  <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>🎂</span>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>{contact.birthday}</span>
                </div>
              )}
              {contact.addresses.map((a, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, marginTop: 2 }}>📍</span>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>{a.formattedValue}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sync note */}
          <div
            className="rounded-xl px-4 py-3 text-xs"
            style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.25)' }}
          >
            From Google · Last synced {daysAgo(contact.synced_at)}
          </div>
        </div>

        {/* Right: private fields */}
        <div className="lg:col-span-2 space-y-4">
          <div
            className="rounded-2xl p-6"
            style={{ background: '#0f2236', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <h3 className="font-semibold text-sm mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Private — stays on your machine
            </h3>

            <div className="space-y-4">
              {/* Tier */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Importance Tier
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {TIERS.map(t => (
                    <button
                      key={t ?? 'null'}
                      onClick={() => setTier(t)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                      style={{
                        background: tier === t ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
                        color: tier === t ? 'white' : 'rgba(255,255,255,0.4)',
                        border: tier === t ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      {t ?? 'Not yet reviewed'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Origin */}
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  How we met
                </label>
                <input
                  type="text"
                  value={origin}
                  onChange={e => setOrigin(e.target.value)}
                  placeholder="e.g. INSEAD MBA, met at a conference in 2022…"
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none placeholder:text-white/25"
                  style={inputStyle}
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={e => setTagsInput(e.target.value)}
                  placeholder="e.g. investor, mentor, Zurich"
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none placeholder:text-white/25"
                  style={inputStyle}
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Notes (Markdown)
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Anything you want to remember about this person…"
                  rows={5}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none font-mono placeholder:text-white/25"
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              {/* Review status */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Review status
                </label>
                <div className="flex items-center gap-2">
                  {REVIEW_STATUSES.map(s => {
                    const active = reviewStatus === s
                    const activeBg =
                      s === 'needs_attention' ? 'rgba(245,158,11,0.2)' :
                      s === 'reviewed'        ? 'rgba(52,211,153,0.2)' :
                      'rgba(96,165,250,0.2)'
                    const activeColor =
                      s === 'needs_attention' ? '#f59e0b' :
                      s === 'reviewed'        ? '#34d399' : '#60a5fa'
                    return (
                      <button
                        key={s}
                        onClick={() => setReviewStatus(s)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                        style={{
                          background: active ? activeBg : 'rgba(255,255,255,0.04)',
                          color: active ? activeColor : 'rgba(255,255,255,0.4)',
                          border: active ? `1px solid ${activeColor}30` : '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        {s === 'needs_attention' ? 'Needs attention' :
                         s === 'reviewed' ? 'Reviewed' : 'Unreviewed'}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Log entry */}
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Add update note (logged with today&apos;s date)
                </label>
                <input
                  type="text"
                  value={logEntry}
                  onChange={e => setLogEntry(e.target.value)}
                  placeholder="e.g. Caught up over coffee, discussed new role…"
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none placeholder:text-white/25"
                  style={inputStyle}
                />
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: saved ? 'rgba(52,211,153,0.2)' : '#f59e0b',
                  color: saved ? '#34d399' : '#0d1b2a',
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>

          {/* Update log */}
          {contact.update_log.length > 0 && (
            <div
              className="rounded-2xl p-6"
              style={{ background: '#0f2236', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <h3 className="font-semibold text-sm mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Update Log
              </h3>
              <div className="space-y-2">
                {[...contact.update_log].reverse().map((entry, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <span className="text-xs mt-0.5 shrink-0" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      {formatDate(entry.date)}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.55)' }}>{entry.note}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
