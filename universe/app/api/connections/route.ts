import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/session'
import { isDbOpen } from '@/lib/db'
import { getAllConnections, createConnection, getGraphData } from '@/lib/connections'

export async function GET(req: NextRequest) {
  const authenticated = await isAuthenticated()
  if (!authenticated || !isDbOpen()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const mode = searchParams.get('mode')
  const filterCategory = searchParams.get('category') || undefined

  if (mode === 'graph') {
    const data = getGraphData(filterCategory)
    return NextResponse.json(data)
  }

  const connections = getAllConnections()
  return NextResponse.json(connections)
}

export async function POST(req: NextRequest) {
  const authenticated = await isAuthenticated()
  if (!authenticated || !isDbOpen()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { contact_a, contact_b, is_directional, category_ids } = body

  if (!contact_a || !contact_b || !Array.isArray(category_ids)) {
    return NextResponse.json({ error: 'contact_a, contact_b, and category_ids are required' }, { status: 400 })
  }

  if (contact_a === contact_b) {
    return NextResponse.json({ error: 'Cannot connect a contact to themselves' }, { status: 400 })
  }

  const id = createConnection({ contact_a, contact_b, is_directional: !!is_directional, category_ids })
  return NextResponse.json({ id }, { status: 201 })
}
