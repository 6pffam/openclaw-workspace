import { NextResponse } from 'next/server'
import { getWBSSlugs } from '@/lib/wbs'

export const dynamic = 'force-dynamic'

export async function GET() {
  const slugs = Array.from(getWBSSlugs())
  return NextResponse.json({ slugs })
}
