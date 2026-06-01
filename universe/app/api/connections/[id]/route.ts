import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/session'
import { isDbOpen } from '@/lib/db'
import { deleteConnection } from '@/lib/connections'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authenticated = await isAuthenticated()
  if (!authenticated || !isDbOpen()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  deleteConnection(id)
  return NextResponse.json({ ok: true })
}
