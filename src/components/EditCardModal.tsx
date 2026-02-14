import { useState, useEffect } from 'react'
import type { Card, CardType, Variable } from '../types/card'
import { useCardStore } from '../store/cardStore'
import LatexRenderer from './LatexRenderer'
import ImageUpload from './ImageUpload'

interface EditCardModalProps {
  card: Card
  onClose: () => void
}

const CARD_TYPES: CardType[] = ['Formel', 'Definition', 'Graph', 'Erklärung']

export default function EditCardModal({ card, onClose }: EditCardModalProps) {
  const updateCard = useCardStore((s) => s.updateCard)
  const deleteCard = useCardStore((s) => s.deleteCard)
  const topics = useCardStore((s) => s.getTopics())

  const [title, setTitle] = useState(card.title)
  const [topic, setTopic] = useState(card.topic)
  const [type, setType] = useState<CardType>(card.type)
  const [content, setContent] = useState(card.content)
  const [latex, setLatex] = useState(card.latex || '')
  const [variables, setVariables] = useState<Variable[]>(card.variables || [])
  const [conditions, setConditions] = useState(card.conditions || '')
  const [imageNeeded, setImageNeeded] = useState(card.image_needed)
  const [image, setImage] = useState<string | null>(card.image)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const handleSave = async () => {
    await updateCard(card.id, {
      title,
      topic,
      type,
      content,
      latex: latex || undefined,
      variables: variables.length > 0 ? variables : undefined,
      conditions: conditions || null,
      image_needed: imageNeeded,
      image,
    })
    onClose()
  }

  const handleDelete = async () => {
    await deleteCard(card.id)
    onClose()
  }

  const addVariable = () => {
    setVariables([...variables, { symbol: '', name: '', unit: '' }])
  }

  const updateVariable = (index: number, field: keyof Variable, value: string) => {
    const updated = [...variables]
    updated[index] = { ...updated[index], [field]: value }
    setVariables(updated)
  }

  const removeVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-2xl border border-border shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">Karte bearbeiten</h2>
            <span className="text-xs text-text-secondary font-mono">{card.id}</span>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Titel</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-cream-light border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* Topic & Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Thema</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                list="topics-list"
                className="w-full px-3 py-2 bg-cream-light border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              />
              <datalist id="topics-list">
                {topics.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Typ</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as CardType)}
                className="w-full px-3 py-2 bg-cream-light border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              >
                {CARD_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Inhalt</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-cream-light border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent resize-y"
            />
          </div>

          {/* LaTeX with live preview */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">LaTeX-Formel</label>
            <textarea
              value={latex}
              onChange={(e) => setLatex(e.target.value)}
              rows={2}
              placeholder="\sigma = \frac{F}{S_0}"
              className="w-full px-3 py-2 bg-cream-light border border-border rounded-lg text-sm font-mono text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent resize-y"
            />
            {latex && (
              <div className="mt-2 p-3 bg-cream-light rounded-lg text-center">
                <LatexRenderer latex={latex} displayMode />
              </div>
            )}
          </div>

          {/* Variables */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-text-secondary">Variablen</label>
              <button
                type="button"
                onClick={addVariable}
                className="text-xs text-accent hover:text-accent-hover transition-colors"
              >
                + Variable hinzufügen
              </button>
            </div>
            {variables.map((v, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={v.symbol}
                  onChange={(e) => updateVariable(i, 'symbol', e.target.value)}
                  placeholder="\\sigma"
                  className="w-24 px-2 py-1.5 bg-cream-light border border-border rounded-lg text-xs font-mono text-text-primary focus:outline-none focus:border-accent"
                />
                <input
                  type="text"
                  value={v.name}
                  onChange={(e) => updateVariable(i, 'name', e.target.value)}
                  placeholder="Name"
                  className="flex-1 px-2 py-1.5 bg-cream-light border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:border-accent"
                />
                <input
                  type="text"
                  value={v.unit}
                  onChange={(e) => updateVariable(i, 'unit', e.target.value)}
                  placeholder="Einheit"
                  className="w-20 px-2 py-1.5 bg-cream-light border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:border-accent"
                />
                <button
                  type="button"
                  onClick={() => removeVariable(i)}
                  className="text-text-secondary hover:text-red-500 transition-colors shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Conditions */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Bedingungen</label>
            <input
              type="text"
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
              placeholder="z.B. Gilt nur im linear-elastischen Bereich."
              className="w-full px-3 py-2 bg-cream-light border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* Image needed toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={imageNeeded}
              onChange={(e) => setImageNeeded(e.target.checked)}
              className="w-4 h-4 accent-accent"
            />
            <span className="text-sm text-text-primary">Bild benötigt</span>
          </label>

          {/* Image upload */}
          <ImageUpload
            cardId={card.id}
            currentImage={image}
            onUpload={setImage}
          />

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div>
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-sm text-red-500 hover:text-red-700 transition-colors"
                >
                  Karte löschen
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-500">Wirklich löschen?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Ja
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1 text-sm text-text-secondary hover:text-text-primary transition-colors"
                  >
                    Nein
                  </button>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-text-secondary border border-border rounded-lg hover:bg-cream-light transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 text-sm text-white bg-accent rounded-lg hover:bg-accent-hover transition-colors"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
