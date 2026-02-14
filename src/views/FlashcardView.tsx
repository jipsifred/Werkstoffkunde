import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Card } from '../types/card'
import LatexRenderer from '../components/LatexRenderer'
import VariablesList from '../components/VariablesList'
import ProgressBar from '../components/ProgressBar'

interface FlashcardViewProps {
  cards: Card[]
}

type Phase = 'setup' | 'learning' | 'done'

export default function FlashcardView({ cards }: FlashcardViewProps) {
  const [phase, setPhase] = useState<Phase>('setup')
  const [deck, setDeck] = useState<Card[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [knownCount, setKnownCount] = useState(0)
  const [totalSeen, setTotalSeen] = useState(0)

  const totalCards = useMemo(() => deck.length, [deck])

  const currentCard = deck[currentIndex] ?? null

  const startLearning = useCallback(() => {
    if (cards.length === 0) return
    const shuffled = [...cards].sort(() => Math.random() - 0.5)
    setDeck(shuffled)
    setCurrentIndex(0)
    setIsFlipped(false)
    setKnownCount(0)
    setTotalSeen(0)
    setPhase('learning')
  }, [cards])

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev)
  }, [])

  const handleKnown = useCallback(() => {
    setKnownCount((prev) => prev + 1)
    setTotalSeen((prev) => prev + 1)
    setIsFlipped(false)

    if (currentIndex + 1 >= deck.length) {
      setPhase('done')
    } else {
      setCurrentIndex((prev) => prev + 1)
    }
  }, [currentIndex, deck.length])

  const handleAgain = useCallback(() => {
    setTotalSeen((prev) => prev + 1)
    setIsFlipped(false)

    // Move current card to end of deck
    setDeck((prev) => {
      const updated = [...prev]
      const card = updated.splice(currentIndex, 1)[0]
      updated.push(card)
      return updated
    })

    if (currentIndex >= deck.length - 1) {
      // Card was last, it's now re-appended, stay at same index but deck shifted
      setCurrentIndex(currentIndex)
    }
    // currentIndex stays the same since we removed the current card
    // and the next card slides into this position
  }, [currentIndex, deck.length])

  // Keyboard controls
  useEffect(() => {
    if (phase !== 'learning') return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault()
        handleFlip()
      } else if (e.key === 'ArrowRight' && isFlipped) {
        e.preventDefault()
        handleKnown()
      } else if (e.key === 'ArrowLeft' && isFlipped) {
        e.preventDefault()
        handleAgain()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [phase, isFlipped, handleFlip, handleKnown, handleAgain])

  // Setup phase
  if (phase === 'setup') {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-text-primary mb-2">Lernmodus</h2>
          <p className="text-sm text-text-secondary">
            {cards.length} {cards.length === 1 ? 'Karte' : 'Karten'} basierend auf den aktuellen Filtern.
          </p>
        </div>
        {cards.length > 0 ? (
          <button
            onClick={startLearning}
            className="px-8 py-3 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent-hover transition-colors"
          >
            Lernen starten
          </button>
        ) : (
          <p className="text-sm text-text-secondary">
            Keine Karten vorhanden. Importiere Karten oder passe die Filter an.
          </p>
        )}
      </div>
    )
  }

  // Done phase
  if (phase === 'done') {
    const percentage = totalCards > 0 ? Math.round((knownCount / totalCards) * 100) : 0
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-text-primary mb-2">Geschafft!</h2>
          <p className="text-sm text-text-secondary">
            {knownCount} von {totalCards} Karten beim ersten Mal gewusst ({percentage}%).
          </p>
          <p className="text-xs text-text-secondary mt-1">
            {totalSeen} Durchgänge insgesamt.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={startLearning}
            className="px-6 py-2.5 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent-hover transition-colors"
          >
            Nochmal lernen
          </button>
          <button
            onClick={() => setPhase('setup')}
            className="px-6 py-2.5 border border-border text-text-primary rounded-xl text-sm font-medium hover:bg-cream-light transition-colors"
          >
            Zurück
          </button>
        </div>
      </div>
    )
  }

  // Learning phase
  if (!currentCard) return null

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6">
      {/* Progress */}
      <ProgressBar current={currentIndex + 1} total={deck.length} />

      {/* Flashcard */}
      <div
        onClick={handleFlip}
        className="min-h-[400px] bg-card rounded-2xl border border-border p-8 flex flex-col items-center justify-center cursor-pointer select-none transition-all hover:shadow-md"
      >
        {!isFlipped ? (
          /* Front side - title only */
          <div className="text-center space-y-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent-light text-accent">
              {currentCard.type}
            </span>
            <h2 className="text-2xl font-semibold text-text-primary">
              {currentCard.title}
            </h2>
            <p className="text-xs text-text-secondary mt-8">
              Klicken oder Leertaste zum Umdrehen
            </p>
          </div>
        ) : (
          /* Back side - full content */
          <div className="w-full space-y-4">
            <h3 className="text-lg font-semibold text-text-primary text-center mb-2">
              {currentCard.title}
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed text-center">
              {currentCard.content}
            </p>

            {currentCard.latex && (
              <div className="py-4 px-6 bg-cream-light rounded-xl text-center">
                <LatexRenderer latex={currentCard.latex} displayMode />
              </div>
            )}

            {currentCard.variables && currentCard.variables.length > 0 && (
              <div className="px-4">
                <VariablesList variables={currentCard.variables} />
              </div>
            )}

            {currentCard.conditions && (
              <p className="text-xs italic text-text-secondary text-center">
                {currentCard.conditions}
              </p>
            )}

            {currentCard.type === 'Graph' && currentCard.axes && (
              <div className="text-xs text-text-secondary text-center space-y-0.5">
                <div>x-Achse: {currentCard.axes.x}</div>
                <div>y-Achse: {currentCard.axes.y}</div>
              </div>
            )}

            {currentCard.key_features && currentCard.key_features.length > 0 && (
              <ul className="text-xs text-text-secondary space-y-0.5 list-disc list-inside px-4">
                {currentCard.key_features.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            )}

            {currentCard.image && (
              <div className="flex justify-center">
                <img
                  src={currentCard.image}
                  alt={currentCard.image_description || currentCard.title}
                  className="max-h-48 rounded-lg border border-border"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action buttons - only show when flipped */}
      {isFlipped && (
        <div className="flex gap-4 justify-center">
          <button
            onClick={(e) => { e.stopPropagation(); handleAgain() }}
            className="flex-1 max-w-[200px] py-3 border border-border text-text-primary rounded-xl text-sm font-medium hover:bg-cream-light transition-colors"
          >
            Nochmal
            <span className="block text-xs text-text-secondary font-normal mt-0.5">← Pfeil links</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleKnown() }}
            className="flex-1 max-w-[200px] py-3 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent-hover transition-colors"
          >
            Gewusst
            <span className="block text-xs text-white/70 font-normal mt-0.5">Pfeil rechts →</span>
          </button>
        </div>
      )}

      {/* Keyboard hint */}
      <p className="text-center text-xs text-text-secondary/60">
        Leertaste = umdrehen · ← = nochmal · → = gewusst
      </p>
    </div>
  )
}
