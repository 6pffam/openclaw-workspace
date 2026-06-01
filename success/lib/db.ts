import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import os from 'os'

const DATA_DIR = path.join(os.homedir(), '.openclaw', 'workspace', 'success', '.data')
const DB_PATH = path.join(DATA_DIR, 'success.db')

let _db: Database.Database | null = null

export function getDbPath() {
  return DB_PATH
}

export function isDbOpen() {
  return _db !== null && _db.open
}

export function getDb(): Database.Database {
  if (_db && _db.open) return _db

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 })
  }

  _db = new Database(DB_PATH)
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')

  initSchema(_db)
  return _db
}

function initSchema(db: Database.Database) {
  // Migration: add column_types if missing
  const cols = db.prepare(`PRAGMA table_info(projects)`).all() as { name: string }[]
  if (cols.length > 0 && !cols.find(c => c.name === 'column_types')) {
    db.exec(`ALTER TABLE projects ADD COLUMN column_types TEXT NOT NULL DEFAULT '{}'`)
  }

  // Migration: add start_date / end_date to row_priorities if missing
  const rpCols = db.prepare(`PRAGMA table_info(row_priorities)`).all() as { name: string }[]
  if (rpCols.length > 0) {
    if (!rpCols.find(c => c.name === 'start_date'))
      db.exec(`ALTER TABLE row_priorities ADD COLUMN start_date TEXT`)
    if (!rpCols.find(c => c.name === 'end_date'))
      db.exec(`ALTER TABLE row_priorities ADD COLUMN end_date TEXT`)
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      column_headers TEXT NOT NULL DEFAULT '[]',
      column_types TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS project_rows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      row_data TEXT NOT NULL DEFAULT '{}',
      row_index INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS iterations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      archived INTEGER NOT NULL DEFAULT 0,
      archived_at TEXT
    );

    CREATE TABLE IF NOT EXISTS row_priorities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      iteration_id INTEGER NOT NULL REFERENCES iterations(id) ON DELETE CASCADE,
      row_id INTEGER NOT NULL REFERENCES project_rows(id) ON DELETE CASCADE,
      priority TEXT NOT NULL DEFAULT 'Medium',
      due_date TEXT,
      UNIQUE(iteration_id, row_id)
    );

    CREATE TABLE IF NOT EXISTS row_dependencies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      iteration_id INTEGER NOT NULL REFERENCES iterations(id) ON DELETE CASCADE,
      row_id INTEGER NOT NULL REFERENCES project_rows(id) ON DELETE CASCADE,
      depends_on_row_id INTEGER NOT NULL REFERENCES project_rows(id) ON DELETE CASCADE,
      UNIQUE(iteration_id, row_id, depends_on_row_id)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS task_dependencies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      depends_on_task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      UNIQUE(task_id, depends_on_task_id)
    );

    CREATE TABLE IF NOT EXISTS task_row_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      row_id INTEGER NOT NULL REFERENCES project_rows(id) ON DELETE CASCADE,
      UNIQUE(task_id, row_id)
    );

    CREATE TABLE IF NOT EXISTS auth_sessions (
      token TEXT PRIMARY KEY,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL
    );
  `)
}
