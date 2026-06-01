import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/session'
import { isDbOpen } from '@/lib/db'
import { getAllCategories, createCategory } from '@/lib/connections'

export async function GET() {
  const authenticated = await isAuthenticated()
  if (!authenticated || !isDbOpen()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json(getAllCategories())
}

export async function POST(req: NextRequest) {
  const authenticated = await isAuthenticated()
  if (!authenticated || !isDbOpen()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { name, color } = await req.json()
  if (!name || !color) {
    return NextResponse.json({ error: 'name and color are required' }, { status: 400 })
  }
  const category = createCategory(name, color)
  return NextResponse.json(category, { status: 201 })
}
