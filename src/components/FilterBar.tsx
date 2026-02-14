import { useCardStore } from '../store/cardStore'
import type { CardType } from '../types/card'

const ALL_TYPES: CardType[] = ['Formel', 'Definition', 'Graph', 'Erklärung']

export default function FilterBar() {
  const topics = useCardStore((s) => s.topics)
  const selectedTopics = useCardStore((s) => s.selectedTopics)
  const selectedTypes = useCardStore((s) => s.selectedTypes)
  const searchQuery = useCardStore((s) => s.searchQuery)
  const toggleTopic = useCardStore((s) => s.toggleTopic)
  const toggleType = useCardStore((s) => s.toggleType)
  const setSearchQuery = useCardStore((s) => s.setSearchQuery)
  const resetFilters = useCardStore((s) => s.resetFilters)

  const hasActiveFilters =
    selectedTopics.length > 0 || selectedTypes.length > 0 || searchQuery.trim().length > 0

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Suche nach Titel, Inhalt, Variablen..."
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Type filter chips */}
      <div className="flex flex-wrap gap-2">
        {ALL_TYPES.map((type) => {
          const isActive = selectedTypes.includes(type)
          return (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent text-white'
                  : 'bg-cream-light border border-border text-text-primary hover:bg-border'
              }`}
            >
              {type}
            </button>
          )
        })}
      </div>

      {/* Topic filter chips */}
      {topics.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {topics.map((topic) => {
            const isActive = selectedTopics.includes(topic)
            return (
              <button
                key={topic}
                onClick={() => toggleTopic(topic)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-accent text-white'
                    : 'bg-cream-light border border-border text-text-primary hover:bg-border'
                }`}
              >
                {topic}
              </button>
            )
          })}
        </div>
      )}

      {/* Reset button */}
      {hasActiveFilters && (
        <button
          onClick={resetFilters}
          className="text-sm text-text-secondary hover:text-accent transition-colors"
        >
          Alle Filter zurücksetzen
        </button>
      )}
    </div>
  )
}
