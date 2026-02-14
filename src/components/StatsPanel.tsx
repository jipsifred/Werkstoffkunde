import { useMemo } from 'react'
import { useCardStore } from '../store/cardStore'

export default function StatsPanel() {
  const cards = useCardStore((s) => s.cards)

  const { total, byTopic, byType, needingImages } = useMemo(() => {
    const bt: Record<string, number> = {}
    const bty: Record<string, number> = {}
    let ni = 0
    for (const card of cards) {
      bt[card.topic] = (bt[card.topic] ?? 0) + 1
      bty[card.type] = (bty[card.type] ?? 0) + 1
      if (card.image_needed && !card.image) ni++
    }
    return { total: cards.length, byTopic: bt, byType: bty, needingImages: ni }
  }, [cards])

  const topicEntries = useMemo(
    () => Object.entries(byTopic).sort((a, b) => a[0].localeCompare(b[0], 'de')),
    [byTopic],
  )
  const typeEntries = useMemo(
    () => Object.entries(byType).sort((a, b) => b[1] - a[1]),
    [byType],
  )

  return (
    <div className="bg-card rounded-xl border border-border p-6 space-y-6">
      <div>
        <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-1">
          Gesamt
        </h3>
        <p className="text-3xl font-semibold text-text-primary tabular-nums">
          {total}
          <span className="text-base font-normal text-text-secondary ml-1.5">
            Karten
          </span>
        </p>
      </div>

      {typeEntries.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-2">
            Nach Typ
          </h3>
          <div className="space-y-1.5">
            {typeEntries.map(([type, count]) => (
              <div key={type} className="flex items-center justify-between text-sm">
                <span className="text-text-primary">{type}</span>
                <span className="text-text-secondary tabular-nums">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {topicEntries.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-2">
            Nach Thema
          </h3>
          <div className="space-y-1.5">
            {topicEntries.map(([topic, count]) => (
              <div key={topic} className="flex items-center justify-between text-sm">
                <span className="text-text-primary truncate mr-2">{topic}</span>
                <span className="text-text-secondary tabular-nums shrink-0">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {needingImages > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-1">
            Bilder ausstehend
          </h3>
          <p className="text-lg font-semibold text-text-primary tabular-nums">
            {needingImages}
          </p>
        </div>
      )}
    </div>
  )
}
