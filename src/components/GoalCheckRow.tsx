import { Check, Circle } from 'lucide-react'
import type { Goal } from '../types'
import { useApp } from '../context/AppContext'
import { getCompletion, isGoalCompleted } from '../lib/analytics'
import { CategoryBadge } from './CategoryBadge'
import { PriorityBadge } from './PriorityBadge'
import { cn } from '../lib/utils'

export function GoalCheckRow({
  goal,
  date,
  showValue,
}: {
  goal: Goal
  date: string
  showValue?: boolean
}) {
  const { state, toggleComplete, upsertCompletion } = useApp()
  const done = isGoalCompleted(goal, state.completions, date)
  const rec = getCompletion(state.completions, goal.id, date)
  const hasTarget = goal.targetValue != null && goal.targetValue > 0

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-3 transition',
        done && 'opacity-80',
      )}
    >
      <button
        type="button"
        onClick={() => toggleComplete(goal.id, date)}
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition',
          done
            ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white dark:text-teal-950'
            : 'border-[var(--color-border)] text-[var(--color-ink-muted)] hover:border-[var(--color-accent)]',
        )}
        aria-label={done ? 'Mark incomplete' : 'Mark complete'}
      >
        {done ? <Check className="h-4 w-4" /> : <Circle className="h-4 w-4 opacity-0" />}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className={cn('font-medium', done && 'line-through text-[var(--color-ink-muted)]')}>
            {goal.name}
          </p>
          <PriorityBadge priority={goal.priority} />
          <CategoryBadge category={goal.category} compact />
        </div>
        {hasTarget && showValue !== false && (
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              min={0}
              step="any"
              className="w-24 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-sm"
              value={rec?.value ?? ''}
              placeholder="0"
              onChange={(e) => {
                const value = e.target.value === '' ? undefined : Number(e.target.value)
                const completed =
                  value != null && goal.targetValue != null
                    ? value >= goal.targetValue
                    : Boolean(rec?.completed)
                upsertCompletion(goal.id, date, {
                  completed,
                  value,
                  notes: rec?.notes,
                })
              }}
            />
            <span className="text-xs text-[var(--color-ink-muted)]">
              / {goal.targetValue} {goal.unit}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
