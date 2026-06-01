import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: string
  title: string
  message?: string
  action?: ReactNode
  className?: string
}

export default function EmptyState({ icon = '📭', title, message, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 text-center ${className}`}>
      <span className="text-4xl mb-4">{icon}</span>
      <p className="text-sm font-medium mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
        {title}
      </p>
      {message && (
        <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.25)' }}>
          {message}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
