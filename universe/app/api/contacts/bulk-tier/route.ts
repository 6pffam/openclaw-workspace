import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/session'
import { isDbOpen } from '@/lib/db'
import { bulkSetTier } from '@/lib/contacts'

export async function POST(req: NextRequest) {
  const authenticated = await isAuthenticated()
  if (!authenticated || !isDbOpen()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { contactIds?: string[]; tier?: string | null }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { contactIds, tier } = body
  if (!Array.isArray(contactIds) || contactIds.length === 0) {
    return NextResponse.json({ error: 'contactIds must be a non-empty array' }, { status: 400 })
  }
  if (tier !== undefined && tier !== null && typeof tier !== 'string') {
    return NextResponse.json({ error: 'tier must be a string or null' }, { status: 400 })
  }

  // tier=undefined means "not-yet-reviewed" → null
  const resolvedTier = tier === 'not-yet-reviewed' ? null : (tier ?? null)

  const updated = bulkSetTier(contactIds, resolvedTier)
  return NextResponse.json({ updated })
}
