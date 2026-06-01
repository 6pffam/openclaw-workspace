import { getDb } from './db'
import { v4 as uuidv4 } from 'uuid'

export interface ConnectionCategory {
  id: string
  name: string
  color: string
  sort_order: number
  created_at: string
}

export interface Connection {
  id: string
  contact_a: string
  contact_b: string
  is_directional: boolean
  categories: Array<{ category_id: string; is_primary: boolean }>
  created_at: string
}

export interface ConnectionWithContacts extends Connection {
  contact_a_name: string
  contact_a_photo: string | null
  contact_a_tier: string
  contact_b_name: string
  contact_b_photo: string | null
  contact_b_tier: string
  primary_category_name: string | null
  primary_category_color: string | null
}

// ── Categories ────────────────────────────────────────────────────────────────

export function getAllCategories(): ConnectionCategory[] {
  const db = getDb()
  return db.prepare(
    'SELECT * FROM connection_categories ORDER BY sort_order, name'
  ).all() as ConnectionCategory[]
}

export function createCategory(name: string, color: string): ConnectionCategory {
  const db = getDb()
  const id = uuidv4()
  const maxOrder = (db.prepare('SELECT COALESCE(MAX(sort_order), 0) as m FROM connection_categories').get() as { m: number }).m
  db.prepare(
    'INSERT INTO connection_categories (id, name, color, sort_order) VALUES (?, ?, ?, ?)'
  ).run(id, name, color, maxOrder + 1)
  return db.prepare('SELECT * FROM connection_categories WHERE id = ?').get(id) as ConnectionCategory
}

export function updateCategory(id: string, updates: Partial<{ name: string; color: string; sort_order: number }>): void {
  const db = getDb()
  const fields: string[] = []
  const values: (string | number)[] = []
  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name) }
  if (updates.color !== undefined) { fields.push('color = ?'); values.push(updates.color) }
  if (updates.sort_order !== undefined) { fields.push('sort_order = ?'); values.push(updates.sort_order) }
  if (!fields.length) return
  values.push(id)
  db.prepare(`UPDATE connection_categories SET ${fields.join(', ')} WHERE id = ?`).run(...values)
}

export function deleteCategory(id: string): void {
  const db = getDb()
  db.prepare('DELETE FROM connection_categories WHERE id = ?').run(id)
}

// ── Connections ───────────────────────────────────────────────────────────────

export function getAllConnections(): ConnectionWithContacts[] {
  const db = getDb()
  const rows = db.prepare(`
    SELECT
      c.id, c.contact_a, c.contact_b, c.is_directional, c.created_at,
      ca.display_name as contact_a_name, ca.photo_url as contact_a_photo,
      ca.photo_override as contact_a_photo_override, ca.importance_tier as contact_a_tier,
      cb.display_name as contact_b_name, cb.photo_url as contact_b_photo,
      cb.photo_override as contact_b_photo_override, cb.importance_tier as contact_b_tier,
      cat.name as primary_category_name, cat.color as primary_category_color
    FROM connections c
    JOIN contacts ca ON c.contact_a = ca.id
    JOIN contacts cb ON c.contact_b = cb.id
    LEFT JOIN connection_category_assignments cca ON c.id = cca.connection_id AND cca.is_primary = 1
    LEFT JOIN connection_categories cat ON cca.category_id = cat.id
    ORDER BY c.created_at DESC
  `).all() as Array<{
    id: string; contact_a: string; contact_b: string; is_directional: number; created_at: string;
    contact_a_name: string; contact_a_photo: string | null; contact_a_photo_override: string | null; contact_a_tier: string;
    contact_b_name: string; contact_b_photo: string | null; contact_b_photo_override: string | null; contact_b_tier: string;
    primary_category_name: string | null; primary_category_color: string | null;
  }>

  return rows.map(row => ({
    id: row.id,
    contact_a: row.contact_a,
    contact_b: row.contact_b,
    is_directional: row.is_directional === 1,
    created_at: row.created_at,
    contact_a_name: row.contact_a_name,
    contact_a_photo: row.contact_a_photo_override || row.contact_a_photo,
    contact_a_tier: row.contact_a_tier,
    contact_b_name: row.contact_b_name,
    contact_b_photo: row.contact_b_photo_override || row.contact_b_photo,
    contact_b_tier: row.contact_b_tier,
    primary_category_name: row.primary_category_name,
    primary_category_color: row.primary_category_color,
    categories: getConnectionCategories(row.id),
  }))
}

export function getConnectionCategories(connectionId: string): Array<{ category_id: string; is_primary: boolean }> {
  const db = getDb()
  const rows = db.prepare(
    'SELECT category_id, is_primary FROM connection_category_assignments WHERE connection_id = ?'
  ).all(connectionId) as Array<{ category_id: string; is_primary: number }>
  return rows.map(r => ({ category_id: r.category_id, is_primary: r.is_primary === 1 }))
}

export function createConnection(params: {
  contact_a: string
  contact_b: string
  is_directional: boolean
  category_ids: string[] // first is primary
}): string {
  const db = getDb()
  const id = uuidv4()

  db.transaction(() => {
    db.prepare(
      'INSERT INTO connections (id, contact_a, contact_b, is_directional) VALUES (?, ?, ?, ?)'
    ).run(id, params.contact_a, params.contact_b, params.is_directional ? 1 : 0)

    for (let i = 0; i < params.category_ids.length; i++) {
      db.prepare(
        'INSERT INTO connection_category_assignments (connection_id, category_id, is_primary) VALUES (?, ?, ?)'
      ).run(id, params.category_ids[i], i === 0 ? 1 : 0)
    }
  })()

  return id
}

export function deleteConnection(id: string): void {
  const db = getDb()
  db.prepare('DELETE FROM connections WHERE id = ?').run(id)
}

// ── Graph data for D3 ─────────────────────────────────────────────────────────

export interface GraphNode {
  id: string
  name: string
  photoUrl: string | null
  tier: string
  // multi-category ring colors: [ { color, isPrimary } ] from all connections
  ringColors: string[]
}

export interface GraphLink {
  id: string
  source: string
  target: string
  isDirectional: boolean
  primaryColor: string
  categoryNames: string[]
}

export function getGraphData(filterCategoryId?: string): { nodes: GraphNode[]; links: GraphLink[] } {
  const db = getDb()

  let connectionQuery = `
    SELECT c.id, c.contact_a, c.contact_b, c.is_directional,
      cat.color as primary_color, cat.name as primary_name
    FROM connections c
    LEFT JOIN connection_category_assignments cca ON c.id = cca.connection_id AND cca.is_primary = 1
    LEFT JOIN connection_categories cat ON cca.category_id = cat.id
  `
  const params: string[] = []
  if (filterCategoryId) {
    connectionQuery += `
      WHERE c.id IN (
        SELECT connection_id FROM connection_category_assignments WHERE category_id = ?
      )
    `
    params.push(filterCategoryId)
  }

  const connections = db.prepare(connectionQuery).all(...params) as Array<{
    id: string; contact_a: string; contact_b: string; is_directional: number;
    primary_color: string | null; primary_name: string | null;
  }>

  if (!connections.length) return { nodes: [], links: [] }

  // Collect all contact IDs that appear in filtered connections
  const contactIdSet = new Set<string>()
  for (const c of connections) {
    contactIdSet.add(c.contact_a)
    contactIdSet.add(c.contact_b)
  }
  const contactIds = [...contactIdSet]

  // Fetch contact data
  const placeholders = contactIds.map(() => '?').join(',')
  const contactRows = db.prepare(
    `SELECT id, display_name, photo_url, photo_override, importance_tier FROM contacts WHERE id IN (${placeholders})`
  ).all(...contactIds) as Array<{
    id: string; display_name: string; photo_url: string | null;
    photo_override: string | null; importance_tier: string;
  }>

  const contactMap = new Map(contactRows.map(r => [r.id, r]))

  // Build ring color map per contact (all category colors from their connections)
  const contactRingColors = new Map<string, Set<string>>()
  for (const id of contactIds) contactRingColors.set(id, new Set())

  for (const conn of connections) {
    const allCats = db.prepare(`
      SELECT cat.color FROM connection_category_assignments cca
      JOIN connection_categories cat ON cca.category_id = cat.id
      WHERE cca.connection_id = ?
    `).all(conn.id) as Array<{ color: string }>

    for (const cat of allCats) {
      contactRingColors.get(conn.contact_a)?.add(cat.color)
      contactRingColors.get(conn.contact_b)?.add(cat.color)
    }
  }

  const nodes: GraphNode[] = contactRows.map(r => ({
    id: r.id,
    name: r.display_name,
    photoUrl: r.photo_override || r.photo_url,
    tier: r.importance_tier,
    ringColors: [...(contactRingColors.get(r.id) || [])],
  }))

  const links: GraphLink[] = connections.map(c => {
    const allCatNames = db.prepare(`
      SELECT cat.name FROM connection_category_assignments cca
      JOIN connection_categories cat ON cca.category_id = cat.id
      WHERE cca.connection_id = ? ORDER BY cca.is_primary DESC
    `).all(c.id) as Array<{ name: string }>

    return {
      id: c.id,
      source: c.contact_a,
      target: c.contact_b,
      isDirectional: c.is_directional === 1,
      primaryColor: c.primary_color || '#9ca3af',
      categoryNames: allCatNames.map(n => n.name),
    }
  })

  return { nodes, links }
}
