import { useState, useCallback, useRef } from 'react'
import type { Card, CardCategory, CardImportData } from '../types/card'
import { useCardStore } from '../store/cardStore'

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
}

type ImportStrategy = 'replace_all' | 'skip_all'

interface ParsedImport {
  data: CardImportData
  cardCount: number
  topics: string[]
  duplicates: Card[]
}

export default function ImportModal({ isOpen, onClose }: ImportModalProps) {
  const importCards = useCardStore((s) => s.importCards)
  const existingCards = useCardStore((s) => s.cards)

  const [isDragging, setIsDragging] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [parseError, setParseError] = useState<string | null>(null)
  const [parsed, setParsed] = useState<ParsedImport | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<CardCategory>('Theorie')
  const [isImporting, setIsImporting] = useState(false)
  const [result, setResult] = useState<{ imported: number; duplicates: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const reset = useCallback(() => {
    setParsed(null)
    setParseError(null)
    setResult(null)
    setIsImporting(false)
    setPasteText('')
    setSelectedCategory('Theorie')
  }, [])

  const handleClose = useCallback(() => {
    reset()
    onClose()
  }, [onClose, reset])

  const validateAndParse = useCallback(
    (text: string) => {
      setParseError(null)
      setParsed(null)
      setResult(null)

      try {
        const data = JSON.parse(text) as CardImportData

        // Validate structure
        if (!data.cards || !Array.isArray(data.cards)) {
          setParseError('Ungültiges Format: "cards" Array fehlt.')
          return
        }

        if (data.cards.length === 0) {
          setParseError('Die Datei enthält keine Karten.')
          return
        }

        // Check each card has required fields (id is optional — auto-generated if missing)
        for (let i = 0; i < data.cards.length; i++) {
          const card = data.cards[i]
          if (!card.title || !card.topic || !card.type) {
            setParseError(
              `Karte ${i + 1} hat fehlende Pflichtfelder (title, topic, type).`,
            )
            return
          }
        }

        // Detect duplicates by matching on title+topic+type+category fingerprint
        const existingFingerprints = new Set(
          existingCards.map((c) => `${c.title}|||${c.topic}|||${c.type}|||${c.category}`),
        )

        const duplicates = data.cards.filter((c) =>
          existingFingerprints.has(`${c.title}|||${c.topic}|||${c.type}|||${selectedCategory}`),
        )

        const topics = Array.from(new Set(data.cards.map((c) => c.topic))).sort()

        setParsed({
          data,
          cardCount: data.cards.length,
          topics,
          duplicates,
        })
      } catch {
        setParseError('Die Datei konnte nicht als JSON gelesen werden.')
      }
    },
    [existingCards, selectedCategory],
  )

  const processFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith('.json')) {
        setParseError('Bitte nur JSON-Dateien verwenden.')
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        validateAndParse(reader.result as string)
      }
      reader.onerror = () => {
        setParseError('Fehler beim Lesen der Datei.')
      }
      reader.readAsText(file)
    },
    [validateAndParse],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file) processFile(file)
    },
    [processFile],
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) processFile(file)
    },
    [processFile],
  )

  const handleImport = useCallback(
    async (strategy: ImportStrategy) => {
      if (!parsed) return

      setIsImporting(true)

      try {
        let dataToImport = parsed.data

        if (strategy === 'skip_all' && parsed.duplicates.length > 0) {
          // Filter out duplicates
          const dupFingerprints = new Set(
            parsed.duplicates.map((c) => `${c.title}|||${c.topic}|||${c.type}|||${selectedCategory}`),
          )
          dataToImport = {
            ...parsed.data,
            cards: parsed.data.cards.filter(
              (c) => !dupFingerprints.has(`${c.title}|||${c.topic}|||${c.type}|||${selectedCategory}`),
            ),
          }
        }

        const importResult = await importCards(dataToImport, selectedCategory)
        setResult(importResult)
      } catch {
        setParseError('Fehler beim Importieren.')
      } finally {
        setIsImporting(false)
      }
    },
    [parsed, importCards, selectedCategory],
  )

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="bg-card rounded-2xl border border-border shadow-lg w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-text-primary">
              Karten importieren
            </h2>
            <button
              onClick={handleClose}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Import result */}
          {result && (
            <div className="space-y-4">
              <div className="bg-accent-light rounded-lg p-4">
                <p className="text-sm text-accent font-medium">
                  {result.imported} Karten erfolgreich importiert.
                </p>
                {result.duplicates > 0 && (
                  <p className="text-xs text-text-secondary mt-1">
                    {result.duplicates} Duplikate übersprungen.
                  </p>
                )}
              </div>
              <button
                onClick={handleClose}
                className="w-full py-2.5 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors"
              >
                Schließen
              </button>
            </div>
          )}

          {/* Preview */}
          {!result && parsed && (
            <div className="space-y-4">
              {/* Category selection */}
              <div>
                <p className="text-sm text-text-secondary mb-2">Kategorie für importierte Karten:</p>
                <div className="flex gap-2">
                  {(['Theorie', 'Klausuraufgaben'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedCategory === cat
                          ? 'bg-accent text-white'
                          : 'bg-cream-light border border-border text-text-primary hover:bg-border'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-cream-light rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Karten</span>
                  <span className="font-medium text-text-primary">{parsed.cardCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Themen</span>
                  <span className="font-medium text-text-primary">{parsed.topics.length}</span>
                </div>
                <div className="pt-1.5">
                  <div className="flex flex-wrap gap-1.5">
                    {parsed.topics.map((topic) => (
                      <span
                        key={topic}
                        className="px-2 py-0.5 bg-card border border-border rounded-full text-xs text-text-secondary"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Duplicates warning */}
              {parsed.duplicates.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800 font-medium mb-2">
                    {parsed.duplicates.length} Duplikate erkannt
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1 mb-3">
                    {parsed.duplicates.map((card) => (
                      <p key={card.id} className="text-xs text-amber-700">
                        {card.title} ({card.topic})
                      </p>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleImport('replace_all')}
                      disabled={isImporting}
                      className="flex-1 py-2 bg-accent text-white rounded-lg text-xs font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
                    >
                      Alle ersetzen
                    </button>
                    <button
                      onClick={() => handleImport('skip_all')}
                      disabled={isImporting}
                      className="flex-1 py-2 bg-card border border-border text-text-primary rounded-lg text-xs font-medium hover:bg-cream-light transition-colors disabled:opacity-50"
                    >
                      Duplikate überspringen
                    </button>
                  </div>
                </div>
              )}

              {/* Import / Cancel buttons (no duplicates case) */}
              {parsed.duplicates.length === 0 && (
                <div className="flex gap-3">
                  <button
                    onClick={handleClose}
                    className="flex-1 py-2.5 bg-card border border-border text-text-primary rounded-lg text-sm font-medium hover:bg-cream-light transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={() => handleImport('skip_all')}
                    disabled={isImporting}
                    className="flex-1 py-2.5 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
                  >
                    {isImporting ? 'Importiere...' : 'Importieren'}
                  </button>
                </div>
              )}

              {/* Back to file selection */}
              <button
                onClick={reset}
                className="text-xs text-text-secondary hover:text-accent transition-colors"
              >
                Andere Datei wählen
              </button>
            </div>
          )}

          {/* Drag & drop zone (no file parsed yet, no result) */}
          {!result && !parsed && (
            <div className="space-y-3">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-3 p-10 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-accent bg-accent-light'
                    : 'border-border hover:border-accent/40'
                }`}
              >
                <svg className="w-10 h-10 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <div className="text-center">
                  <p className="text-sm text-text-primary font-medium">
                    JSON-Datei hierher ziehen
                  </p>
                  <p className="text-xs text-text-secondary mt-1">
                    oder klicken zum Auswählen
                  </p>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-text-secondary">oder JSON einfügen</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Paste textarea */}
              <div className="space-y-2">
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder='{"metadata": {...}, "cards": [...]}'
                  rows={5}
                  className="w-full px-3 py-2.5 bg-cream-light border border-border rounded-lg text-xs font-mono text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent resize-y"
                />
                {pasteText.trim() && (
                  <button
                    onClick={() => validateAndParse(pasteText)}
                    className="w-full py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors"
                  >
                    JSON verarbeiten
                  </button>
                )}
              </div>

              {parseError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">{parseError}</p>
                </div>
              )}

              <button
                onClick={handleClose}
                className="w-full py-2.5 bg-card border border-border text-text-primary rounded-lg text-sm font-medium hover:bg-cream-light transition-colors"
              >
                Abbrechen
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
