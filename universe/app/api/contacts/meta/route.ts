import { NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/session'
import { isDbOpen } from '@/lib/db'
import { getDistinctCompanies, getDistinctCountries } from '@/lib/contacts'

export async function GET() {
  const authenticated = await isAuthenticated()
  if (!authenticated || !isDbOpen()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const companies = getDistinctCompanies()
  const countries = getDistinctCountries()
  return NextResponse.json({ companies, countries })
}
