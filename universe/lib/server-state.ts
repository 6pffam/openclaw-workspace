/**
 * Server-side in-memory state for the Universe app.
 * Holds the decrypted DB connection after PIN verification.
 * In Next.js dev, module state persists across hot reloads via global.
 */

import type Database from 'better-sqlite3'

declare global {
  // eslint-disable-next-line no-var
  var __universeDb: Database.Database | null
  // eslint-disable-next-line no-var
  var __universePinHash: string | null
}

if (typeof global.__universeDb === 'undefined') {
  global.__universeDb = null
}
if (typeof global.__universePinHash === 'undefined') {
  global.__universePinHash = null
}

export function setServerDb(db: Database.Database | null): void {
  global.__universeDb = db
}

export function getServerDb(): Database.Database | null {
  return global.__universeDb
}

export function isServerDbOpen(): boolean {
  return global.__universeDb !== null && global.__universeDb.open
}
