import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { setServerDb, getServerDb } from './server-state'

const DATA_DIR = process.env.UNIVERSE_DATA_DIR || path.join(process.env.HOME || '~', '.openclaw/workspace/universe/.data')

export function getDataDir(): string {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 })
  }
  return DATA_DIR
}

export function getDbPath(): string {
  return path.join(getDataDir(), 'universe.db')
}

export function getMachineSalt(): string {
  const saltPath = path.join(getDataDir(), '.machine-salt')
  if (fs.existsSync(saltPath)) {
    return fs.readFileSync(saltPath, 'utf-8').trim()
  }
  const salt = crypto.randomBytes(32).toString('hex')
  fs.writeFileSync(saltPath, salt, { mode: 0o600 })
  return salt
}

export function deriveDbKey(pin: string): string {
  const salt = getMachineSalt()
  return crypto.createHmac('sha256', salt).update(pin).digest('hex')
}

export function openDb(pin: string): Database.Database {
  const key = deriveDbKey(pin)
  const db = new Database(getDbPath())
  // Set key for SQLCipher (if available) — with standard better-sqlite3 this is a no-op pragma
  // We use it as a marker; full SQLCipher requires @journeyapps/sqlcipher build
  try {
    db.pragma(`key = '${key}'`)
  } catch {
    // Standard better-sqlite3 doesn't support cipher, proceed unencrypted for now
  }
  return db
}

export function getDb(): Database.Database {
  const db = getServerDb()
  if (!db) {
    throw new Error('Database not initialized. Call initDb(pin) first.')
  }
  return db
}

export function initDb(pin: string): Database.Database {
  const existing = getServerDb()
  if (existing) {
    existing.close()
  }
  const db = openDb(pin)
  runMigrations(db)
  setServerDb(db)
  return db
}

export function closeDb(): void {
  const db = getServerDb()
  if (db) {
    db.close()
    setServerDb(null)
  }
}

export function isDbOpen(): boolean {
  const db = getServerDb()
  return db !== null && db.open
}

function runMigrations(db: Database.Database): void {
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      google_resource_name TEXT UNIQUE,
      google_etag TEXT,

      -- From Google (read-only cache)
      display_name TEXT,
      given_name TEXT,
      family_name TEXT,
      photo_url TEXT,
      emails TEXT DEFAULT '[]',
      phones TEXT DEFAULT '[]',
      company TEXT,
      job_title TEXT,
      addresses TEXT DEFAULT '[]',
      birthday TEXT,

      -- Universe-only private fields
      notes TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      origin TEXT DEFAULT '',
      importance_tier TEXT DEFAULT 'None',
      photo_override TEXT,
      last_contact_date TEXT,
      review_status TEXT DEFAULT 'unreviewed',
      update_log TEXT DEFAULT '[]',

      -- Interlock
      interlock_cadence_days INTEGER,
      last_interlock_date TEXT,

      synced_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS connections (
      id TEXT PRIMARY KEY,
      contact_a TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
      contact_b TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
      is_directional INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS connection_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL DEFAULT '#6b7280',
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS connection_category_assignments (
      connection_id TEXT NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
      category_id TEXT NOT NULL REFERENCES connection_categories(id) ON DELETE CASCADE,
      is_primary INTEGER DEFAULT 0,
      PRIMARY KEY (connection_id, category_id)
    );

    CREATE INDEX IF NOT EXISTS idx_contacts_display_name ON contacts(display_name);
    CREATE INDEX IF NOT EXISTS idx_contacts_importance_tier ON contacts(importance_tier);
    CREATE INDEX IF NOT EXISTS idx_connections_contact_a ON connections(contact_a);
    CREATE INDEX IF NOT EXISTS idx_connections_contact_b ON connections(contact_b);
  `)

  // Migration: backfill unreviewed contacts to NULL importance_tier
  const tierMigrationDone = db.prepare(
    "SELECT value FROM meta WHERE key = 'contacts_tier_null_migration'"
  ).get() as { value: string } | undefined
  if (!tierMigrationDone) {
    db.prepare(`
      UPDATE contacts
      SET importance_tier = NULL
      WHERE review_status = 'unreviewed' AND importance_tier = 'None'
    `).run()
    db.prepare(`
      INSERT OR REPLACE INTO meta (key, value, updated_at)
      VALUES ('contacts_tier_null_migration', '1', datetime('now'))
    `).run()
  }

  // Seed default connection categories
  const categoryCount = (db.prepare('SELECT COUNT(*) as n FROM connection_categories').get() as { n: number }).n
  if (categoryCount === 0) {
    const insert = db.prepare(`
      INSERT INTO connection_categories (id, name, color, sort_order) VALUES (?, ?, ?, ?)
    `)
    const defaults = [
      ['cat-family', 'Family', '#ef4444', 1],
      ['cat-work-current', 'Work — Current', '#3b82f6', 2],
      ['cat-work-past', 'Work — Past', '#6366f1', 3],
      ['cat-education', 'INSEAD / Education', '#8b5cf6', 4],
      ['cat-community', 'Community', '#10b981', 5],
      ['cat-introduced', 'Introduced by', '#f59e0b', 6],
    ]
    db.transaction(() => {
      for (const [id, name, color, order] of defaults) {
        insert.run(id, name, color, order)
      }
    })()
  }
}
