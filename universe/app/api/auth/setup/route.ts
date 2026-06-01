import { NextRequest, NextResponse } from 'next/server'
import { isPinConfigured, setupPin, verifyPin, createSessionToken } from '@/lib/auth'
import { initDb } from '@/lib/db'
import { buildSessionCookie } from '@/lib/session'

export async function GET() {
  const configured = await isPinConfigured()
  return NextResponse.json({ configured })
}

export async function POST(req: NextRequest) {
  const { pin } = await req.json()

  if (!pin || typeof pin !== 'string' || pin.length < 4) {
    return NextResponse.json({ error: 'PIN must be at least 4 characters' }, { status: 400 })
  }

  const already = await isPinConfigured()
  if (already) {
    return NextResponse.json({ error: 'PIN already configured' }, { status: 409 })
  }

  await setupPin(pin)
  initDb(pin)

  const token = await createSessionToken()
  const res = NextResponse.json({ ok: true })
  res.headers.set('Set-Cookie', buildSessionCookie(token))
  return res
}
