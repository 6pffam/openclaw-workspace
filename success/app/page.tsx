import { redirect } from 'next/navigation'
import { isAuthenticated } from '@/lib/session'

export default async function Home() {
  const auth = await isAuthenticated()
  if (!auth) redirect('/lock')
  redirect('/input')
}
