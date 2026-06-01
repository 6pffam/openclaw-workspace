import AppShell from '@/components/layout/AppShell'
import ContactDetailClient from './ContactDetailClient'

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <AppShell>
      <ContactDetailClient contactId={id} />
    </AppShell>
  )
}
