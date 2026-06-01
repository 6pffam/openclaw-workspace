import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/session'
import { isDbOpen } from '@/lib/db'
import { updateCategory, deleteCategory } from '@/lib/connections'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authenticated = await isAuthenticated()
  if (!authenticated || !isDbOpen()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const body = await req.json()
  updateCategory(id, body)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authenticated = await isAuthenticated()
  if (!authenticated || !isDbOpen()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  deleteCategory(id)
  return NextResponse.json({ ok: true })
}
