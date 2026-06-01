import { cookies } from 'next/headers'
import { getDb, isDbOpen } from './db'

const COOKIE_NAME = 'success_session'
const SESSION_DURATION = 60 * 60 * 8 // 8 hours

export async function isAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (!token) return false

    if (!isDbOpen()) {
      const { getDb } = await import('./db')
      getDb()
    }

    const db = getDb()
    const session = db.prepare(
      `SELECT token FROM auth_sessions WHERE token = ? AND expires_at > datetime('now')`
    ).get(token)

    return !!session
  } catch {
    return false
  }
}

export async function createSession(token: string) {
  const db = getDb()
  const expiresAt = new Date(Date.now() + SESSION_DURATION * 1000).toISOString()
  db.prepare(
    `INSERT OR REPLACE INTO auth_sessions (token, expires_at) VALUES (?, ?)`
  ).run(token, expiresAt)

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'strict',
    maxAge: SESSION_DURATION,
    path: '/',
  })
}

export async function destroySession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (token) {
    const db = getDb()
    db.prepare(`DELETE FROM auth_sessions WHERE token = ?`).run(token)
  }
  cookieStore.delete(COOKIE_NAME)
}
