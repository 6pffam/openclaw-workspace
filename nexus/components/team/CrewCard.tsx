import type { CrewMember } from '@/lib/types'

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  'active':           { label: 'Active',        color: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
  'idle':             { label: 'Idle',           color: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.05)' },
  'pending-approval': { label: 'Needs Approval', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  'not-deployed':     { label: 'Not Deployed',   color: 'rgba(255,255,255,0.2)', bg: 'rgba(255,255,255,0.03)' },
  'planned':          { label: 'Planned',        color: 'rgba(255,255,255,0.2)', bg: 'rgba(255,255,255,0.03)' },
}

function formatLastActive(lastActiveAt: number | null | undefined): string | null {
  if (!lastActiveAt) return null
  const diff = Date.now() - lastActiveAt
  const min = Math.floor(diff / 60000)
  const hr = Math.floor(min / 60)
  const day = Math.floor(hr / 24)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  if (hr < 24) return `${hr}h ago`
  return `${day}d ago`
}

function formatModel(model: string | null | undefined): string {
  if (!model || model === 'unknown') return '—'
  return model
    .replace('anthropic/', '')
    .replace('ollama/', '🔒 ')
    .replace('claude-', '')
    .replace('sonnet-4-6', 'Sonnet 4.6')
    .replace('haiku-4-5', 'Haiku 4.5')
    .replace('haiku-3-5', 'Haiku 3.5')
    .replace('opus-4-7', 'Opus 4.7')
    .replace('qwen2.5-coder:7b', 'Qwen Coder 7B')
    .replace('qwen2.5:7b', 'Qwen 2.5 7B')
}

function formatCost(chf: number | null | undefined, usd: number | null | undefined): string {
  if (chf == null && usd == null) return '—'
  const u = usd ?? (chf != null ? chf / 0.90 : 0)
  const c = chf ?? 0
  if (u < 0.01) return '$0.00'
  return `$${u.toFixed(2)}`
}

export default function CrewCard({
  member,
  isCeo = false,
}: {
  member: CrewMember
  isCeo?: boolean
}) {
  const status = statusConfig[member.status] ?? statusConfig['idle']
  const isPlanned = member.status === 'planned'
  const lastActiveLabel = formatLastActive(member.lastActiveAt)
  const hasAgent = Boolean(member.agentId)

  const now = new Date()
  const currentMonthLabel = now.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevMonthLabel = prevDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })

  return (
    <div
      className="rounded-2xl p-5 transition-all"
      style={{
        backgroundColor: isCeo ? '#132033' : isPlanned ? 'rgba(15,34,54,0.4)' : '#0f2236',
        border: isCeo
          ? '1px solid rgba(245,158,11,0.2)'
          : isPlanned
          ? '1px dashed rgba(255,255,255,0.08)'
          : '1px solid rgba(255,255,255,0.06)',
        opacity: isPlanned ? 0.6 : 1,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl" style={{ filter: isPlanned ? 'grayscale(0.5)' : 'none' }}>
            {member.emoji}
          </span>
          <div>
            <div className="font-semibold text-sm" style={{ color: isPlanned ? 'rgba(255,255,255,0.45)' : 'white' }}>
              {member.name}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {member.role}
            </div>
          </div>
        </div>
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0"
          style={{ backgroundColor: status.bg, color: status.color }}
        >
          {!isPlanned && (
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: status.color }} />
          )}
          {status.label}
        </div>
      </div>

      {/* Mission */}
      <p className="text-xs leading-relaxed mb-3" style={{ color: isPlanned ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.5)' }}>
        {member.mission}
      </p>

      {/* Model + Cost — only for deployed agents */}
      {hasAgent && !isPlanned && (
        <div
          className="rounded-xl px-3 py-2 mt-2 space-y-1.5"
          style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          {/* Model */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }}>Model</span>
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {formatModel(member.configuredModel ?? member.model)}
              </span>
              {member.secondaryModel && (
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  + {formatModel(member.secondaryModel)} coding
                </span>
              )}
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} />

          {/* Current month cost */}
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{currentMonthLabel}</span>
            <span
              className="text-xs font-semibold tabular-nums"
              style={{ color: (member.currentMonthChf ?? 0) > 0 ? '#f59e0b' : 'rgba(255,255,255,0.25)' }}
            >
              {formatCost(member.currentMonthChf, member.currentMonthUsd)}
            </span>
          </div>

          {/* Previous month cost */}
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{prevMonthLabel}</span>
            <span className="text-xs tabular-nums" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {formatCost(member.previousMonthChf, member.previousMonthUsd)}
            </span>
          </div>
        </div>
      )}

      {/* Last active */}
      {lastActiveLabel && !isPlanned && (
        <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Last active {lastActiveLabel}
        </p>
      )}
    </div>
  )
}
