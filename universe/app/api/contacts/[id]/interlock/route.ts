import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/session'
import { isDbOpen } from '@/lib/db'
import { recordReachedOut } from '@/lib/interlocks'
import { updateContactPrivate } from '@/lib/contacts'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authenticated = await isAuthenticated()
  if (!authenticated || !isDbOpen()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json().catch(() => ({}))

  // Optional: override cadence
  if (body.cadence_days !== undefined) {
    updateContactPrivate(id, { interlock_cadence_days: body.cadence_days || null })
  }

  recordReachedOut(id)
  return NextResponse.json({ ok: true, date: new Date().toISOString().split('T')[0] })
}
