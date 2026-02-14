import type { Variable } from '../types/card'
import LatexRenderer from './LatexRenderer'

interface VariablesListProps {
  variables: Variable[]
}

export default function VariablesList({ variables }: VariablesListProps) {
  if (variables.length === 0) return null

  return (
    <div className="mt-3 space-y-1.5">
      {variables.map((v, i) => (
        <div
          key={`${v.symbol}-${i}`}
          className="flex items-baseline gap-3 text-sm"
        >
          <span className="shrink-0 min-w-[2.5rem] text-right">
            <LatexRenderer latex={v.symbol} />
          </span>
          <span className="text-text-primary">{v.name}</span>
          <span className="text-text-secondary text-xs">({v.unit})</span>
        </div>
      ))}
    </div>
  )
}
