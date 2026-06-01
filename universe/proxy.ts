import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const SESSION_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'universe-session-secret-dev-only'
)

const PUBLIC_PATHS = ['/setup', '/lock', '/api/auth/setup', '/api/auth/verify', '/api/auth/status', '/api/google/callback']
const CRON_SECRET = process.env.DIGEST_CRON_SECRET

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public paths
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Allow static files
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next()
  }

  // Allow cron/script requests with valid cron secret
  const cronHeader = req.headers.get('x-cron-secret')
  if (CRON_SECRET && cronHeader === CRON_SECRET) {
    return NextResponse.next()
  }

  const token = req.cookies.get('universe_session')?.value

  if (!token) {
    // Check if PIN is configured — if not, go to setup first
    const authCheckUrl = new URL('/api/auth/setup', req.url)
    try {
      const authRes = await fetch(authCheckUrl.toString())
      const authData = await authRes.json()
      if (!authData.configured) {
        return NextResponse.redirect(new URL('/setup', req.url))
      }
    } catch {
      // If check fails, fall through to lock
    }
    return NextResponse.redirect(new URL('/lock', req.url))
  }

  try {
    await jwtVerify(token, SESSION_SECRET)
    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL('/lock', req.url))
  }
}

export { proxy as middleware }

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
