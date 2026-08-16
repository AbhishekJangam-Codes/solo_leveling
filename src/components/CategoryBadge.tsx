import type { GoalCategory } from '../types'
import { categoryMeta, cn } from '../lib/utils'

export function CategoryBadge({
  category,
  compact,
}: {
  category: GoalCategory
  compact?: boolean
}) {
  const meta = categoryMeta[category]
  const Icon = meta.icon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium',
        meta.bg,
        meta.color,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {!compact && category}
    </span>
  )
}
