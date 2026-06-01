import { NextResponse } from 'next/server'
import { getProjectDetail } from '@/lib/projects'
import { readTaskData } from '@/lib/tasks'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const detail = getProjectDetail(id)
  if (!detail) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const taskData = readTaskData()
  const tasks = (taskData?.tasks ?? []).filter((t: { project: string | null }) => t.project === id)

  return NextResponse.json({ ...detail, tasks })
}
