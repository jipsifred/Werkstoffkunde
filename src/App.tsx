import { useState, useEffect, useMemo, useRef } from 'react'
import { useCardStore } from './store/cardStore'
import type { Card } from './types/card'
import FilterBar from './components/FilterBar'
import StatsPanel from './components/StatsPanel'
import ImportModal from './components/ImportModal'
import EditCardModal from './components/EditCardModal'
import SummaryView from './views/SummaryView'
import FlashcardView from './views/FlashcardView'

function cardMatchesSearch(card: Card, query: string): boolean {
  const q = query.toLowerCase()
  if (card.title.toLowerCase().includes(q)) return true
  if (card.content.toLowerCase().includes(q)) return true
  if (card.variables) {
    for (const v of card.variables) {
      if (v.name.toLowerCase().includes(q)) return true
      if (v.symbol.toLowerCase().includes(q)) return true
    }
  }
  return false
}

export default function App() {
  const loadCards = useCardStore((s) => s.loadCards)
  const viewMode = useCardStore((s) => s.viewMode)
  const setViewMode = useCardStore((s) => s.setViewMode)
  const cards = useCardStore((s) => s.cards)
  const selectedTopics = useCardStore((s) => s.selectedTopics)
  const selectedTypes = useCardStore((s) => s.selectedTypes)
  const searchQuery = useCardStore((s) => s.searchQuery)

  const filteredCards = useMemo(() => {
    let filtered = cards
    if (selectedTopics.length > 0) {
      filtered = filtered.filter((c) => selectedTopics.includes(c.topic))
    }
    if (selectedTypes.length > 0) {
      filtered = filtered.filter((c) => selectedTypes.includes(c.type))
    }
    if (searchQuery.trim()) {
      filtered = filtered.filter((c) => cardMatchesSearch(c, searchQuery.trim()))
    }
    return filtered
  }, [cards, selectedTopics, selectedTypes, searchQuery])

  const activeFilterCount = selectedTopics.length + selectedTypes.length + (searchQuery.trim() ? 1 : 0)

  const [showImport, setShowImport] = useState(false)
  const [editingCard, setEditingCard] = useState<Card | null>(null)
  const [showStats, setShowStats] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadCards()
  }, [loadCards])

  // Close mobile menu when clicking outside
  useEffect(() => {
    if (!showMobileMenu) return
    const handleClick = (e: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setShowMobileMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showMobileMenu])

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-cream/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Main bar */}
          <div className="flex items-center justify-between h-14">
            {/* Title — hidden on mobile */}
            <h1 className="hidden sm:block text-base font-semibold text-text-primary">
              WK1 <span className="font-normal text-text-secondary">Karteikarten</span>
            </h1>

            {/* Mobile: hamburger menu + filter */}
            <div className="flex sm:hidden items-center gap-1.5">
              {/* Hamburger menu */}
              <div className="relative" ref={mobileMenuRef}>
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className={`p-2 rounded-lg transition-colors ${
                    showMobileMenu
                      ? 'text-accent bg-accent-light'
                      : 'text-text-secondary hover:text-text-primary border border-border hover:bg-cream-light'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showMobileMenu ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>

                {/* Dropdown menu */}
                {showMobileMenu && (
                  <div className="absolute left-0 top-full mt-1.5 w-48 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                    {/* View toggle */}
                    <button
                      onClick={() => { setViewMode('summary'); setShowMobileMenu(false) }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                        viewMode === 'summary' ? 'text-accent bg-accent-light' : 'text-text-primary hover:bg-cream-light'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                      Übersicht
                    </button>
                    <button
                      onClick={() => { setViewMode('flashcard'); setShowMobileMenu(false) }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                        viewMode === 'flashcard' ? 'text-accent bg-accent-light' : 'text-text-primary hover:bg-cream-light'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      Lernen
                    </button>

                    <div className="h-px bg-border" />

                    {/* Stats */}
                    <button
                      onClick={() => { setShowStats(!showStats); setShowMobileMenu(false) }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                        showStats ? 'text-accent bg-accent-light' : 'text-text-primary hover:bg-cream-light'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Statistik
                    </button>

                    {/* Import */}
                    <button
                      onClick={() => { setShowImport(true); setShowMobileMenu(false) }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-text-primary hover:bg-cream-light transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Importieren
                    </button>
                  </div>
                )}
              </div>

              {/* Filter — always visible on mobile */}
              {cards.length > 0 && (
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`relative p-2 rounded-lg transition-colors ${
                    showFilters || activeFilterCount > 0
                      ? 'text-accent bg-accent-light'
                      : 'text-text-secondary hover:text-text-primary border border-border hover:bg-cream-light'
                  }`}
                  title="Filter"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* Desktop controls */}
            <div className="hidden sm:flex items-center gap-1.5">
              {/* View toggle */}
              <div className="flex bg-cream-light border border-border rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('summary')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    viewMode === 'summary'
                      ? 'bg-card text-text-primary shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Übersicht
                </button>
                <button
                  onClick={() => setViewMode('flashcard')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    viewMode === 'flashcard'
                      ? 'bg-card text-text-primary shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Lernen
                </button>
              </div>

              {/* Filter toggle */}
              {cards.length > 0 && (
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`relative p-2 rounded-lg transition-colors ${
                    showFilters || activeFilterCount > 0
                      ? 'text-accent bg-accent-light'
                      : 'text-text-secondary hover:text-text-primary border border-border hover:bg-cream-light'
                  }`}
                  title="Filter"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              )}

              {/* Stats */}
              <button
                onClick={() => setShowStats(!showStats)}
                className={`p-2 rounded-lg transition-colors ${
                  showStats
                    ? 'text-accent bg-accent-light'
                    : 'text-text-secondary hover:text-text-primary border border-border hover:bg-cream-light'
                }`}
                title="Statistik"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </button>

              {/* Import */}
              <button
                onClick={() => setShowImport(true)}
                className="p-2 text-text-secondary hover:text-text-primary border border-border rounded-lg hover:bg-cream-light transition-colors"
                title="Importieren"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Collapsible filter panel */}
          {showFilters && cards.length > 0 && (
            <div className="pb-4 pt-1 border-t border-border mt-0">
              <FilterBar />
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-6">
          <div className="flex-1 min-w-0">
            {viewMode === 'summary' ? (
              <SummaryView cards={filteredCards} onEditCard={setEditingCard} />
            ) : (
              <FlashcardView cards={filteredCards} />
            )}
          </div>

          {showStats && cards.length > 0 && (
            <aside className="hidden lg:block w-72 shrink-0">
              <div className="sticky top-20">
                <StatsPanel />
              </div>
            </aside>
          )}
        </div>
      </main>

      {/* Stats mobile overlay */}
      {showStats && cards.length > 0 && (
        <div className="lg:hidden fixed inset-0 z-40 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowStats(false)} />
          <div className="relative w-full max-w-lg mx-4 mb-4">
            <StatsPanel />
          </div>
        </div>
      )}

      {/* Modals */}
      <ImportModal isOpen={showImport} onClose={() => setShowImport(false)} />
      {editingCard && (
        <EditCardModal card={editingCard} onClose={() => setEditingCard(null)} />
      )}
    </div>
  )
}
