import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: Variant
  size?: Size
}

const variantStyles: Record<Variant, { bg: string; color: string; border: string; hoverBg: string }> = {
  primary: {
    bg: '#f59e0b',
    color: '#0d1b2a',
    border: 'transparent',
    hoverBg: '#d97706',
  },
  secondary: {
    bg: 'rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.85)',
    border: 'rgba(255,255,255,0.08)',
    hoverBg: 'rgba(255,255,255,0.12)',
  },
  ghost: {
    bg: 'transparent',
    color: 'rgba(255,255,255,0.5)',
    border: 'transparent',
    hoverBg: 'rgba(255,255,255,0.06)',
  },
  danger: {
    bg: 'rgba(239,68,68,0.15)',
    color: '#ef4444',
    border: 'rgba(239,68,68,0.2)',
    hoverBg: 'rgba(239,68,68,0.25)',
  },
}

const sizeStyles: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-base',
}

export default function Button({
  children,
  variant = 'secondary',
  size = 'md',
  disabled,
  className = '',
  style,
  ...rest
}: ButtonProps) {
  const v = variantStyles[variant]

  return (
    <button
      disabled={disabled}
      className={`rounded-lg font-medium transition-all cursor-pointer ${sizeStyles[size]} ${className}`}
      style={{
        backgroundColor: v.bg,
        color: disabled ? 'rgba(255,255,255,0.3)' : v.color,
        border: `1px solid ${v.border}`,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  )
}
