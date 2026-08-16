export type GoalCategory = 'Diet' | 'Exercise' | 'To-Do' | 'Cleaning & Hygiene'
export type Priority = 'High' | 'Medium' | 'Low'
export type Frequency = 'Daily' | 'Custom'
export type ThemeMode = 'light' | 'dark' | 'system'

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
  active: boolean
  avatarColor: string
  createdAt: string
}

export interface Goal {
  id: string
  userId: string
  name: string
  category: GoalCategory
  priority: Priority
  frequency: Frequency
  /** For Custom frequency: weekday numbers 0=Sun..6=Sat */
  customDays?: number[]
  targetValue?: number
  unit?: string
  startDate: string
  endDate?: string
  notes: string
  active: boolean
  createdAt: string
  updatedAt: string
}

/** Immutable historical completion record for a goal on a specific date */
export interface CompletionRecord {
  id: string
  goalId: string
  userId: string
  date: string // YYYY-MM-DD
  completed: boolean
  value?: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface AppSettings {
  theme: ThemeMode
  weekStartsOn: 0 | 1
  defaultViewUserId: string | null
}

export interface AppState {
  users: User[]
  goals: Goal[]
  completions: CompletionRecord[]
  settings: AppSettings
  currentUserId: string
  viewingUserId: string
}

export const CATEGORIES: GoalCategory[] = [
  'Diet',
  'Exercise',
  'To-Do',
  'Cleaning & Hygiene',
]

export const PRIORITIES: Priority[] = ['High', 'Medium', 'Low']

export const AVATAR_COLORS = [
  '#0F766E',
  '#B45309',
  '#1D4ED8',
  '#BE123C',
  '#7C3AED',
  '#047857',
  '#C2410C',
  '#0369A1',
]
