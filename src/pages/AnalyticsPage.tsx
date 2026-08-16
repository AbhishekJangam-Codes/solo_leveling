import { format, subDays } from 'date-fns'
import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useApp } from '../context/AppContext'
import {
  computeRangeStats,
  computeStreaks,
  dateKey,
  generateInsights,
} from '../lib/analytics'
import { CATEGORIES, PRIORITIES, type GoalCategory, type Priority } from '../types'
import { categoryMeta, cn } from '../lib/utils'
import { ProgressRing } from '../components/ProgressRing'

type RangePreset = '7d' | '30d' | '90d' | 'custom'

const CHART_COLORS = ['#0F766E', '#0369A1', '#B45309', '#7C3AED']

export function AnalyticsPage() {
  const { state, viewingUser, isAdmin, resolvedTheme } = useApp()
  const [preset, setPreset] = useState<RangePreset>('30d')
  const [customStart, setCustomStart] = useState(dateKey(subDays(new Date(), 29)))
  const [customEnd, setCustomEnd] = useState(dateKey(new Date()))
  const [category, setCategory] = useState<GoalCategory | 'All'>('All')
  const [priority, setPriority] = useState<Priority | 'All'>('All')
  const [userId, setUserId] = useState(viewingUser.id)

  if (!isAdmin && userId !== viewingUser.id) {
    setUserId(viewingUser.id)
  }

  const activeUserId = isAdmin ? userId : viewingUser.id

  const { start, end } = useMemo(() => {
    const e = dateKey(new Date())
    if (preset === '7d') return { start: dateKey(subDays(new Date(), 6)), end: e }
    if (preset === '30d') return { start: dateKey(subDays(new Date(), 29)), end: e }
    if (preset === '90d') return { start: dateKey(subDays(new Date(), 89)), end: e }
    return { start: customStart, end: customEnd }
  }, [preset, customStart, customEnd])

  const prevStart = useMemo(() => {
    const days =
      (new Date(end + 'T12:00:00').getTime() -
        new Date(start + 'T12:00:00').getTime()) /
        86400000 +
      1
    return dateKey(subDays(new Date(start + 'T12:00:00'), days))
  }, [start, end])
  const prevEnd = dateKey(subDays(new Date(start + 'T12:00:00'), 1))

  const stats = useMemo(
    () =>
      computeRangeStats(state.goals, state.completions, activeUserId, start, end, {
        category,
        priority,
      }),
    [state.goals, state.completions, activeUserId, start, end, category, priority],
  )

  const prevStats = useMemo(
    () =>
      computeRangeStats(
        state.goals,
        state.completions,
        activeUserId,
        prevStart,
        prevEnd,
        { category, priority },
      ),
    [
      state.goals,
      state.completions,
      activeUserId,
      prevStart,
      prevEnd,
      category,
      priority,
    ],
  )

  const streaks = useMemo(
    () => computeStreaks(state.goals, state.completions, activeUserId),
    [state.goals, state.completions, activeUserId],
  )

  const insights = useMemo(
    () => generateInsights(state, activeUserId),
    [state, activeUserId],
  )

  const trendData = stats.days.map((d) => ({
    date: format(new Date(d.date + 'T12:00:00'), 'MMM d'),
    pct: d.total ? d.pct : null,
    completed: d.completed,
    missed: d.pending,
  }))

  const categoryData = (Object.keys(stats.byCategory) as GoalCategory[]).map(
    (c) => ({
      name: c,
      pct: stats.byCategory[c].pct,
      total: stats.byCategory[c].total,
      completed: stats.byCategory[c].completed,
    }),
  )

  const priorityData = PRIORITIES.map((p) => ({
    name: p,
    pct: stats.byPriority[p].pct,
    completed: stats.byPriority[p].completed,
    missed: stats.byPriority[p].total - stats.byPriority[p].completed,
  }))

  const pieData = [
    { name: 'Completed', value: stats.totalCompleted },
    { name: 'Missed', value: stats.totalMissed },
  ]

  const delta = stats.avgPct - prevStats.avgPct
  const axisColor = resolvedTheme === 'dark' ? '#9aa39a' : '#5c635c'
  const gridColor = resolvedTheme === 'dark' ? '#2a2e2a' : '#e4e2da'

  const bestHabits = stats.goalSuccess.filter((g) => g.total >= 3).slice(0, 5)
  const missedHabits = [...stats.goalSuccess]
    .filter((g) => g.total >= 3)
    .sort((a, b) => a.rate - b.rate)
    .slice(0, 5)

  // Weekly aggregation for weekly view chart
  const weeklyBuckets = useMemo(() => {
    const buckets: { label: string; pcts: number[] }[] = []
    let bucket: number[] = []
    let label = ''
    stats.days.forEach((d, i) => {
      if (i % 7 === 0) {
        if (bucket.length) {
          buckets.push({
            label,
            pcts: bucket,
          })
        }
        bucket = []
        label = format(new Date(d.date + 'T12:00:00'), 'MMM d')
      }
      if (d.total > 0) bucket.push(d.pct)
    })
    if (bucket.length) buckets.push({ label, pcts: bucket })
    return buckets.map((b) => ({
      week: b.label,
      pct: b.pcts.length
        ? Math.round(b.pcts.reduce((a, c) => a + c, 0) / b.pcts.length)
        : 0,
    }))
  }, [stats.days])

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-up">
      <div>
        <p className="text-sm font-medium text-[var(--color-accent)]">Analytics</p>
        <h1 className="font-display text-4xl tracking-tight md:text-5xl">
          Performance
        </h1>
        <p className="mt-1 text-[var(--color-ink-muted)]">
          Trends, category breakdowns, and data-driven insights
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['7d', '7 days'],
            ['30d', '30 days'],
            ['90d', '90 days'],
            ['custom', 'Custom'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setPreset(key)}
            className={cn(
              'rounded-xl px-3 py-2 text-sm font-medium',
              preset === key
                ? 'bg-[var(--color-accent)] text-white dark:text-teal-950'
                : 'border border-[var(--color-border)]',
            )}
          >
            {label}
          </button>
        ))}
        {preset === 'custom' && (
          <>
            <input
              type="date"
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
            />
            <input
              type="date"
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
            />
          </>
        )}
        {isAdmin && (
          <select
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          >
            {state.users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        )}
        <select
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm"
          value={category}
          onChange={(e) => setCategory(e.target.value as GoalCategory | 'All')}
        >
          <option value="All">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm"
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority | 'All')}
        >
          <option value="All">All priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="card flex items-center justify-center p-4 sm:col-span-2 lg:col-span-1">
          <ProgressRing value={stats.avgPct} size={110} sublabel="avg %" />
        </div>
        <Metric
          label="vs previous period"
          value={`${delta >= 0 ? '+' : ''}${delta}%`}
          tone={delta >= 0 ? 'good' : 'bad'}
        />
        <Metric label="Consistency" value={`${stats.consistencyScore}`} hint="/100" />
        <Metric label="Streak" value={`${streaks.current}d`} hint={`best ${streaks.best}d`} />
        <Metric
          label="Completed / missed"
          value={`${stats.totalCompleted}`}
          hint={`${stats.totalMissed} missed`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="font-display text-2xl">Daily completion trend</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="pctFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0F766E" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#0F766E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: axisColor, fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis domain={[0, 100]} tick={{ fill: axisColor, fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-surface-elevated)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="pct"
                  stroke="#0F766E"
                  fill="url(#pctFill)"
                  strokeWidth={2}
                  connectNulls
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="font-display text-2xl">Weekly completion %</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyBuckets}>
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
                <XAxis dataKey="week" tick={{ fill: axisColor, fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fill: axisColor, fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-surface-elevated)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 12,
                  }}
                />
                <Bar dataKey="pct" fill="#0F766E" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card p-5">
          <h2 className="font-display text-2xl">Category performance</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ left: 8 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fill: axisColor, fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ fill: axisColor, fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-surface-elevated)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 12,
                  }}
                />
                <Bar dataKey="pct" radius={[0, 6, 6, 0]}>
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="font-display text-2xl">Priority performance</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData}>
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 11 }} />
                <YAxis tick={{ fill: axisColor, fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-surface-elevated)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 12,
                  }}
                />
                <Legend />
                <Bar dataKey="completed" stackId="a" fill="#0F766E" name="Done" />
                <Bar dataKey="missed" stackId="a" fill="#e4e2da" name="Missed" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="font-display text-2xl">Completed vs missed</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  <Cell fill="#0F766E" />
                  <Cell fill="#f43f5e88" />
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-surface-elevated)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 12,
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="font-display text-2xl">Most successful habits</h2>
          <ul className="mt-4 space-y-2">
            {bestHabits.map((g) => {
              const Icon = categoryMeta[g.goal.category].icon
              return (
              <li
                key={g.goal.id}
                className="flex items-center justify-between rounded-xl border border-[var(--color-border)] px-3 py-2"
              >
                <span className="inline-flex items-center gap-2 text-sm font-medium">
                  <Icon className="h-4 w-4 text-[var(--color-ink-muted)]" />
                  {g.goal.name}
                </span>
                <span className="text-sm font-bold tabular-nums text-teal-700 dark:text-teal-300">
                  {g.rate}%
                </span>
              </li>
            )})}
            {!bestHabits.length && (
              <p className="text-sm text-[var(--color-ink-muted)]">Not enough data yet.</p>
            )}
          </ul>
        </section>
        <section className="card p-5">
          <h2 className="font-display text-2xl">Most frequently missed</h2>
          <ul className="mt-4 space-y-2">
            {missedHabits.map((g) => {
              const Icon = categoryMeta[g.goal.category].icon
              return (
              <li
                key={g.goal.id}
                className="flex items-center justify-between rounded-xl border border-[var(--color-border)] px-3 py-2"
              >
                <span className="inline-flex items-center gap-2 text-sm font-medium">
                  <Icon className="h-4 w-4 text-[var(--color-ink-muted)]" />
                  {g.goal.name}
                </span>
                <span className="text-sm font-bold tabular-nums text-rose-600 dark:text-rose-300">
                  {g.rate}%
                </span>
              </li>
            )})}
            {!missedHabits.length && (
              <p className="text-sm text-[var(--color-ink-muted)]">Not enough data yet.</p>
            )}
          </ul>
        </section>
      </div>

      <section className="card p-5">
        <h2 className="font-display text-2xl">Intelligent insights</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {insights.map((ins) => (
            <article
              key={ins.id}
              className={cn(
                'rounded-xl border p-4',
                ins.type === 'success' && 'border-teal-300/50 bg-teal-50/50 dark:bg-teal-950/30',
                ins.type === 'warning' && 'border-amber-300/50 bg-amber-50/50 dark:bg-amber-950/20',
                ins.type === 'tip' && 'border-sky-300/50 bg-sky-50/40 dark:bg-sky-950/20',
                ins.type === 'info' && 'border-[var(--color-border)]',
              )}
            >
              <p className="font-semibold">{ins.title}</p>
              <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{ins.detail}</p>
            </article>
          ))}
          {!insights.length && (
            <p className="text-sm text-[var(--color-ink-muted)]">
              Insights will appear once enough history exists.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}

function Metric({
  label,
  value,
  hint,
  tone,
}: {
  label: string
  value: string
  hint?: string
  tone?: 'good' | 'bad'
}) {
  return (
    <div className="card p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-muted)]">
        {label}
      </p>
      <p
        className={cn(
          'mt-2 text-3xl font-semibold tabular-nums',
          tone === 'good' && 'text-teal-700 dark:text-teal-300',
          tone === 'bad' && 'text-rose-600 dark:text-rose-300',
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-[var(--color-ink-muted)]">{hint}</p>}
    </div>
  )
}
