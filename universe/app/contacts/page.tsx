import { Suspense } from 'react'
import AppShell from '@/components/layout/AppShell'
import ContactsClient from './ContactsClient'

export default function ContactsPage() {
  return (
    <AppShell>
      <Suspense fallback={<div style={{ padding: 32, color: 'var(--color-ink-subtle)' }}>Loading…</div>}>
        <ContactsClient />
      </Suspense>
    </AppShell>
  )
}
