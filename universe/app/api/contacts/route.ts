import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/session'
import { isDbOpen } from '@/lib/db'
import { getAllContacts } from '@/lib/contacts'

export async function GET(req: NextRequest) {
  const authenticated = await isAuthenticated()
  if (!authenticated || !isDbOpen()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const search = searchParams.get('search') || ''

  // tiers: repeatable ?tiers=Inner+Circle&tiers=Long+Orbit OR comma-separated
  const tiersRaw = searchParams.getAll('tiers')
  const tiers = tiersRaw.length > 0
    ? tiersRaw.flatMap(t => t.split(',').map(s => s.trim())).filter(Boolean)
    : []

  // companies: repeatable or comma-separated
  const companiesRaw = searchParams.getAll('companies')
  const companies = companiesRaw.length > 0
    ? companiesRaw.flatMap(c => c.split(',').map(s => s.trim())).filter(Boolean)
    : []

  const country = searchParams.get('country') || ''
  const keyword = searchParams.get('keyword') || ''
  // keywords: repeatable ?keywords=IBM&keywords=cloud OR comma-separated
  const keywordsRaw = searchParams.getAll('keywords')
  const keywords = keywordsRaw.length > 0
    ? keywordsRaw.flatMap(k => k.split(',').map(s => s.trim())).filter(Boolean)
    : []
  const reviewStatus = searchParams.get('reviewStatus') || 'all'
  const limit = parseInt(searchParams.get('limit') || '200', 10)
  const offset = parseInt(searchParams.get('offset') || '0', 10)

  const result = getAllContacts({ search, tiers, companies, country, keyword, keywords, reviewStatus, limit, offset })
  return NextResponse.json(result)
}
