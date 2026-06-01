import { NextResponse } from 'next/server'
import { closeDb } from '@/lib/db'
import { buildClearCookie } from '@/lib/session'

export async function POST() {
  closeDb()
  const res = NextResponse.json({ ok: true })
  res.headers.set('Set-Cookie', buildClearCookie())
  return res
}
