import type { HTMLAttributes, ReactNode } from 'react'

// `title` is narrowed to a string by HTMLAttributes; this one is the heading.
interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  icon?: string
  title: string
  message?: string
  action?: ReactNode
  className?: string
}

/**
 * Unrecognised props are forwarded to the root element, so callers can attach
 * `data-*` hooks, `id`, `aria-*`, `title` and event handlers without wrapping
 * the component in a spare element. They are spread before `className` and
 * `style`, which the component always computes itself — so this is additive:
 * nothing a caller could already pass changes meaning.
 */
export default function EmptyState({
  icon = '📭',
  title,
  message,
  action,
  className = '',
  ...rest
}: EmptyStateProps) {
  return (
    <div
      {...rest}
      className={`flex flex-col items-center justify-center py-16 text-center ${className}`}
    >
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
