import { getProjectDetail } from '@/lib/projects'
import { readTaskData } from '@/lib/tasks'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Task } from '@/lib/tasks'

export const dynamic = 'force-dynamic'

const STATUS_COLOR: Record<string, { color: string; bg: string }> = {
  'pending-approval': { color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  'in-progress':      { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  'backlog':          { color: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.05)' },
  'done':             { color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const detail = getProjectDetail(id)
  if (!detail) notFound()

  const taskData = readTaskData()
  const tasks: Task[] = (taskData?.tasks ?? []).filter(t => t.project === id)

  const updated = new Date(detail.lastModified).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
  return (
    <div className="max-w-4xl mx-auto pt-8">
      <div className="mb-8">
        <Link href="/projects" className="text-xs mb-4 inline-block" style={{ color: 'rgba(255,255,255,0.3)' }}>
          ← Projects
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-white tracking-tight">{detail.name}</h1>
          <span className="text-xs px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(96,165,250,0.12)', color: '#60a5fa' }}>
            {detail.phase}
          </span>
        </div>
        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Last updated {updated}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {detail.readme && (
            <div className="rounded-2xl p-6" style={{ backgroundColor: '#0f2236', border: '1px solid rgba(255,255,255,0.04)' }}>
              <h2 className="text-xs font-semibold tracking-wider uppercase mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
                README
              </h2>
              <pre className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'inherit' }}>
                {detail.readme.slice(0, 2000)}{detail.readme.length > 2000 ? '\n...' : ''}
              </pre>
            </div>
          )}

          {tasks.length > 0 && (
            <div className="rounded-2xl p-6" style={{ backgroundColor: '#0f2236', border: '1px solid rgba(255,255,255,0.04)' }}>
              <h2 className="text-xs font-semibold tracking-wider uppercase mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Tasks ({tasks.length})
              </h2>
              <div className="space-y-2">
                {tasks.map(task => {
                  const sc = STATUS_COLOR[task.status] ?? STATUS_COLOR['backlog']
                  return (
                    <div key={task.id} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span className="text-sm text-white">{task.title}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full shrink-0 ml-4" style={{ backgroundColor: sc.bg, color: sc.color }}>
                        {task.status}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl p-6" style={{ backgroundColor: '#0f2236', border: '1px solid rgba(255,255,255,0.04)' }}>
            <h2 className="text-xs font-semibold tracking-wider uppercase mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Recent Files
            </h2>
            <div className="space-y-2">
              {detail.recentFiles.map(f => (
                <div key={f.relativePath}>
                  <p className="text-xs text-white truncate">{f.relativePath}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    {new Date(f.mtime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    {' '}
                    {new Date(f.mtime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
