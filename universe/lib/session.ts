import { cookies } from 'next/headers'
import { verifySessionToken, createSessionToken, refreshSessionToken } from './auth'

const COOKIE_NAME = 'universe_session'

export async function getSessionToken(): Promise<string | null> {
  const store = await cookies()
  return store.get(COOKIE_NAME)?.value || null
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getSessionToken()
  if (!token) return false
  return verifySessionToken(token)
}

export async function setSessionCookie(res: Response, token: string): Promise<void> {
  // Called from API routes to set cookie in response
  res.headers.set(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=900`
  )
}

export function buildSessionCookie(token: string): string {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=900`
}

export function buildClearCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`
}
