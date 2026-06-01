import { NextRequest, NextResponse } from 'next/server'
import { isCronOrAuthenticated } from '@/lib/cron-auth'
import { getAllInterlocks, buildDigestText } from '@/lib/interlocks'

export async function GET(req: NextRequest) {
  if (!await isCronOrAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const mode = req.nextUrl.searchParams.get('mode')
  const data = getAllInterlocks()

  if (mode === 'digest') {
    const text = buildDigestText(data)
    return NextResponse.json({ text })
  }

  return NextResponse.json(data)
}
