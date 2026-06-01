import { getDb } from './db'
import { getEffectiveCadenceDays, getDaysOverdue } from './contacts'
import type { Contact } from './contacts'

export type InterlockStatus = 'overdue' | 'due-soon' | 'active' | 'no-cadence'

export interface InterlockContact {
  contact: Contact
  status: InterlockStatus
  daysOverdue: number | null      // positive = overdue, negative = days remaining, null = no cadence
  effectiveCadenceDays: number | null
  daysSinceContact: number | null
}

function getDaysSinceContact(contact: Contact): number | null {
  const dateStr = contact.last_interlock_date || contact.last_contact_date
  if (!dateStr) return null
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
}

function getStatus(contact: Contact): InterlockStatus {
  const cadence = getEffectiveCadenceDays(contact)
  if (!cadence) return 'no-cadence'

  const overdue = getDaysOverdue(contact)
  if (overdue === null) return 'no-cadence'

  if (overdue > 0) return 'overdue'
  // "due soon" = within 20% of cadence remaining
  if (overdue > -(cadence * 0.2)) return 'due-soon'
  return 'active'
}

export function getAllInterlocks(): {
  overdue: InterlockContact[]
  dueSoon: InterlockContact[]
  active: InterlockContact[]
  noCadence: InterlockContact[]
} {
  const db = getDb()
  const rows = db.prepare(`
    SELECT * FROM contacts
    WHERE importance_tier != 'None'
    ORDER BY display_name
  `).all() as Array<{
    id: string; google_resource_name: string | null; google_etag: string | null;
    display_name: string; given_name: string; family_name: string;
    photo_url: string | null; photo_override: string | null;
    emails: string; phones: string; company: string | null; job_title: string | null;
    addresses: string; birthday: string | null;
    notes: string; tags: string; origin: string; importance_tier: string;
    last_contact_date: string | null; review_status: string; update_log: string;
    interlock_cadence_days: number | null; last_interlock_date: string | null;
    synced_at: string | null; created_at: string; updated_at: string;
  }>

  const contacts: Contact[] = rows.map(r => ({
    ...r,
    emails: JSON.parse(r.emails || '[]'),
    phones: JSON.parse(r.phones || '[]'),
    addresses: JSON.parse(r.addresses || '[]'),
    tags: JSON.parse(r.tags || '[]'),
    update_log: JSON.parse(r.update_log || '[]'),
    importance_tier: r.importance_tier as Contact['importance_tier'],
    review_status: r.review_status as Contact['review_status'],
  }))

  const overdue: InterlockContact[] = []
  const dueSoon: InterlockContact[] = []
  const active: InterlockContact[] = []
  const noCadence: InterlockContact[] = []

  for (const contact of contacts) {
    const status = getStatus(contact)
    const item: InterlockContact = {
      contact,
      status,
      daysOverdue: getDaysOverdue(contact),
      effectiveCadenceDays: getEffectiveCadenceDays(contact),
      daysSinceContact: getDaysSinceContact(contact),
    }
    if (status === 'overdue') overdue.push(item)
    else if (status === 'due-soon') dueSoon.push(item)
    else if (status === 'active') active.push(item)
    else noCadence.push(item)
  }

  // Sort overdue by most overdue first
  overdue.sort((a, b) => (b.daysOverdue || 0) - (a.daysOverdue || 0))
  // Sort due-soon by least time remaining first (most negative daysOverdue, closest to 0)
  dueSoon.sort((a, b) => (b.daysOverdue || 0) - (a.daysOverdue || 0))

  return { overdue, dueSoon, active, noCadence }
}

export function recordReachedOut(contactId: string): void {
  const db = getDb()
  const today = new Date().toISOString().split('T')[0]
  db.prepare(`
    UPDATE contacts
    SET last_interlock_date = ?, last_contact_date = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(today, today, contactId)
}

export function buildDigestText(items: ReturnType<typeof getAllInterlocks>): string {
  const { overdue, dueSoon } = items
  const lines: string[] = []

  lines.push('**🔁 Daily Interlock Digest**')
  lines.push(`_${new Date().toLocaleDateString('en-CH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Europe/Zurich' })}_`)
  lines.push('')

  if (overdue.length === 0 && dueSoon.length === 0) {
    lines.push('✅ All interlocks are up to date. Nothing overdue.')
    return lines.join('\n')
  }

  if (overdue.length > 0) {
    lines.push(`**🔴 Overdue (${overdue.length})**`)
    for (const item of overdue) {
      const days = item.daysOverdue || 0
      const name = item.contact.display_name
      const tier = item.contact.importance_tier
      const last = item.daysSinceContact !== null ? `last: ${item.daysSinceContact}d ago` : 'never contacted'
      lines.push(`• ${name} — ${tier} — **${days}d overdue** (${last})`)
    }
    lines.push('')
  }

  if (dueSoon.length > 0) {
    lines.push(`**🟡 Due soon (${dueSoon.length})**`)
    for (const item of dueSoon) {
      const daysLeft = Math.abs(item.daysOverdue || 0)
      const name = item.contact.display_name
      const tier = item.contact.importance_tier
      lines.push(`• ${name} — ${tier} — due in ${daysLeft}d`)
    }
    lines.push('')
  }

  lines.push(`_Confirm "reached out" at http://localhost:3001/interlocks_`)
  return lines.join('\n')
}
