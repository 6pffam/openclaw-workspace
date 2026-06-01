import { NextResponse } from 'next/server'
import { parseWBSFile } from '@/lib/wbs'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const wbs = parseWBSFile(slug)
  if (!wbs) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(wbs)
}
