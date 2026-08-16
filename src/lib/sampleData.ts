import { format, subDays } from 'date-fns'
import type { AppState, CompletionRecord, Goal, User } from '../types'
import { uid } from './analytics'

const today = new Date()
const dk = (d: Date) => format(d, 'yyyy-MM-dd')

export function createSampleData(): AppState {
  const admin: User = {
    id: 'user_admin',
    name: 'Alex Rivera',
    email: 'alex@pulsetrack.app',
    role: 'admin',
    active: true,
    avatarColor: '#0F766E',
    createdAt: dk(subDays(today, 90)),
  }

  const jordan: User = {
    id: 'user_jordan',
    name: 'Jordan Lee',
    email: 'jordan@example.com',
    role: 'user',
    active: true,
    avatarColor: '#B45309',
    createdAt: dk(subDays(today, 60)),
  }

  const sam: User = {
    id: 'user_sam',
    name: 'Sam Patel',
    email: 'sam@example.com',
    role: 'user',
    active: true,
    avatarColor: '#1D4ED8',
    createdAt: dk(subDays(today, 45)),
  }

  const morgan: User = {
    id: 'user_morgan',
    name: 'Morgan Chen',
    email: 'morgan@example.com',
    role: 'user',
    active: false,
    avatarColor: '#BE123C',
    createdAt: dk(subDays(today, 30)),
  }

  const users = [admin, jordan, sam, morgan]

  const mkGoal = (
    partial: Omit<Goal, 'createdAt' | 'updatedAt' | 'active' | 'notes'> & {
      active?: boolean
      notes?: string
    },
  ): Goal => ({
    active: true,
    createdAt: partial.startDate,
    updatedAt: partial.startDate,
    notes: '',
    ...partial,
  })

  const alexGoals: Goal[] = [
    mkGoal({
      id: 'g_alex_water',
      userId: admin.id,
      name: 'Drink 3L water',
      category: 'Diet',
      priority: 'High',
      frequency: 'Daily',
      targetValue: 3,
      unit: 'liters',
      startDate: dk(subDays(today, 60)),
      notes: 'Spread across the day',
    }),
    mkGoal({
      id: 'g_alex_protein',
      userId: admin.id,
      name: 'Hit protein target',
      category: 'Diet',
      priority: 'Medium',
      frequency: 'Daily',
      targetValue: 120,
      unit: 'grams',
      startDate: dk(subDays(today, 45)),
      notes: '',
    }),
    mkGoal({
      id: 'g_alex_workout',
      userId: admin.id,
      name: 'Workout',
      category: 'Exercise',
      priority: 'High',
      frequency: 'Custom',
      customDays: [1, 2, 3, 4, 5],
      startDate: dk(subDays(today, 60)),
      notes: 'Gym or home — 45 min',
    }),
    mkGoal({
      id: 'g_alex_walk',
      userId: admin.id,
      name: 'Walk 8,000 steps',
      category: 'Exercise',
      priority: 'Medium',
      frequency: 'Daily',
      targetValue: 8000,
      unit: 'steps',
      startDate: dk(subDays(today, 40)),
    }),
    mkGoal({
      id: 'g_alex_read',
      userId: admin.id,
      name: 'Read 30 minutes',
      category: 'To-Do',
      priority: 'Medium',
      frequency: 'Daily',
      targetValue: 30,
      unit: 'minutes',
      startDate: dk(subDays(today, 50)),
    }),
    mkGoal({
      id: 'g_alex_inbox',
      userId: admin.id,
      name: 'Clear inbox to zero',
      category: 'To-Do',
      priority: 'Low',
      frequency: 'Custom',
      customDays: [1, 3, 5],
      startDate: dk(subDays(today, 35)),
    }),
    mkGoal({
      id: 'g_alex_floss',
      userId: admin.id,
      name: 'Floss & skincare',
      category: 'Cleaning & Hygiene',
      priority: 'High',
      frequency: 'Daily',
      startDate: dk(subDays(today, 60)),
    }),
    mkGoal({
      id: 'g_alex_tidy',
      userId: admin.id,
      name: 'Tidy desk & kitchen',
      category: 'Cleaning & Hygiene',
      priority: 'Low',
      frequency: 'Custom',
      customDays: [0, 6],
      startDate: dk(subDays(today, 30)),
    }),
  ]

  const jordanGoals: Goal[] = [
    mkGoal({
      id: 'g_jor_veg',
      userId: jordan.id,
      name: 'Eat 5 servings of veggies',
      category: 'Diet',
      priority: 'High',
      frequency: 'Daily',
      targetValue: 5,
      unit: 'servings',
      startDate: dk(subDays(today, 40)),
    }),
    mkGoal({
      id: 'g_jor_run',
      userId: jordan.id,
      name: 'Run 5K',
      category: 'Exercise',
      priority: 'High',
      frequency: 'Custom',
      customDays: [1, 3, 5],
      targetValue: 5,
      unit: 'km',
      startDate: dk(subDays(today, 40)),
    }),
    mkGoal({
      id: 'g_jor_meditate',
      userId: jordan.id,
      name: 'Meditate 10 minutes',
      category: 'To-Do',
      priority: 'Medium',
      frequency: 'Daily',
      targetValue: 10,
      unit: 'minutes',
      startDate: dk(subDays(today, 35)),
    }),
    mkGoal({
      id: 'g_jor_laundry',
      userId: jordan.id,
      name: 'Laundry / tidy room',
      category: 'Cleaning & Hygiene',
      priority: 'Low',
      frequency: 'Custom',
      customDays: [0],
      startDate: dk(subDays(today, 28)),
    }),
  ]

  const samGoals: Goal[] = [
    mkGoal({
      id: 'g_sam_nofast',
      userId: sam.id,
      name: 'No sugary drinks',
      category: 'Diet',
      priority: 'High',
      frequency: 'Daily',
      startDate: dk(subDays(today, 35)),
    }),
    mkGoal({
      id: 'g_sam_yoga',
      userId: sam.id,
      name: 'Yoga / stretch',
      category: 'Exercise',
      priority: 'Medium',
      frequency: 'Custom',
      customDays: [0, 2, 4, 6],
      targetValue: 20,
      unit: 'minutes',
      startDate: dk(subDays(today, 30)),
    }),
    mkGoal({
      id: 'g_sam_deepwork',
      userId: sam.id,
      name: '2h deep work block',
      category: 'To-Do',
      priority: 'High',
      frequency: 'Custom',
      customDays: [1, 2, 3, 4, 5],
      targetValue: 2,
      unit: 'hours',
      startDate: dk(subDays(today, 35)),
    }),
    mkGoal({
      id: 'g_sam_shower',
      userId: sam.id,
      name: 'Morning hygiene routine',
      category: 'Cleaning & Hygiene',
      priority: 'Medium',
      frequency: 'Daily',
      startDate: dk(subDays(today, 35)),
    }),
  ]

  const goals = [...alexGoals, ...jordanGoals, ...samGoals]
  const completions = generateHistory(goals, 60)

  return {
    users,
    goals,
    completions,
    settings: {
      theme: 'system',
      weekStartsOn: 1,
      defaultViewUserId: admin.id,
    },
    currentUserId: admin.id,
    viewingUserId: admin.id,
  }
}

/** Deterministic-ish historical completion patterns so analytics look real */
function generateHistory(goals: Goal[], daysBack: number): CompletionRecord[] {
  const records: CompletionRecord[] = []
  const today = new Date()

  for (let i = daysBack; i >= 0; i--) {
    const date = dk(subDays(today, i))
    const dayOfWeek = subDays(today, i).getDay()
    const dayIndex = daysBack - i

    for (const goal of goals) {
      if (date < goal.startDate) continue
      if (goal.endDate && date > goal.endDate) continue
      if (!goal.active) continue
      if (goal.frequency === 'Custom') {
        if (!(goal.customDays ?? []).includes(dayOfWeek)) continue
      }

      const profile = habitProfile(goal.id, dayOfWeek, dayIndex, i)
      if (profile.skip) continue

      const completed = profile.completed
      let value: number | undefined
      if (goal.targetValue != null) {
        if (completed) {
          value =
            goal.targetValue +
            (hash(goal.id + date) % 3 === 0 ? Math.floor(goal.targetValue * 0.1) : 0)
        } else {
          value = Math.round(goal.targetValue * profile.partial)
        }
      }

      records.push({
        id: uid('cmp'),
        goalId: goal.id,
        userId: goal.userId,
        date,
        completed,
        value,
        notes: completed && hash(goal.id + date) % 17 === 0 ? 'Felt good today' : undefined,
        createdAt: `${date}T08:00:00.000Z`,
        updatedAt: `${date}T20:00:00.000Z`,
      })
    }
  }

  return records
}

function habitProfile(
  goalId: string,
  dayOfWeek: number,
  dayIndex: number,
  daysAgo: number,
): { completed: boolean; partial: number; skip: boolean } {
  const h = hash(goalId)
  const weekend = dayOfWeek === 0 || dayOfWeek === 6

  // Base success rate by habit archetype
  let base = 0.55 + (h % 30) / 100

  // Exercise harder on weekdays for some goals
  if (goalId.includes('workout') || goalId.includes('run')) {
    base = weekend ? 0.85 : 0.48
  }
  if (goalId.includes('water') || goalId.includes('floss') || goalId.includes('shower')) {
    base = 0.82
  }
  if (goalId.includes('inbox') || goalId.includes('deepwork')) {
    base = weekend ? 0.4 : 0.7
  }
  if (goalId.includes('read') || goalId.includes('meditate')) {
    base = 0.62 + (weekend ? 0.15 : 0)
  }

  // Slight improvement over time (last 30 days better)
  if (daysAgo < 30) base += 0.08
  if (daysAgo < 7) base -= 0.05 // recent dip for insight variety

  // Occasional full miss days
  if ((dayIndex + h) % 11 === 0) base -= 0.35

  const roll = (hash(goalId + String(dayIndex)) % 100) / 100
  const completed = roll < base
  return {
    completed,
    partial: completed ? 1 : 0.3 + (roll % 0.4),
    skip: false,
  }
}

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}
