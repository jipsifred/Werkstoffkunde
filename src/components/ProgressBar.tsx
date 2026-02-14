interface ProgressBarProps {
  current: number
  total: number
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const percentage = total > 0 ? Math.min((current / total) * 100, 100) : 0

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-cream-light rounded-full overflow-hidden border border-border">
        <div
          className="h-full bg-accent rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm text-text-secondary tabular-nums whitespace-nowrap">
        {current} / {total}
      </span>
    </div>
  )
}
