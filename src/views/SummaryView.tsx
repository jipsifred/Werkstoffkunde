import { useMemo } from 'react'
import type { Card } from '../types/card'
import CardComponent from '../components/CardComponent'

interface SummaryViewProps {
  cards: Card[]
  onEditCard: (card: Card) => void
}

export default function SummaryView({ cards, onEditCard }: SummaryViewProps) {
  const groupedCards = useMemo(() => {
    const groups: Record<string, Card[]> = {}
    for (const card of cards) {
      if (!groups[card.topic]) {
        groups[card.topic] = []
      }
      groups[card.topic].push(card)
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b, 'de'))
  }, [cards])

  if (cards.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-text-secondary text-sm">
          Keine Karten gefunden. Importiere eine JSON-Datei oder passe die Filter an.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {groupedCards.map(([topic, topicCards]) => (
        <section key={topic}>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-xl font-semibold text-text-primary">{topic}</h2>
            <span className="text-xs text-text-secondary tabular-nums">
              {topicCards.length} {topicCards.length === 1 ? 'Karte' : 'Karten'}
            </span>
          </div>
          <div className="flex flex-col gap-4">
            {topicCards.map((card) => (
              <CardComponent key={card.id} card={card} onEdit={onEditCard} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
