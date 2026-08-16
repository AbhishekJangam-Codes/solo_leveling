import { format, subDays } from 'date-fns'
import { Flame, Trophy, Zap, AlertTriangle } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import {
  computeDayStats,
  computeStreaks,
  dateKey,
  generateInsights,
  getGoalsForUserOnDate,
} from '../lib/analytics'
import { ProgressRing } from '../components/ProgressRing'
import { GoalCheckRow } from '../components/GoalCheckRow'
import { categoryMeta, cn } from '../lib/utils'
import type { GoalCategory } from '../types'

type DatePreset = 'today' | 'yesterday' | 'custom'

export function DashboardPage() {
  const { state, viewingUser } = useApp()
  const [preset, setPreset] = useState<DatePreset>('today')
  const [customDate, setCustomDate] = useState(dateKey(new Date()))

  const selectedDate =
    preset === 'today'
      ? dateKey(new Date())
      : preset === 'yesterday'
        ? dateKey(subDays(new Date(), 1))
        : customDate

  const stats = useMemo(
    () =>
      computeDayStats(
        state.goals,
        state.completions,
        viewingUser.id,
        selectedDate,
      ),
    [state.goals, state.completions, viewingUser.id, selectedDate],
  )

  const streaks = useMemo(
    () =>
      computeStreaks(state.goals, state.completions, viewingUser.id, selectedDate),
    [state.goals, state.completions, viewingUser.id, selectedDate],
  )

  const goals = useMemo(
    () => getGoalsForUserOnDate(state.goals, viewingUser.id, selectedDate),
    [state.goals, viewingUser.id, selectedDate],
  )

  const insights = useMemo(
    () => generateInsights(state, viewingUser.id),
    [state, viewingUser.id],
  )

  const displayDate = format(new Date(selectedDate + 'T12:00:00'), 'EEEE, MMMM d, yyyy')

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-up">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--color-accent)]">Dashboard</p>
          <h1 className="font-display text-4xl tracking-tight md:text-5xl">
            {viewingUser.name.split(' ')[0]}&apos;s day
          </h1>
          <p className="mt-1 text-[var(--color-ink-muted)]">{displayDate}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              ['today', 'Today'],
              ['yesterday', 'Yesterday'],
              ['custom', 'Custom'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setPreset(key)}
              className={cn(
                'rounded-xl px-3 py-2 text-sm font-medium transition',
                preset === key
                  ? 'bg-[var(--color-accent)] text-white dark:text-teal-950'
                  : 'border border-[var(--color-border)] hover:bg-[var(--color-surface-elevated)]',
              )}
            >
              {label}
            </button>
          ))}
          {preset === 'custom' && (
            <input
              type="date"
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
            />
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card flex items-center gap-4 p-5 sm:col-span-2 lg:col-span-1 lg:row-span-2 lg:flex-col lg:justify-center">
          <ProgressRing value={stats.pct} size={140} stroke={12} sublabel="complete" />
          <div className="lg:text-center">
            <p className="text-sm text-[var(--color-ink-muted)]">Overall completion</p>
            <p className="text-lg font-semibold">
              {stats.completed}/{stats.total} goals
            </p>
          </div>
        </div>

        <StatCard
          icon={<Zap className="h-4 w-4" />}
          label="Daily score"
          value={`${stats.dailyScore}`}
          hint="Priority-weighted"
        />
        <StatCard
          icon={<Flame className="h-4 w-4 text-orange-500" />}
          label="Current streak"
          value={`${streaks.current}d`}
          hint="≥70% days"
        />
        <StatCard
          icon={<Trophy className="h-4 w-4 text-amber-500" />}
          label="Best streak"
          value={`${streaks.best}d`}
          hint="All-time"
        />
        <StatCard
          icon={<AlertTriangle className="h-4 w-4 text-rose-500" />}
          label="Pending"
          value={`${stats.pending}`}
          hint={`${stats.highPriorityPending.length} high priority`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl">Category progress</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {(Object.keys(stats.byCategory) as GoalCategory[]).map((cat) => {
              const c = stats.byCategory[cat]
              const meta = categoryMeta[cat]
              const Icon = meta.icon
              return (
                <div
                  key={cat}
                  className={cn('rounded-xl p-4', meta.bg)}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn('inline-flex items-center gap-1.5 text-sm font-semibold', meta.color)}>
                      <Icon className="h-4 w-4" />
                      {cat}
                    </span>
                    <span className="text-sm font-bold tabular-nums">{c.pct}%</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                    <div
                      className={cn('h-full rounded-full transition-all', meta.darkBg)}
                      style={{ width: `${c.pct}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-[var(--color-ink-muted)]">
                    {c.completed}/{c.total} done
                  </p>
                </div>
              )
            })}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="font-display text-2xl">Insights</h2>
          <ul className="mt-4 space-y-3">
            {insights.slice(0, 3).map((ins) => (
              <li
                key={ins.id}
                className="rounded-xl border border-[var(--color-border)] p-3"
              >
                <p className="text-sm font-semibold">{ins.title}</p>
                <p className="mt-1 text-xs text-[var(--color-ink-muted)] line-clamp-3">
                  {ins.detail}
                </p>
              </li>
            ))}
            {!insights.length && (
              <p className="text-sm text-[var(--color-ink-muted)]">
                Keep tracking — insights appear as patterns emerge.
              </p>
            )}
            <Link
              to="/analytics"
              className="inline-block text-sm font-medium text-[var(--color-accent)]"
            >
              View full analytics →
            </Link>
          </ul>
        </section>
      </div>

      {stats.highPriorityPending.length > 0 && (
        <section className="card border-rose-200/60 p-5 dark:border-rose-900/40">
          <h2 className="font-display text-2xl text-rose-700 dark:text-rose-300">
            High-priority pending
          </h2>
          <div className="mt-4 space-y-2">
            {stats.highPriorityPending.map((g) => (
              <GoalCheckRow key={g.id} goal={g} date={selectedDate} />
            ))}
          </div>
        </section>
      )}

      <section className="card p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="font-display text-2xl">Quick mark complete</h2>
          <Link to="/goals" className="text-sm font-medium text-[var(--color-accent)]">
            Manage goals
          </Link>
        </div>
        <div className="space-y-2">
          {goals.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-muted)]">
              No goals scheduled for this day.
            </p>
          ) : (
            goals.map((g) => <GoalCheckRow key={g.id} goal={g} date={selectedDate} />)
          )}
        </div>
      </section>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode
  label: string
  value: string
  hint: string
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 text-[var(--color-ink-muted)]">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-[var(--color-ink-muted)]">{hint}</p>
    </div>
  )
}
