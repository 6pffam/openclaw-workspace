import { NextRequest } from 'next/server'
import { isAuthenticated } from './session'
import { isDbOpen } from './db'

/**
 * Allow access if either:
 *  1. Valid session cookie (normal browser use)
 *  2. X-Cron-Secret header matches DIGEST_CRON_SECRET env var (cron/script use)
 *
 * Note: DB does not need to be open for cron secret access — the digest
 * queries the DB directly, so it will error naturally if DB is not open.
 */
export async function isCronOrAuthenticated(req: NextRequest): Promise<boolean> {
  const cronSecret = process.env.DIGEST_CRON_SECRET
  if (cronSecret) {
    const header = req.headers.get('x-cron-secret')
    if (header && header === cronSecret) return true
  }

  return (await isAuthenticated()) && isDbOpen()
}
