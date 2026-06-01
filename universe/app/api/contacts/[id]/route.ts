import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/session'
import { isDbOpen } from '@/lib/db'
import { getContactById, updateContactPrivate, addUpdateLogEntry } from '@/lib/contacts'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authenticated = await isAuthenticated()
  if (!authenticated || !isDbOpen()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const contact = getContactById(id)
  if (!contact) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(contact)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authenticated = await isAuthenticated()
  if (!authenticated || !isDbOpen()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()

  updateContactPrivate(id, body)

  if (body.log_entry) {
    addUpdateLogEntry(id, body.log_entry)
  }

  const updated = getContactById(id)
  return NextResponse.json(updated)
}
