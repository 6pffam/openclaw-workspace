import { NextRequest, NextResponse } from 'next/server'
import { verifyPin, createSessionToken } from '@/lib/auth'
import { createSession } from '@/lib/session'
import { getDb } from '@/lib/db'

export async function POST(req: NextRequest) {
  const { pin } = await req.json()
  getDb() // ensure DB is initialized

  if (!verifyPin(pin)) {
    return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })
  }

  const token = createSessionToken()
  await createSession(token)

  return NextResponse.json({ ok: true })
}
