import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function getTierColor(tier: string): string {
  switch (tier) {
    case 'Inner Circle': return '#e07b39'
    case 'Active Network': return '#3a72b8'
    case 'Long Orbit': return '#6b7280'
    default: return '#d1c9c0'
  }
}

export function getTierLabel(tier: string): string {
  return tier || 'None'
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('en-CH', {
      year: 'numeric', month: 'short', day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export function daysAgo(dateStr: string | null): string {
  if (!dateStr) return 'never'
  const d = new Date(dateStr).getTime()
  const diff = Math.floor((Date.now() - d) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'today'
  if (diff === 1) return 'yesterday'
  return `${diff}d ago`
}
