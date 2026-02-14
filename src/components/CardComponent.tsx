import type { Card, CardType } from '../types/card'
import LatexRenderer from './LatexRenderer'
import VariablesList from './VariablesList'

interface CardComponentProps {
  card: Card
  onEdit?: (card: Card) => void
}

const TYPE_STYLES: Record<CardType, string> = {
  Formel: 'bg-accent-light text-accent',
  Definition: 'bg-cream-light text-text-secondary border border-border',
  Graph: 'bg-cream-light text-text-secondary border border-border',
  'Erklärung': 'bg-cream-light text-text-secondary border border-border',
}

export default function CardComponent({ card, onEdit }: CardComponentProps) {
  return (
    <div
      onClick={() => onEdit?.(card)}
      className="bg-card rounded-xl border border-border p-6 hover:border-accent/40 transition-colors cursor-pointer"
    >
      {/* Header: type tag + title */}
      <div className="flex items-start gap-3 mb-3">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 ${
            TYPE_STYLES[card.type] || 'bg-cream-light text-text-secondary'
          }`}
        >
          {card.type}
        </span>
        <h3 className="font-semibold text-lg text-text-primary leading-tight">
          {card.title}
        </h3>
      </div>

      {/* Content */}
      <p className="text-sm text-text-secondary mb-3 leading-relaxed">
        {card.content}
      </p>

      {/* LaTeX formula */}
      {card.latex && (
        <div className="my-4 py-3 px-4 bg-cream-light rounded-lg text-center">
          <LatexRenderer latex={card.latex} displayMode />
        </div>
      )}

      {/* Variables list */}
      {card.variables && card.variables.length > 0 && (
        <VariablesList variables={card.variables} />
      )}

      {/* Conditions */}
      {card.conditions && (
        <p className="mt-3 text-xs italic text-text-secondary">
          {card.conditions}
        </p>
      )}

      {/* Graph axes info */}
      {card.type === 'Graph' && card.axes && (
        <div className="mt-3 text-xs text-text-secondary space-y-0.5">
          <div>x-Achse: {card.axes.x}</div>
          <div>y-Achse: {card.axes.y}</div>
        </div>
      )}

      {/* Key features for graphs */}
      {card.key_features && card.key_features.length > 0 && (
        <div className="mt-3">
          <ul className="text-xs text-text-secondary space-y-0.5 list-disc list-inside">
            {card.key_features.map((feature, i) => (
              <li key={i}>{feature}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Image */}
      {card.image && (
        <div className="mt-4">
          <img
            src={card.image}
            alt={card.image_description || card.title}
            className="w-full rounded-lg border border-border"
          />
        </div>
      )}

      {/* Image needed indicator */}
      {card.image_needed && !card.image && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-text-secondary">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>Bild wird benötigt</span>
        </div>
      )}
    </div>
  )
}
