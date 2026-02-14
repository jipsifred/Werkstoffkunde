import { useMemo } from 'react'
import katex from 'katex'

interface LatexRendererProps {
  latex: string
  displayMode?: boolean
}

export default function LatexRenderer({ latex, displayMode = false }: LatexRendererProps) {
  const rendered = useMemo(() => {
    try {
      return {
        html: katex.renderToString(latex, {
          displayMode,
          throwOnError: true,
          trust: true,
        }),
        error: null,
      }
    } catch (err) {
      return {
        html: null,
        error: err instanceof Error ? err.message : 'LaTeX render error',
      }
    }
  }, [latex, displayMode])

  if (rendered.error) {
    return (
      <span
        className="font-mono text-sm text-red-600 bg-red-50 px-1.5 py-0.5 rounded"
        title={rendered.error}
      >
        {latex}
      </span>
    )
  }

  return (
    <span
      dangerouslySetInnerHTML={{ __html: rendered.html! }}
    />
  )
}
