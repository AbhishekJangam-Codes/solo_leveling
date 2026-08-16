import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
  type Day,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import {
  computeDayStats,
  dateKey,
  getGoalsForUserOnDate,
} from '../lib/analytics'
import { GoalCheckRow } from '../components/GoalCheckRow'
import { cn } from '../lib/utils'
import { btnGhost } from '../components/ui'

export function CalendarPage() {
  const { state, viewingUser } = useApp()
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [selected, setSelected] = useState(dateKey(new Date()))
  const weekStartsOn = state.settings.weekStartsOn as Day

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn })
    const end = endOfWeek(endOfMonth(month), { weekStartsOn })
    return eachDayOfInterval({ start, end })
  }, [month, weekStartsOn])

  const dayStats = useMemo(() => {
    const map = new Map<string, ReturnType<typeof computeDayStats>>()
    for (const d of days) {
      const key = dateKey(d)
      map.set(
        key,
        computeDayStats(state.goals, state.completions, viewingUser.id, key),
      )
    }
    return map
  }, [days, state.goals, state.completions, viewingUser.id])

  const selectedGoals = getGoalsForUserOnDate(
    state.goals,
    viewingUser.id,
    selected,
  )
  const selectedStats = dayStats.get(selected)

  const weekdays = useMemo(() => {
    const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    if (weekStartsOn === 1) return [...labels.slice(1), labels[0]]
    return labels
  }, [weekStartsOn])

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-up">
      <div>
        <p className="text-sm font-medium text-[var(--color-accent)]">Calendar</p>
        <h1 className="font-display text-4xl tracking-tight md:text-5xl">
          Monthly view
        </h1>
        <p className="mt-1 text-[var(--color-ink-muted)]">
          Historical completion is preserved — past days are never overwritten
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="card p-4 sm:p-5 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl">
              {format(month, 'MMMM yyyy')}
            </h2>
            <div className="flex gap-1">
              <button
                type="button"
                className={btnGhost + ' !p-2'}
                onClick={() => setMonth((m) => subMonths(m, 1))}
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={btnGhost + ' !px-3 !py-2 text-xs'}
                onClick={() => {
                  const now = new Date()
                  setMonth(startOfMonth(now))
                  setSelected(dateKey(now))
                }}
              >
                Today
              </button>
              <button
                type="button"
                className={btnGhost + ' !p-2'}
                onClick={() => setMonth((m) => addMonths(m, 1))}
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-[var(--color-ink-muted)]">
            {weekdays.map((d) => (
              <div key={d} className="py-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((d) => {
              const key = dateKey(d)
              const stats = dayStats.get(key)!
              const inMonth = isSameMonth(d, month)
              const isSelected = key === selected
              const tone =
                stats.total === 0
                  ? 'bg-transparent'
                  : stats.pct >= 80
                    ? 'bg-teal-500/25 dark:bg-teal-400/20'
                    : stats.pct >= 50
                      ? 'bg-amber-400/25 dark:bg-amber-400/15'
                      : 'bg-rose-400/20 dark:bg-rose-400/15'

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelected(key)}
                  className={cn(
                    'aspect-square rounded-xl p-1 text-left transition hover:ring-2 hover:ring-[var(--color-accent)]/40',
                    tone,
                    isSelected && 'ring-2 ring-[var(--color-accent)]',
                    !inMonth && 'opacity-35',
                  )}
                >
                  <span className="text-xs font-semibold tabular-nums">
                    {format(d, 'd')}
                  </span>
                  {stats.total > 0 && (
                    <span className="mt-auto block text-[10px] tabular-nums text-[var(--color-ink-muted)]">
                      {stats.pct}%
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-3 text-xs text-[var(--color-ink-muted)]">
            <Legend color="bg-teal-500/40" label="≥80%" />
            <Legend color="bg-amber-400/40" label="50–79%" />
            <Legend color="bg-rose-400/40" label="<50%" />
          </div>
        </section>

        <section className="card p-5 lg:col-span-2">
          <h2 className="font-display text-2xl">
            {format(new Date(selected + 'T12:00:00'), 'EEE, MMM d')}
          </h2>
          {selectedStats && (
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
              {selectedStats.completed}/{selectedStats.total} complete · score{' '}
              {selectedStats.dailyScore}
            </p>
          )}
          <div className="mt-4 max-h-[28rem] space-y-2 overflow-y-auto scrollbar-thin">
            {selectedGoals.length === 0 ? (
              <p className="text-sm text-[var(--color-ink-muted)]">
                No goals on this day.
              </p>
            ) : (
              selectedGoals.map((g) => (
                <GoalCheckRow key={g.id} goal={g} date={selected} />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('h-3 w-3 rounded', color)} />
      {label}
    </span>
  )
}
