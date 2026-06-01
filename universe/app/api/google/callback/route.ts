import { NextRequest, NextResponse } from 'next/server'
import { exchangeCode } from '@/lib/google'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')

  if (error) {
    return NextResponse.redirect(new URL('/contacts?google_error=' + encodeURIComponent(error), req.url))
  }

  if (!code) {
    return NextResponse.redirect(new URL('/contacts?google_error=no_code', req.url))
  }

  try {
    await exchangeCode(code)
    return NextResponse.redirect(new URL('/contacts?google_connected=1', req.url))
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.redirect(new URL('/contacts?google_error=' + encodeURIComponent(msg), req.url))
  }
}
