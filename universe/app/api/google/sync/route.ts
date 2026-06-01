import { NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/session'
import { isDbOpen } from '@/lib/db'
import { fetchAllContacts } from '@/lib/google'
import { upsertGoogleContact } from '@/lib/contacts'

export async function POST() {
  const authenticated = await isAuthenticated()
  if (!authenticated || !isDbOpen()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const contacts = await fetchAllContacts()
    let synced = 0

    for (const contact of contacts) {
      upsertGoogleContact(contact)
      synced++
    }

    return NextResponse.json({ ok: true, synced, total: contacts.length })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Sync failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
