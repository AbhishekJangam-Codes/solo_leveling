import type { Priority } from '../types'
import { cn, priorityMeta } from '../lib/utils'

export function PriorityBadge({ priority }: { priority: Priority }) {
  const meta = priorityMeta[priority]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium',
        meta.className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {priority}
    </span>
  )
}
