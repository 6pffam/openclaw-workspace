import type { Metadata, Viewport } from 'next'
import './globals.css'
import NavBar from '@/components/nav/NavBar'
import BottomNav from '@/components/nav/BottomNav'

export const metadata: Metadata = {
  title: 'Success',
  description: 'Executive project timeline and Gantt visualization',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Success',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0d1b2a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="pb-safe">
        <div className="hidden md:block"><NavBar /></div>
        <main className="min-h-screen pt-4 md:pt-16 px-4 md:px-6 pb-24 md:pb-8">
          {children}
        </main>
        <div className="block md:hidden"><BottomNav /></div>
      </body>
    </html>
  )
}
