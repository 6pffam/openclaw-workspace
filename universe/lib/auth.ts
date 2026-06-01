import argon2 from 'argon2'
import fs from 'fs'
import path from 'path'
import { getDataDir } from './db'
import { SignJWT, jwtVerify } from 'jose'

const AUTH_FILE = () => path.join(getDataDir(), '.auth')
const SESSION_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'universe-session-secret-dev-only'
)

// ── PIN Management ────────────────────────────────────────────────────────────

export async function isPinConfigured(): Promise<boolean> {
  return fs.existsSync(AUTH_FILE())
}

export async function setupPin(pin: string): Promise<void> {
  const hash = await argon2.hash(pin, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
  })
  fs.writeFileSync(AUTH_FILE(), hash, { mode: 0o600 })
}

export async function verifyPin(pin: string): Promise<boolean> {
  if (!fs.existsSync(AUTH_FILE())) return false
  const hash = fs.readFileSync(AUTH_FILE(), 'utf-8').trim()
  try {
    return await argon2.verify(hash, pin)
  } catch {
    return false
  }
}

// ── Session Token ─────────────────────────────────────────────────────────────

const SESSION_TTL_SECONDS = 15 * 60 // 15 minutes

export async function createSessionToken(): Promise<string> {
  return new SignJWT({ authenticated: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(SESSION_SECRET)
}

export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, SESSION_SECRET)
    return true
  } catch {
    return false
  }
}

export async function refreshSessionToken(token: string): Promise<string | null> {
  try {
    await jwtVerify(token, SESSION_SECRET)
    return createSessionToken()
  } catch {
    return null
  }
}
