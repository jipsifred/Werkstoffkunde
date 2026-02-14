export interface Variable {
  symbol: string
  name: string
  unit: string
}

export type CardType = 'Formel' | 'Definition' | 'Graph' | 'Erklärung'

export interface Card {
  id: string
  topic: string
  type: CardType
  title: string
  content: string
  latex?: string
  variables?: Variable[]
  result_unit?: string
  conditions?: string | null
  axes?: { x: string; y: string }
  key_features?: string[]
  image: string | null
  image_needed: boolean
  image_description?: string | null
}

export interface CardImportData {
  metadata: {
    title: string
    version: string
    last_updated: string
    schema_version: string
  }
  topics: string[]
  types: string[]
  cards: Card[]
}

export type ViewMode = 'summary' | 'flashcard'

export interface FlashcardState {
  deck: Card[]
  currentIndex: number
  isFlipped: boolean
  knownCards: Set<string>
  againCards: string[]
}
