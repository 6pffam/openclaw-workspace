import crypto from 'crypto'

const PIN = process.env.SUCCESS_PIN || '1234'

export function verifyPin(pin: string): boolean {
  return pin === PIN
}

export function createSessionToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function verifySessionToken(token: string): boolean {
  // Token verification is handled via DB in session.ts
  return token.length === 64
}
