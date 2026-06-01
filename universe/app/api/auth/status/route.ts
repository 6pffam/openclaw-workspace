import { NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/session'
import { isPinConfigured } from '@/lib/auth'
import { isDbOpen } from '@/lib/db'

export async function GET() {
  const [authenticated, configured] = await Promise.all([
    isAuthenticated(),
    isPinConfigured(),
  ])

  return NextResponse.json({
    authenticated: authenticated && isDbOpen(),
    pinConfigured: configured,
  })
}
