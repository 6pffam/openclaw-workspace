import type { HTMLAttributes, ReactNode } from 'react'

// `title` is narrowed to a string by HTMLAttributes; this one is the heading.
interface PageHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  className?: string
}

/**
 * Unrecognised props are forwarded to the root element, so callers can attach
 * `data-*` hooks, `id`, `aria-*`, `title` and event handlers without wrapping
 * the component in a spare element. They are spread before `className` and
 * `style`, which the component always computes itself — so this is additive:
 * nothing a caller could already pass changes meaning.
 */
export default function PageHeader({
  title,
  subtitle,
  actions,
  className = '',
  ...rest
}: PageHeaderProps) {
  return (
    <div {...rest} className={`flex items-start justify-between mb-6 ${className}`}>
      <div>
        <h1 className="text-xl font-semibold" style={{ color: 'white' }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  )
}
