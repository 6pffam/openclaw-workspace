import { NextResponse } from 'next/server'
import { getAuthUrl, isTokenStored } from '@/lib/google'
import { isAuthenticated } from '@/lib/session'

export async function GET() {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const connected = isTokenStored()
  if (connected) {
    return NextResponse.json({ connected: true })
  }

  const authUrl = getAuthUrl()
  return NextResponse.json({ connected: false, authUrl })
}
