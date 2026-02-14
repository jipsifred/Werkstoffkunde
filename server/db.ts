import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'wk1-karteikarten.db')

const db = new Database(DB_PATH)

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL')

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY,
    topic TEXT NOT NULL,
    type TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Theorie',
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    latex TEXT,
    variables TEXT,
    result_unit TEXT,
    conditions TEXT,
    axes TEXT,
    key_features TEXT,
    image TEXT,
    image_needed INTEGER NOT NULL DEFAULT 0,
    image_description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`)

// Migration: add category column if missing (existing cards get 'Theorie' via DEFAULT)
const columns = db.pragma('table_info(cards)') as { name: string }[]
if (!columns.some((c) => c.name === 'category')) {
  db.exec(`ALTER TABLE cards ADD COLUMN category TEXT NOT NULL DEFAULT 'Theorie'`)
}

// Create indexes
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_cards_topic ON cards(topic);
  CREATE INDEX IF NOT EXISTS idx_cards_type ON cards(type);
  CREATE INDEX IF NOT EXISTS idx_cards_category ON cards(category);
`)

export interface CardRow {
  id: string
  topic: string
  type: string
  category: string
  title: string
  content: string
  latex: string | null
  variables: string | null
  result_unit: string | null
  conditions: string | null
  axes: string | null
  key_features: string | null
  image: string | null
  image_needed: number
  image_description: string | null
}

// Prepared statements for performance
const stmts = {
  getAll: db.prepare('SELECT * FROM cards ORDER BY topic, type, id'),
  getById: db.prepare('SELECT * FROM cards WHERE id = ?'),
  insert: db.prepare(`
    INSERT INTO cards (id, topic, type, category, title, content, latex, variables, result_unit, conditions, axes, key_features, image, image_needed, image_description)
    VALUES (@id, @topic, @type, @category, @title, @content, @latex, @variables, @result_unit, @conditions, @axes, @key_features, @image, @image_needed, @image_description)
  `),
  update: db.prepare(`
    UPDATE cards SET
      topic = @topic, type = @type, category = @category, title = @title, content = @content,
      latex = @latex, variables = @variables, result_unit = @result_unit,
      conditions = @conditions, axes = @axes, key_features = @key_features,
      image = @image, image_needed = @image_needed, image_description = @image_description,
      updated_at = datetime('now')
    WHERE id = @id
  `),
  upsert: db.prepare(`
    INSERT INTO cards (id, topic, type, category, title, content, latex, variables, result_unit, conditions, axes, key_features, image, image_needed, image_description)
    VALUES (@id, @topic, @type, @category, @title, @content, @latex, @variables, @result_unit, @conditions, @axes, @key_features, @image, @image_needed, @image_description)
    ON CONFLICT(id) DO UPDATE SET
      topic = @topic, type = @type, category = @category, title = @title, content = @content,
      latex = @latex, variables = @variables, result_unit = @result_unit,
      conditions = @conditions, axes = @axes, key_features = @key_features,
      image = @image, image_needed = @image_needed, image_description = @image_description,
      updated_at = datetime('now')
  `),
  delete: db.prepare('DELETE FROM cards WHERE id = ?'),
  deleteAll: db.prepare('DELETE FROM cards'),
  getAllIds: db.prepare('SELECT id FROM cards'),
}

function cardToRow(card: Record<string, unknown>): Record<string, unknown> {
  return {
    id: card.id,
    topic: card.topic,
    type: card.type,
    category: card.category ?? 'Theorie',
    title: card.title,
    content: card.content,
    latex: card.latex ?? null,
    variables: card.variables ? JSON.stringify(card.variables) : null,
    result_unit: card.result_unit ?? null,
    conditions: card.conditions ?? null,
    axes: card.axes ? JSON.stringify(card.axes) : null,
    key_features: card.key_features ? JSON.stringify(card.key_features) : null,
    image: card.image ?? null,
    image_needed: card.image_needed ? 1 : 0,
    image_description: card.image_description ?? null,
  }
}

function rowToCard(row: CardRow): Record<string, unknown> {
  return {
    id: row.id,
    topic: row.topic,
    type: row.type,
    category: row.category,
    title: row.title,
    content: row.content,
    latex: row.latex,
    variables: row.variables ? JSON.parse(row.variables) : undefined,
    result_unit: row.result_unit,
    conditions: row.conditions,
    axes: row.axes ? JSON.parse(row.axes) : undefined,
    key_features: row.key_features ? JSON.parse(row.key_features) : undefined,
    image: row.image,
    image_needed: row.image_needed === 1,
    image_description: row.image_description,
  }
}

export function getAllCards() {
  const rows = stmts.getAll.all() as CardRow[]
  return rows.map(rowToCard)
}

export function getCardById(id: string) {
  const row = stmts.getById.get(id) as CardRow | undefined
  return row ? rowToCard(row) : null
}

export function getAllIds(): string[] {
  const rows = stmts.getAllIds.all() as { id: string }[]
  return rows.map((r) => r.id)
}

export function insertCard(card: Record<string, unknown>) {
  stmts.insert.run(cardToRow(card))
}

export function updateCard(id: string, updates: Record<string, unknown>) {
  const existing = getCardById(id)
  if (!existing) return false
  const merged = { ...existing, ...updates, id }
  stmts.update.run(cardToRow(merged))
  return true
}

export function upsertCard(card: Record<string, unknown>) {
  stmts.upsert.run(cardToRow(card))
}

export const bulkUpsert = db.transaction((cards: Record<string, unknown>[]) => {
  for (const card of cards) {
    stmts.upsert.run(cardToRow(card))
  }
})

export function deleteCard(id: string) {
  const result = stmts.delete.run(id)
  return result.changes > 0
}

export function deleteAllCards() {
  stmts.deleteAll.run()
}

export default db
