import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import * as db from './db.ts'
import { generateCardId } from './idgen.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = parseInt(process.env.PORT || '4820', 10)

app.use(cors())
app.use(express.json({ limit: '50mb' }))

// Serve static frontend in production
const distPath = path.join(__dirname, '..', 'dist')
app.use(express.static(distPath))

// GET /api/cards — all cards
app.get('/api/cards', (_req, res) => {
  const cards = db.getAllCards()
  res.json(cards)
})

// POST /api/cards — create single card
app.post('/api/cards', (req, res) => {
  const card = req.body
  if (!card.title || !card.topic || !card.type) {
    res.status(400).json({ error: 'title, topic, type sind Pflichtfelder.' })
    return
  }
  const existingIds = db.getAllIds()
  const id = generateCardId(card.topic, card.type, existingIds)
  const fullCard = { ...card, id }
  db.insertCard(fullCard)
  res.status(201).json(fullCard)
})

// PUT /api/cards/:id — update card
app.put('/api/cards/:id', (req, res) => {
  const { id } = req.params
  const updates = req.body
  const success = db.updateCard(id, updates)
  if (!success) {
    res.status(404).json({ error: 'Karte nicht gefunden.' })
    return
  }
  const updated = db.getCardById(id)
  res.json(updated)
})

// DELETE /api/cards/:id — delete card
app.delete('/api/cards/:id', (req, res) => {
  const { id } = req.params
  const success = db.deleteCard(id)
  if (!success) {
    res.status(404).json({ error: 'Karte nicht gefunden.' })
    return
  }
  res.json({ ok: true })
})

// POST /api/cards/import — bulk import
app.post('/api/cards/import', (req, res) => {
  const { cards } = req.body
  if (!Array.isArray(cards)) {
    res.status(400).json({ error: 'cards Array fehlt.' })
    return
  }

  const existingIds = db.getAllIds()
  const existingCards = db.getAllCards()

  const existingFingerprints = new Set(
    existingCards.map((c: Record<string, unknown>) => `${c.title}|||${c.topic}|||${c.type}`),
  )

  const imported: Record<string, unknown>[] = []
  const duplicates: Record<string, unknown>[] = []
  const allIds = [...existingIds]

  for (const card of cards) {
    const fingerprint = `${card.title}|||${card.topic}|||${card.type}`
    if (existingFingerprints.has(fingerprint)) {
      duplicates.push(card)
      continue
    }
    const id = generateCardId(card.topic, card.type, allIds)
    const fullCard = { ...card, id }
    allIds.push(id)
    imported.push(fullCard)
  }

  if (imported.length > 0) {
    db.bulkUpsert(imported)
  }

  res.json({ imported: imported.length, duplicates: duplicates.length, cards: imported })
})

// GET /api/cards/export — export all
app.get('/api/cards/export', (_req, res) => {
  const cards = db.getAllCards()
  const topics = [...new Set(cards.map((c: Record<string, unknown>) => c.topic as string))].sort()
  const types = [...new Set(cards.map((c: Record<string, unknown>) => c.type as string))]

  res.json({
    metadata: {
      title: 'Werkstoffkunde 1 – Formelsammlung',
      version: '1.0',
      last_updated: new Date().toISOString().split('T')[0],
      schema_version: '1.0',
    },
    topics,
    types,
    cards,
  })
})

// SPA fallback — serve index.html for all non-API routes
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`WK1 API-Server läuft auf http://localhost:${PORT}`)
})
