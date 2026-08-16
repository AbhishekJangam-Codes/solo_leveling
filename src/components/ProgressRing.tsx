import { cn } from '../lib/utils'

interface ProgressRingProps {
  value: number
  size?: number
  stroke?: number
  className?: string
  label?: string
  sublabel?: string
  color?: string
}

export function ProgressRing({
  value,
  size = 120,
  stroke = 10,
  className,
  label,
  sublabel,
  color = 'var(--color-accent)',
}: ProgressRingProps) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const pct = Math.min(100, Math.max(0, value))
  const offset = circ - (pct / 100) * circ

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-ring-track)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ ['--ring-circ' as string]: circ }}
          className="animate-ring transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-semibold tabular-nums tracking-tight">
          {label ?? `${pct}%`}
        </span>
        {sublabel && (
          <span className="text-xs text-[var(--color-ink-muted)]">{sublabel}</span>
        )}
      </div>
    </div>
  )
}
