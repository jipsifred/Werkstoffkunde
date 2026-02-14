import { create } from 'zustand'
import type { Card, CardType, CardImportData } from '../types/card'
import * as db from './db'

interface CardStore {
  cards: Card[]
  topics: string[]

  selectedTopics: string[]
  selectedTypes: CardType[]
  searchQuery: string
  viewMode: 'summary' | 'flashcard'

  loadCards: () => Promise<void>
  importCards: (data: CardImportData) => Promise<{ imported: number; duplicates: number }>
  addCard: (card: Omit<Card, 'id'>) => Promise<void>
  updateCard: (id: string, updates: Partial<Card>) => Promise<void>
  deleteCard: (id: string) => Promise<void>
  exportCards: () => CardImportData

  toggleTopic: (topic: string) => void
  toggleType: (type: CardType) => void
  setSearchQuery: (query: string) => void
  resetFilters: () => void
  setViewMode: (mode: 'summary' | 'flashcard') => void

  getFilteredCards: () => Card[]
  getTopics: () => string[]
  getStats: () => { total: number; byTopic: Record<string, number>; byType: Record<string, number> }
  getCardsNeedingImages: () => Card[]
}

function extractTopics(cards: Card[]): string[] {
  const topicSet = new Set<string>()
  for (const card of cards) {
    topicSet.add(card.topic)
  }
  return Array.from(topicSet).sort((a, b) => a.localeCompare(b, 'de'))
}

function cardMatchesSearch(card: Card, query: string): boolean {
  const lowerQuery = query.toLowerCase()
  if (card.title.toLowerCase().includes(lowerQuery)) return true
  if (card.content.toLowerCase().includes(lowerQuery)) return true
  if (card.variables) {
    for (const variable of card.variables) {
      if (variable.name.toLowerCase().includes(lowerQuery)) return true
      if (variable.symbol.toLowerCase().includes(lowerQuery)) return true
    }
  }
  return false
}

export const useCardStore = create<CardStore>((set, get) => ({
  cards: [],
  topics: [],
  selectedTopics: [],
  selectedTypes: [],
  searchQuery: '',
  viewMode: 'summary',

  loadCards: async () => {
    try {
      const cards = await db.getAllCards()
      set({ cards, topics: extractTopics(cards) })
    } catch {
      // Server might not be ready yet — keep empty state
    }
  },

  importCards: async (data: CardImportData) => {
    // Server handles duplicate detection and ID generation
    const result = await db.importCards(data.cards as unknown as Record<string, unknown>[])
    if (!result || typeof result.imported !== 'number') {
      throw new Error('Import fehlgeschlagen')
    }
    // Reload all cards from server to stay in sync
    const cards = await db.getAllCards()
    set({ cards, topics: extractTopics(cards) })
    return { imported: result.imported, duplicates: result.duplicates }
  },

  addCard: async (card: Omit<Card, 'id'>) => {
    // Server generates the ID
    const created = await db.createCard(card as Card)
    const updatedCards = [...get().cards, created]
    set({ cards: updatedCards, topics: extractTopics(updatedCards) })
  },

  updateCard: async (id: string, updates: Partial<Card>) => {
    const { cards } = get()
    const index = cards.findIndex((c) => c.id === id)
    if (index === -1) return

    const updatedCard: Card = { ...cards[index], ...updates, id }
    await db.saveCard(updatedCard)

    const updatedCards = [...cards]
    updatedCards[index] = updatedCard
    set({ cards: updatedCards, topics: extractTopics(updatedCards) })
  },

  deleteCard: async (id: string) => {
    await db.deleteCard(id)
    const updatedCards = get().cards.filter((c) => c.id !== id)
    set({ cards: updatedCards, topics: extractTopics(updatedCards) })
  },

  exportCards: () => {
    const { cards, topics } = get()
    const typeSet = new Set<string>()
    for (const card of cards) typeSet.add(card.type)

    return {
      metadata: {
        title: 'Werkstoffkunde 1 – Formelsammlung',
        version: '1.0',
        last_updated: new Date().toISOString().split('T')[0],
        schema_version: '1.0',
      },
      topics,
      types: Array.from(typeSet),
      cards,
    }
  },

  toggleTopic: (topic: string) => {
    const { selectedTopics } = get()
    if (selectedTopics.includes(topic)) {
      set({ selectedTopics: selectedTopics.filter((t) => t !== topic) })
    } else {
      set({ selectedTopics: [...selectedTopics, topic] })
    }
  },

  toggleType: (type: CardType) => {
    const { selectedTypes } = get()
    if (selectedTypes.includes(type)) {
      set({ selectedTypes: selectedTypes.filter((t) => t !== type) })
    } else {
      set({ selectedTypes: [...selectedTypes, type] })
    }
  },

  setSearchQuery: (query: string) => set({ searchQuery: query }),
  resetFilters: () => set({ selectedTopics: [], selectedTypes: [], searchQuery: '' }),
  setViewMode: (mode: 'summary' | 'flashcard') => set({ viewMode: mode }),

  getFilteredCards: () => {
    const { cards, selectedTopics, selectedTypes, searchQuery } = get()
    let filtered = cards
    if (selectedTopics.length > 0) filtered = filtered.filter((c) => selectedTopics.includes(c.topic))
    if (selectedTypes.length > 0) filtered = filtered.filter((c) => selectedTypes.includes(c.type))
    if (searchQuery.trim()) filtered = filtered.filter((c) => cardMatchesSearch(c, searchQuery.trim()))
    return filtered
  },

  getTopics: () => get().topics,

  getStats: () => {
    const { cards } = get()
    const byTopic: Record<string, number> = {}
    const byType: Record<string, number> = {}
    for (const card of cards) {
      byTopic[card.topic] = (byTopic[card.topic] ?? 0) + 1
      byType[card.type] = (byType[card.type] ?? 0) + 1
    }
    return { total: cards.length, byTopic, byType }
  },

  getCardsNeedingImages: () => get().cards.filter((c) => c.image_needed && !c.image),
}))
