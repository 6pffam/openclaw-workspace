import { NextResponse } from 'next/server'
import { getWikiPage } from '@/lib/wiki'
import { marked } from 'marked'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })

  const page = getWikiPage(slug)
  if (!page) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const html = await marked(page.content, { breaks: true })
  return NextResponse.json({ meta: page.meta, html })
}
