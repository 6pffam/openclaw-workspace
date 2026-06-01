import { Suspense } from 'react'
import PrioritiesClient from './PrioritiesClient'

export default function PrioritiesPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: 'rgba(255,255,255,0.3)' }}>Loading…</div>}>
      <PrioritiesClient />
    </Suspense>
  )
}
