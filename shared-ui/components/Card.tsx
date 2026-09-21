import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
  style?: CSSProperties
  /** Use the slightly lighter alt surface (#132033) */
  alt?: boolean
  /** Dashed border + reduced opacity for planned/ghost state */
  ghost?: boolean
  /** Amber accent border (CEO / highlight) */
  highlight?: boolean
  padding?: string
}

/**
 * Unrecognised props are forwarded to the root element, so callers can attach
 * `data-*` hooks, `id`, `aria-*`, `title` and event handlers without wrapping
 * the component in a spare element. They are spread before `className` and
 * `style`, which the component always computes itself — so this is additive:
 * nothing a caller could already pass changes meaning.
 */
export default function Card({
  children,
  className = '',
  style,
  alt = false,
  ghost = false,
  highlight = false,
  padding = 'p-5',
  ...rest
}: CardProps) {
  const bg = alt ? '#132033' : ghost ? 'rgba(15,34,54,0.4)' : '#0f2236'
  const border = highlight
    ? '1px solid rgba(245,158,11,0.2)'
    : ghost
    ? '1px dashed rgba(255,255,255,0.08)'
    : '1px solid rgba(255,255,255,0.06)'

  return (
    <div
      {...rest}
      className={`rounded-2xl transition-all ${padding} ${className}`}
      style={{
        backgroundColor: bg,
        border,
        opacity: ghost ? 0.6 : 1,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
