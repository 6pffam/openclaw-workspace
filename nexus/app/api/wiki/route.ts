import { NextResponse } from 'next/server'
import { getAllWikiPages, getWikiGraph } from '@/lib/wiki'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const view = searchParams.get('view')

  if (view === 'graph') {
    return NextResponse.json(getWikiGraph())
  }

  return NextResponse.json(getAllWikiPages())
}
