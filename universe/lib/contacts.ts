import { getDb } from './db'
import { v4 as uuidv4 } from 'uuid'
import type { GoogleContact } from './google'

export type ImportanceTier = 'Inner Circle' | 'Active Network' | 'Long Orbit' | 'None'

export const ALL_TIERS: string[] = ['Inner Circle', 'Active Network', 'Long Orbit', 'None', 'not-yet-reviewed']

export interface Contact {
  id: string
  google_resource_name: string | null
  display_name: string
  given_name: string
  family_name: string
  photo_url: string | null
  photo_override: string | null
  emails: Array<{ value: string; type: string }>
  phones: Array<{ value: string; type: string }>
  company: string | null
  job_title: string | null
  addresses: Array<{ formattedValue: string; type: string }>
  birthday: string | null
  // Universe-private
  notes: string
  tags: string[]
  origin: string
  importance_tier: ImportanceTier | null
  last_contact_date: string | null
  review_status: 'unreviewed' | 'reviewed' | 'needs_attention'
  update_log: Array<{ date: string; note: string }>
  interlock_cadence_days: number | null
  last_interlock_date: string | null
  synced_at: string | null
  created_at: string
  updated_at: string
}

export interface ContactRow {
  id: string
  google_resource_name: string | null
  google_etag: string | null
  display_name: string
  given_name: string
  family_name: string
  photo_url: string | null
  photo_override: string | null
  emails: string
  phones: string
  company: string | null
  job_title: string | null
  addresses: string
  birthday: string | null
  notes: string
  tags: string
  origin: string
  importance_tier: string | null
  last_contact_date: string | null
  review_status: string
  update_log: string
  interlock_cadence_days: number | null
  last_interlock_date: string | null
  synced_at: string | null
  created_at: string
  updated_at: string
}

function rowToContact(row: ContactRow): Contact {
  return {
    ...row,
    emails: JSON.parse(row.emails || '[]'),
    phones: JSON.parse(row.phones || '[]'),
    addresses: JSON.parse(row.addresses || '[]'),
    tags: JSON.parse(row.tags || '[]'),
    update_log: JSON.parse(row.update_log || '[]'),
    importance_tier: row.importance_tier as ImportanceTier | null,
    review_status: row.review_status as Contact['review_status'],
  }
}

function parseCountryFromAddresses(addressesJson: string): string[] {
  try {
    const addrs: Array<{ formattedValue?: string }> = JSON.parse(addressesJson || '[]')
    return addrs
      .map(a => {
        if (!a.formattedValue) return ''
        const parts = a.formattedValue.split(',').map(s => s.trim())
        return parts[parts.length - 1] || ''
      })
      .filter(Boolean)
  } catch { return [] }
}

export function getAllContacts(opts?: {
  search?: string
  tiers?: string[]
  companies?: string[]
  country?: string
  keyword?: string
  keywords?: string[]
  reviewStatus?: string
  limit?: number
  offset?: number
}): { contacts: Contact[]; total: number } {
  const db = getDb()
  const { search = '', tiers = [], companies = [], country = '', keyword = '', keywords = [], reviewStatus = 'all', limit = 200, offset = 0 } = opts || {}

  let where = 'WHERE 1=1'
  const params: (string | number | null)[] = []

  if (search) {
    where += ' AND (display_name LIKE ? OR company LIKE ? OR emails LIKE ?)'
    const q = `%${search}%`
    params.push(q, q, q)
  }

  // Tier filter: multi-select with OR logic
  const effectiveTiers = tiers.filter(t => t !== 'all')
  if (effectiveTiers.length > 0) {
    const tierClauses: string[] = []
    for (const t of effectiveTiers) {
      if (t === 'not-yet-reviewed') {
        tierClauses.push('importance_tier IS NULL')
      } else {
        tierClauses.push('importance_tier = ?')
        params.push(t)
      }
    }
    where += ` AND (${tierClauses.join(' OR ')})`
  }

  // Company filter
  if (companies.length > 0) {
    where += ` AND company IN (${companies.map(() => '?').join(',')})`
    params.push(...companies)
  }

  // Keyword filter — single legacy keyword or multi-keyword array (AND logic: all must match)
  const allKeywords = [...keywords, ...(keyword ? [keyword] : [])]
  for (const kw of allKeywords) {
    where += ' AND (display_name LIKE ? OR company LIKE ? OR emails LIKE ? OR phones LIKE ? OR notes LIKE ? OR tags LIKE ? OR job_title LIKE ? OR addresses LIKE ?)'
    const kq = `%${kw}%`
    params.push(kq, kq, kq, kq, kq, kq, kq, kq)
  }

  if (reviewStatus && reviewStatus !== 'all') {
    where += ' AND review_status = ?'
    params.push(reviewStatus)
  }

  let rows = db.prepare(
    `SELECT * FROM contacts ${where} ORDER BY display_name LIMIT ? OFFSET ?`
  ).all(...params, limit, offset) as ContactRow[]

  // Country filter (post-process — parsed from address JSON)
  if (country) {
    const cLower = country.toLowerCase()
    rows = rows.filter(row => {
      const countries = parseCountryFromAddresses(row.addresses)
      return countries.some(c => c.toLowerCase().includes(cLower))
    })
  }

  // Total count
  let total: number
  if (country) {
    const allRows = db.prepare(
      `SELECT addresses FROM contacts ${where}`
    ).all(...params) as { addresses: string }[]
    const cLower = country.toLowerCase()
    total = allRows.filter(r => {
      const countries = parseCountryFromAddresses(r.addresses)
      return countries.some(c => c.toLowerCase().includes(cLower))
    }).length
  } else {
    total = (db.prepare(`SELECT COUNT(*) as n FROM contacts ${where}`).get(...params) as { n: number }).n
  }

  return { contacts: rows.map(rowToContact), total }
}

export function getDistinctCompanies(): string[] {
  const db = getDb()
  const rows = db.prepare(
    `SELECT DISTINCT company FROM contacts WHERE company IS NOT NULL AND company != '' ORDER BY company`
  ).all() as { company: string }[]
  return rows.map(r => r.company)
}

export function getDistinctCountries(): string[] {
  const db = getDb()
  const rows = db.prepare(
    `SELECT addresses FROM contacts WHERE addresses IS NOT NULL AND addresses != '[]'`
  ).all() as { addresses: string }[]
  const countries = new Set<string>()
  for (const row of rows) {
    for (const c of parseCountryFromAddresses(row.addresses)) {
      if (c) countries.add(c)
    }
  }
  return Array.from(countries).sort()
}

export function bulkSetTier(contactIds: string[], tier: string | null): number {
  const db = getDb()
  if (contactIds.length === 0) return 0
  const stmt = db.prepare(
    `UPDATE contacts SET importance_tier = ?, review_status = 'reviewed', updated_at = datetime('now') WHERE id = ?`
  )
  let updated = 0
  db.transaction(() => {
    for (const id of contactIds) {
      const result = stmt.run(tier, id)
      updated += result.changes
    }
  })()
  return updated
}

export function getContactById(id: string): Contact | null {
  const db = getDb()
  const row = db.prepare('SELECT * FROM contacts WHERE id = ?').get(id) as ContactRow | undefined
  return row ? rowToContact(row) : null
}

export function getContactPublicView(id: string): Omit<Contact, 'notes' | 'tags' | 'origin' | 'update_log'> | null {
  const contact = getContactById(id)
  if (!contact) return null
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { notes, tags, origin, update_log, ...publicFields } = contact
  return publicFields
}

export function upsertGoogleContact(gc: GoogleContact): string {
  const db = getDb()
  const existing = db.prepare(
    'SELECT id FROM contacts WHERE google_resource_name = ?'
  ).get(gc.resourceName) as { id: string } | undefined

  if (existing) {
    db.prepare(`
      UPDATE contacts SET
        google_etag = ?, display_name = ?, given_name = ?, family_name = ?,
        photo_url = ?, emails = ?, phones = ?, company = ?, job_title = ?,
        addresses = ?, birthday = ?, synced_at = datetime('now'), updated_at = datetime('now')
      WHERE google_resource_name = ?
    `).run(
      gc.etag, gc.displayName, gc.givenName, gc.familyName,
      gc.photoUrl, JSON.stringify(gc.emails), JSON.stringify(gc.phones),
      gc.company, gc.jobTitle, JSON.stringify(gc.addresses), gc.birthday,
      gc.resourceName,
    )
    return existing.id
  } else {
    const id = uuidv4()
    db.prepare(`
      INSERT INTO contacts (
        id, google_resource_name, google_etag, display_name, given_name, family_name,
        photo_url, emails, phones, company, job_title, addresses, birthday, importance_tier, synced_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, datetime('now'))
    `).run(
      id, gc.resourceName, gc.etag, gc.displayName, gc.givenName, gc.familyName,
      gc.photoUrl, JSON.stringify(gc.emails), JSON.stringify(gc.phones),
      gc.company, gc.jobTitle, JSON.stringify(gc.addresses), gc.birthday,
    )
    return id
  }
}

export function updateContactPrivate(id: string, updates: Partial<{
  notes: string
  tags: string[]
  origin: string
  importance_tier: ImportanceTier | null
  photo_override: string
  last_contact_date: string
  review_status: Contact['review_status']
  interlock_cadence_days: number
  last_interlock_date: string
}>): void {
  const db = getDb()
  const fields: string[] = []
  const values: (string | number | null)[] = []

  if (updates.notes !== undefined) { fields.push('notes = ?'); values.push(updates.notes) }
  if (updates.tags !== undefined) { fields.push('tags = ?'); values.push(JSON.stringify(updates.tags)) }
  if (updates.origin !== undefined) { fields.push('origin = ?'); values.push(updates.origin) }
  if (updates.importance_tier !== undefined) { fields.push('importance_tier = ?'); values.push(updates.importance_tier ?? null) }
  if (updates.photo_override !== undefined) { fields.push('photo_override = ?'); values.push(updates.photo_override) }
  if (updates.last_contact_date !== undefined) { fields.push('last_contact_date = ?'); values.push(updates.last_contact_date) }
  if (updates.review_status !== undefined) { fields.push('review_status = ?'); values.push(updates.review_status) }
  if (updates.interlock_cadence_days !== undefined) { fields.push('interlock_cadence_days = ?'); values.push(updates.interlock_cadence_days) }
  if (updates.last_interlock_date !== undefined) { fields.push('last_interlock_date = ?'); values.push(updates.last_interlock_date) }

  if (fields.length === 0) return

  fields.push("updated_at = datetime('now')")
  values.push(id)

  db.prepare(`UPDATE contacts SET ${fields.join(', ')} WHERE id = ?`).run(...values)
}

export function addUpdateLogEntry(id: string, note: string): void {
  const contact = getContactById(id)
  if (!contact) return
  const entry = { date: new Date().toISOString().split('T')[0], note }
  const log = [...contact.update_log, entry]
  const db = getDb()
  db.prepare("UPDATE contacts SET update_log = ?, updated_at = datetime('now') WHERE id = ?")
    .run(JSON.stringify(log), id)
}

export function getTierCadenceDays(tier: ImportanceTier | null): number | null {
  switch (tier) {
    case 'Inner Circle': return 30
    case 'Active Network': return 90
    case 'Long Orbit': return 365
    default: return null
  }
}

export function getEffectiveCadenceDays(contact: Contact): number | null {
  return contact.interlock_cadence_days || getTierCadenceDays(contact.importance_tier)
}

export function getDaysOverdue(contact: Contact): number | null {
  const cadence = getEffectiveCadenceDays(contact)
  if (!cadence) return null
  const lastDate = contact.last_interlock_date || contact.last_contact_date
  if (!lastDate) return cadence // Never contacted = fully overdue
  const last = new Date(lastDate).getTime()
  const now = Date.now()
  const daysSince = Math.floor((now - last) / (1000 * 60 * 60 * 24))
  return daysSince - cadence // positive = overdue
}
