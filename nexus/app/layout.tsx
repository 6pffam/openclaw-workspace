import type { Metadata, Viewport } from 'next'
import './globals.css'
import NavBar from '@/components/nav/NavBar'
import BottomNav from '@/components/nav/BottomNav'

export const metadata: Metadata = {
  title: 'Nexus — Mission Control',
  description: 'Personal mission control dashboard',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Nexus',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0d1b2a',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {/* Top nav — hidden on mobile */}
        <div className="hidden md:block">
          <NavBar />
        </div>

        {/* Main content — extra bottom padding on mobile for bottom nav */}
        <main className="min-h-screen pt-4 md:pt-16 px-4 md:px-6 pb-24 md:pb-8">
          {children}
        </main>

        {/* Bottom nav — mobile only */}
        <div className="block md:hidden">
          <BottomNav />
        </div>
      </body>
    </html>
  )
}
