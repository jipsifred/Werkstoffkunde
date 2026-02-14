import type { Card } from '../types/card'

const API = '/api'

export async function getAllCards(): Promise<Card[]> {
  const res = await fetch(`${API}/cards`)
  return res.json()
}

export async function saveCard(card: Card): Promise<Card> {
  const res = await fetch(`${API}/cards/${card.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(card),
  })
  return res.json()
}

export async function createCard(card: Omit<Card, 'id'> & { id?: string }): Promise<Card> {
  const res = await fetch(`${API}/cards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(card),
  })
  return res.json()
}

export async function importCards(cards: Record<string, unknown>[]): Promise<{
  imported: number
  duplicates: number
  cards: Card[]
}> {
  const res = await fetch(`${API}/cards/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cards }),
  })
  return res.json()
}

export async function deleteCard(id: string): Promise<void> {
  await fetch(`${API}/cards/${id}`, { method: 'DELETE' })
}

export async function exportCards(): Promise<Record<string, unknown>> {
  const res = await fetch(`${API}/cards/export`)
  return res.json()
}
