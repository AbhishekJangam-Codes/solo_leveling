import {
  addDays,
  format,
  subDays,
  differenceInCalendarDays,
  parseISO,
  isWithinInterval,
  startOfDay,
} from 'date-fns'
import type {
  AppState,
  CompletionRecord,
  Goal,
  GoalCategory,
  Priority,
} from './types'

export function dateKey(d: Date | string): string {
  if (typeof d === 'string') return d.slice(0, 10)
  return format(d, 'yyyy-MM-dd')
}

export function parseDate(d: string): Date {
  return startOfDay(parseISO(d))
}

export function isGoalActiveOnDate(goal: Goal, date: string): boolean {
  if (!goal.active) return false
  const d = parseDate(date)
  const start = parseDate(goal.startDate)
  if (d < start) return false
  if (goal.endDate && d > parseDate(goal.endDate)) return false

  if (goal.frequency === 'Daily') return true
  const day = d.getDay()
  return (goal.customDays ?? []).includes(day)
}

export function getGoalsForUserOnDate(
  goals: Goal[],
  userId: string,
  date: string,
): Goal[] {
  return goals.filter(
    (g) => g.userId === userId && isGoalActiveOnDate(g, date),
  )
}

export function getCompletion(
  completions: CompletionRecord[],
  goalId: string,
  date: string,
): CompletionRecord | undefined {
  return completions.find((c) => c.goalId === goalId && c.date === date)
}

export function isGoalCompleted(
  goal: Goal,
  completions: CompletionRecord[],
  date: string,
): boolean {
  const rec = getCompletion(completions, goal.id, date)
  if (!rec) return false
  if (goal.targetValue != null && goal.targetValue > 0) {
    return rec.completed && (rec.value ?? 0) >= goal.targetValue
  }
  return rec.completed
}

export interface DayStats {
  date: string
  total: number
  completed: number
  pending: number
  pct: number
  byCategory: Record<GoalCategory, { total: number; completed: number; pct: number }>
  byPriority: Record<Priority, { total: number; completed: number; pct: number }>
  highPriorityPending: Goal[]
  dailyScore: number
}

const emptyCat = (): Record<GoalCategory, { total: number; completed: number; pct: number }> => ({
  Diet: { total: 0, completed: 0, pct: 0 },
  Exercise: { total: 0, completed: 0, pct: 0 },
  'To-Do': { total: 0, completed: 0, pct: 0 },
  'Cleaning & Hygiene': { total: 0, completed: 0, pct: 0 },
})

const emptyPri = (): Record<Priority, { total: number; completed: number; pct: number }> => ({
  High: { total: 0, completed: 0, pct: 0 },
  Medium: { total: 0, completed: 0, pct: 0 },
  Low: { total: 0, completed: 0, pct: 0 },
})

export function computeDayStats(
  goals: Goal[],
  completions: CompletionRecord[],
  userId: string,
  date: string,
): DayStats {
  const dayGoals = getGoalsForUserOnDate(goals, userId, date)
  const byCategory = emptyCat()
  const byPriority = emptyPri()
  let completed = 0
  const highPriorityPending: Goal[] = []
  let weightedScore = 0
  let weightTotal = 0

  const priorityWeight: Record<Priority, number> = { High: 3, Medium: 2, Low: 1 }

  for (const g of dayGoals) {
    const done = isGoalCompleted(g, completions, date)
    if (done) completed += 1
    else if (g.priority === 'High') highPriorityPending.push(g)

    byCategory[g.category].total += 1
    byPriority[g.priority].total += 1
    if (done) {
      byCategory[g.category].completed += 1
      byPriority[g.priority].completed += 1
    }

    const w = priorityWeight[g.priority]
    weightTotal += w
    if (done) weightedScore += w
  }

  for (const c of Object.keys(byCategory) as GoalCategory[]) {
    const x = byCategory[c]
    x.pct = x.total ? Math.round((x.completed / x.total) * 100) : 0
  }
  for (const p of Object.keys(byPriority) as Priority[]) {
    const x = byPriority[p]
    x.pct = x.total ? Math.round((x.completed / x.total) * 100) : 0
  }

  const total = dayGoals.length
  const pct = total ? Math.round((completed / total) * 100) : 0
  const dailyScore = weightTotal
    ? Math.round((weightedScore / weightTotal) * 100)
    : 0

  return {
    date,
    total,
    completed,
    pending: total - completed,
    pct,
    byCategory,
    byPriority,
    highPriorityPending,
    dailyScore,
  }
}

export function computeStreaks(
  goals: Goal[],
  completions: CompletionRecord[],
  userId: string,
  asOf: string = dateKey(new Date()),
): { current: number; best: number } {
  let current = 0
  let best = 0
  let streak = 0
  const start = parseDate(asOf)
  // Look back up to 365 days
  for (let i = 0; i < 365; i++) {
    const d = dateKey(subDays(start, i))
    const stats = computeDayStats(goals, completions, userId, d)
    if (stats.total === 0) {
      if (i === 0) continue // today with no goals doesn't break streak yet
      continue
    }
    if (stats.pct >= 70) {
      streak += 1
      best = Math.max(best, streak)
    } else {
      if (i === 0 && stats.pct < 70) {
        // today incomplete — current streak based on yesterday onward
        current = 0
        streak = 0
        continue
      }
      if (current === 0 && i > 0) current = streak
      streak = 0
      if (current > 0 && i > 0) break
    }
  }
  if (current === 0) current = streak
  best = Math.max(best, current)
  return { current, best }
}

export interface RangeStats {
  days: DayStats[]
  avgPct: number
  totalCompleted: number
  totalMissed: number
  byCategory: Record<GoalCategory, { total: number; completed: number; pct: number }>
  byPriority: Record<Priority, { total: number; completed: number; pct: number }>
  consistencyScore: number
  goalSuccess: { goal: Goal; rate: number; completed: number; total: number }[]
}

export function computeRangeStats(
  goals: Goal[],
  completions: CompletionRecord[],
  userId: string,
  startDate: string,
  endDate: string,
  filters?: {
    category?: GoalCategory | 'All'
    priority?: Priority | 'All'
  },
): RangeStats {
  const start = parseDate(startDate)
  const end = parseDate(endDate)
  const days: DayStats[] = []
  const byCategory = emptyCat()
  const byPriority = emptyPri()
  const goalCounts = new Map<string, { completed: number; total: number; goal: Goal }>()

  const span = differenceInCalendarDays(end, start)
  for (let i = 0; i <= span; i++) {
    const d = dateKey(addDays(start, i))
    let dayGoals = getGoalsForUserOnDate(goals, userId, d)
    if (filters?.category && filters.category !== 'All') {
      dayGoals = dayGoals.filter((g) => g.category === filters.category)
    }
    if (filters?.priority && filters.priority !== 'All') {
      dayGoals = dayGoals.filter((g) => g.priority === filters.priority)
    }

    let completed = 0
    for (const g of dayGoals) {
      const done = isGoalCompleted(g, completions, d)
      if (done) completed += 1
      byCategory[g.category].total += 1
      byPriority[g.priority].total += 1
      if (done) {
        byCategory[g.category].completed += 1
        byPriority[g.priority].completed += 1
      }
      const prev = goalCounts.get(g.id) ?? { completed: 0, total: 0, goal: g }
      prev.total += 1
      if (done) prev.completed += 1
      goalCounts.set(g.id, prev)
    }
    const total = dayGoals.length
    const pct = total ? Math.round((completed / total) * 100) : 0
    days.push({
      date: d,
      total,
      completed,
      pending: total - completed,
      pct,
      byCategory: emptyCat(),
      byPriority: emptyPri(),
      highPriorityPending: [],
      dailyScore: pct,
    })
  }

  for (const c of Object.keys(byCategory) as GoalCategory[]) {
    const x = byCategory[c]
    x.pct = x.total ? Math.round((x.completed / x.total) * 100) : 0
  }
  for (const p of Object.keys(byPriority) as Priority[]) {
    const x = byPriority[p]
    x.pct = x.total ? Math.round((x.completed / x.total) * 100) : 0
  }

  const daysWithGoals = days.filter((d) => d.total > 0)
  const avgPct = daysWithGoals.length
    ? Math.round(
        daysWithGoals.reduce((s, d) => s + d.pct, 0) / daysWithGoals.length,
      )
    : 0
  const totalCompleted = days.reduce((s, d) => s + d.completed, 0)
  const totalMissed = days.reduce((s, d) => s + d.pending, 0)

  // Consistency: std-dev inverted — how stable daily pct is
  let consistencyScore = 0
  if (daysWithGoals.length > 1) {
    const mean = avgPct
    const variance =
      daysWithGoals.reduce((s, d) => s + (d.pct - mean) ** 2, 0) /
      daysWithGoals.length
    const std = Math.sqrt(variance)
    consistencyScore = Math.max(0, Math.round(100 - std))
  } else if (daysWithGoals.length === 1) {
    consistencyScore = daysWithGoals[0].pct
  }

  const goalSuccess = Array.from(goalCounts.values())
    .map(({ goal, completed, total }) => ({
      goal,
      completed,
      total,
      rate: total ? Math.round((completed / total) * 100) : 0,
    }))
    .sort((a, b) => b.rate - a.rate)

  return {
    days,
    avgPct,
    totalCompleted,
    totalMissed,
    byCategory,
    byPriority,
    consistencyScore,
    goalSuccess,
  }
}

export interface Insight {
  id: string
  type: 'warning' | 'success' | 'info' | 'tip'
  title: string
  detail: string
}

export function generateInsights(
  state: AppState,
  userId: string,
  asOf: Date = new Date(),
): Insight[] {
  const insights: Insight[] = []
  const today = dateKey(asOf)
  const weekStart = dateKey(subDays(asOf, 6))
  const prevWeekStart = dateKey(subDays(asOf, 13))
  const prevWeekEnd = dateKey(subDays(asOf, 7))
  const monthStart = dateKey(subDays(asOf, 29))
  const prevMonthStart = dateKey(subDays(asOf, 59))
  const prevMonthEnd = dateKey(subDays(asOf, 30))

  const thisWeek = computeRangeStats(
    state.goals,
    state.completions,
    userId,
    weekStart,
    today,
  )
  const lastWeek = computeRangeStats(
    state.goals,
    state.completions,
    userId,
    prevWeekStart,
    prevWeekEnd,
  )
  const thisMonth = computeRangeStats(
    state.goals,
    state.completions,
    userId,
    monthStart,
    today,
  )
  const lastMonth = computeRangeStats(
    state.goals,
    state.completions,
    userId,
    prevMonthStart,
    prevMonthEnd,
  )

  // Weekday vs weekend
  const weekendDays = thisMonth.days.filter((d) => {
    const day = parseDate(d.date).getDay()
    return day === 0 || day === 6
  })
  const weekdayDays = thisMonth.days.filter((d) => {
    const day = parseDate(d.date).getDay()
    return day !== 0 && day !== 6
  })
  const weekendAvg = avgOf(
    weekendDays.filter((d) => d.total > 0).map((d) => d.pct),
  )
  const weekdayAvg = avgOf(
    weekdayDays.filter((d) => d.total > 0).map((d) => d.pct),
  )

  if (weekendAvg != null && weekdayAvg != null && Math.abs(weekendAvg - weekdayAvg) >= 10) {
    if (weekendAvg > weekdayAvg) {
      insights.push({
        id: 'weekend-best',
        type: 'info',
        title: 'You perform best on weekends',
        detail: `Weekend completion averages ${weekendAvg}% vs ${weekdayAvg}% on weekdays. Consider lighter weekday goals or scheduling harder habits for Saturday/Sunday.`,
      })
    } else {
      insights.push({
        id: 'weekday-best',
        type: 'info',
        title: 'Weekdays outperform weekends',
        detail: `Weekday completion is ${weekdayAvg}% vs ${weekendAvg}% on weekends. Protect weekend routines with fewer, higher-impact goals.`,
      })
    }
  }

  // Category weekday misses for Exercise
  const exerciseWeekdayMiss = categoryWeekdayRate(
    state,
    userId,
    'Exercise',
    monthStart,
    today,
  )
  if (
    exerciseWeekdayMiss &&
    exerciseWeekdayMiss.weekdayPct < 55 &&
    exerciseWeekdayMiss.weekendPct - exerciseWeekdayMiss.weekdayPct >= 15
  ) {
    insights.push({
      id: 'exercise-weekday',
      type: 'warning',
      title: 'Exercise goals are consistently missed on weekdays',
      detail: `Exercise completion is ${exerciseWeekdayMiss.weekdayPct}% on weekdays vs ${exerciseWeekdayMiss.weekendPct}% on weekends. Try shorter weekday workouts or morning slots.`,
    })
  }

  // Category month-over-month
  for (const cat of ['Diet', 'Exercise', 'To-Do', 'Cleaning & Hygiene'] as GoalCategory[]) {
    const cur = thisMonth.byCategory[cat]
    const prev = lastMonth.byCategory[cat]
    if (cur.total >= 5 && prev.total >= 5) {
      const delta = cur.pct - prev.pct
      if (Math.abs(delta) >= 10) {
        insights.push({
          id: `cat-trend-${cat}`,
          type: delta > 0 ? 'success' : 'warning',
          title:
            delta > 0
              ? `${cat} goals have improved by ${delta}% this month`
              : `${cat} goals dropped by ${Math.abs(delta)}% this month`,
          detail:
            delta > 0
              ? `Keep the current ${cat.toLowerCase()} routine — it's working.`
              : `Review notes on missed ${cat.toLowerCase()} days and reduce friction for that habit.`,
        })
      }
    }
  }

  // High priority lower completion
  const high = thisMonth.byPriority.High
  const medium = thisMonth.byPriority.Medium
  if (high.total >= 5 && medium.total >= 5 && high.pct < medium.pct - 8) {
    insights.push({
      id: 'high-pri-low',
      type: 'warning',
      title: 'High-priority goals have a lower completion rate',
      detail: `High-priority goals are at ${high.pct}% vs Medium at ${medium.pct}%. Reassess what's truly high priority or break those goals into smaller steps.`,
    })
  }

  // Consistency drop last 7 days
  if (lastWeek.avgPct > 0 && thisWeek.avgPct < lastWeek.avgPct - 12) {
    insights.push({
      id: 'consistency-drop',
      type: 'warning',
      title: 'Your consistency dropped during the last 7 days',
      detail: `This week: ${thisWeek.avgPct}% vs last week: ${lastWeek.avgPct}%. Focus on 2–3 high-priority habits until the streak recovers.`,
    })
  } else if (thisWeek.avgPct > lastWeek.avgPct + 12 && lastWeek.avgPct > 0) {
    insights.push({
      id: 'consistency-up',
      type: 'success',
      title: 'Strong rebound this week',
      detail: `Completion rose from ${lastWeek.avgPct}% to ${thisWeek.avgPct}%. Lock in the habits that drove the improvement.`,
    })
  }

  // Most missed goal
  const missed = [...thisMonth.goalSuccess]
    .filter((g) => g.total >= 5)
    .sort((a, b) => a.rate - b.rate)[0]
  if (missed && missed.rate < 50) {
    insights.push({
      id: 'most-missed',
      type: 'tip',
      title: `"${missed.goal.name}" is frequently missed`,
      detail: `Only ${missed.rate}% completion over the last 30 days. Consider lowering the target, changing the time of day, or pausing it temporarily.`,
    })
  }

  // Most successful
  const best = thisMonth.goalSuccess.find((g) => g.total >= 5 && g.rate >= 85)
  if (best) {
    insights.push({
      id: 'most-success',
      type: 'success',
      title: `"${best.goal.name}" is one of your strongest habits`,
      detail: `${best.rate}% completion — use this as an anchor habit and stack a weaker goal right after it.`,
    })
  }

  // Low consistency score
  if (thisMonth.consistencyScore > 0 && thisMonth.consistencyScore < 55 && thisMonth.days.filter((d) => d.total > 0).length >= 10) {
    insights.push({
      id: 'low-consistency',
      type: 'tip',
      title: 'Day-to-day completion is volatile',
      detail: `Consistency score is ${thisMonth.consistencyScore}/100. Aim for a smaller fixed daily set rather than large swings between perfect and zero days.`,
    })
  }

  return insights.slice(0, 8)
}

function avgOf(nums: number[]): number | null {
  const valid = nums.filter((n) => !Number.isNaN(n))
  if (!valid.length) return null
  return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length)
}

function categoryWeekdayRate(
  state: AppState,
  userId: string,
  category: GoalCategory,
  start: string,
  end: string,
): { weekdayPct: number; weekendPct: number } | null {
  let wDone = 0,
    wTotal = 0,
    eDone = 0,
    eTotal = 0
  const s = parseDate(start)
  const e = parseDate(end)
  const span = differenceInCalendarDays(e, s)
  for (let i = 0; i <= span; i++) {
    const d = dateKey(addDays(s, i))
    const day = parseDate(d).getDay()
    const goals = getGoalsForUserOnDate(state.goals, userId, d).filter(
      (g) => g.category === category,
    )
    for (const g of goals) {
      const done = isGoalCompleted(g, state.completions, d)
      if (day === 0 || day === 6) {
        eTotal += 1
        if (done) eDone += 1
      } else {
        wTotal += 1
        if (done) wDone += 1
      }
    }
  }
  if (wTotal < 3 || eTotal < 2) return null
  return {
    weekdayPct: Math.round((wDone / wTotal) * 100),
    weekendPct: Math.round((eDone / eTotal) * 100),
  }
}

export function filterCompletionsInRange(
  completions: CompletionRecord[],
  start: string,
  end: string,
): CompletionRecord[] {
  const s = parseDate(start)
  const e = parseDate(end)
  return completions.filter((c) =>
    isWithinInterval(parseDate(c.date), { start: s, end: e }),
  )
}

export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`
}
