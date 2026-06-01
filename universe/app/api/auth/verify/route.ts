import { NextRequest, NextResponse } from 'next/server'
import { verifyPin, createSessionToken } from '@/lib/auth'
import { initDb } from '@/lib/db'
import { buildSessionCookie } from '@/lib/session'

export async function POST(req: NextRequest) {
  const { pin } = await req.json()

  if (!pin || typeof pin !== 'string') {
    return NextResponse.json({ error: 'PIN required' }, { status: 400 })
  }

  const valid = await verifyPin(pin)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })
  }

  initDb(pin)

  const token = await createSessionToken()
  const res = NextResponse.json({ ok: true })
  res.headers.set('Set-Cookie', buildSessionCookie(token))
  return res
}
