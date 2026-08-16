import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type {
  AppSettings,
  AppState,
  CompletionRecord,
  Goal,
  ThemeMode,
  User,
} from '../types'
import { AVATAR_COLORS } from '../types'
import { dateKey, uid } from '../lib/analytics'
import { loadState, resetState, saveState } from '../lib/storage'

interface AppContextValue {
  state: AppState
  viewingUser: User
  currentUser: User
  isAdmin: boolean
  setViewingUserId: (id: string) => void
  setCurrentUserId: (id: string) => void
  updateSettings: (patch: Partial<AppSettings>) => void
  // Users
  addUser: (data: Omit<User, 'id' | 'createdAt' | 'avatarColor'> & { avatarColor?: string }) => User
  updateUser: (id: string, patch: Partial<User>) => void
  toggleUserActive: (id: string) => void
  // Goals
  addGoal: (data: Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'active'>) => Goal
  updateGoal: (id: string, patch: Partial<Goal>) => void
  deleteGoal: (id: string) => void
  deactivateGoal: (id: string) => void
  // Completions — never overwrite history blindly; upsert same day only
  upsertCompletion: (
    goalId: string,
    date: string,
    data: { completed: boolean; value?: number; notes?: string },
  ) => void
  toggleComplete: (goalId: string, date: string) => void
  resetDemoData: () => void
  resolvedTheme: 'light' | 'dark'
}

const AppContext = createContext<AppContextValue | null>(null)

function applyTheme(theme: ThemeMode): 'light' | 'dark' {
  const dark =
    theme === 'dark' ||
    (theme === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
  return dark ? 'dark' : 'light'
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState())
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    saveState(state)
  }, [state])

  useEffect(() => {
    setResolvedTheme(applyTheme(state.settings.theme))
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      if (state.settings.theme === 'system') {
        setResolvedTheme(applyTheme('system'))
      }
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [state.settings.theme])

  const mutate = useCallback((fn: (s: AppState) => AppState) => {
    setState((prev) => fn(prev))
  }, [])

  const viewingUser =
    state.users.find((u) => u.id === state.viewingUserId) ?? state.users[0]
  const currentUser =
    state.users.find((u) => u.id === state.currentUserId) ?? state.users[0]
  const isAdmin = currentUser?.role === 'admin'

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      viewingUser,
      currentUser,
      isAdmin,
      resolvedTheme,
      setViewingUserId: (id) =>
        mutate((s) => ({ ...s, viewingUserId: id })),
      setCurrentUserId: (id) =>
        mutate((s) => ({
          ...s,
          currentUserId: id,
          viewingUserId: id,
        })),
      updateSettings: (patch) =>
        mutate((s) => ({
          ...s,
          settings: { ...s.settings, ...patch },
        })),
      addUser: (data) => {
        const user: User = {
          id: uid('user'),
          createdAt: dateKey(new Date()),
          avatarColor:
            data.avatarColor ??
            AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
          ...data,
        }
        mutate((s) => ({ ...s, users: [...s.users, user] }))
        return user
      },
      updateUser: (id, patch) =>
        mutate((s) => ({
          ...s,
          users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)),
        })),
      toggleUserActive: (id) =>
        mutate((s) => ({
          ...s,
          users: s.users.map((u) =>
            u.id === id ? { ...u, active: !u.active } : u,
          ),
        })),
      addGoal: (data) => {
        const now = new Date().toISOString()
        const goal: Goal = {
          ...data,
          id: uid('goal'),
          active: true,
          createdAt: now,
          updatedAt: now,
        }
        mutate((s) => ({ ...s, goals: [...s.goals, goal] }))
        return goal
      },
      updateGoal: (id, patch) =>
        mutate((s) => ({
          ...s,
          goals: s.goals.map((g) =>
            g.id === id
              ? { ...g, ...patch, updatedAt: new Date().toISOString() }
              : g,
          ),
        })),
      deleteGoal: (id) =>
        mutate((s) => ({
          ...s,
          goals: s.goals.filter((g) => g.id !== id),
          // Keep historical completions intact
        })),
      deactivateGoal: (id) =>
        mutate((s) => ({
          ...s,
          goals: s.goals.map((g) =>
            g.id === id
              ? { ...g, active: false, updatedAt: new Date().toISOString() }
              : g,
          ),
        })),
      upsertCompletion: (goalId, date, data) => {
        mutate((s) => {
          const goal = s.goals.find((g) => g.id === goalId)
          if (!goal) return s
          const existing = s.completions.find(
            (c) => c.goalId === goalId && c.date === date,
          )
          const now = new Date().toISOString()
          if (existing) {
            // Update same-day record only — never create duplicate history rows
            const updated: CompletionRecord = {
              ...existing,
              ...data,
              updatedAt: now,
            }
            return {
              ...s,
              completions: s.completions.map((c) =>
                c.id === existing.id ? updated : c,
              ),
            }
          }
          const record: CompletionRecord = {
            id: uid('cmp'),
            goalId,
            userId: goal.userId,
            date,
            completed: data.completed,
            value: data.value,
            notes: data.notes,
            createdAt: now,
            updatedAt: now,
          }
          return { ...s, completions: [...s.completions, record] }
        })
      },
      toggleComplete: (goalId, date) => {
        mutate((s) => {
          const goal = s.goals.find((g) => g.id === goalId)
          if (!goal) return s
          const existing = s.completions.find(
            (c) => c.goalId === goalId && c.date === date,
          )
          const now = new Date().toISOString()
          if (existing) {
            const completed = !existing.completed
            return {
              ...s,
              completions: s.completions.map((c) =>
                c.id === existing.id
                  ? {
                      ...c,
                      completed,
                      value:
                        completed && goal.targetValue != null
                          ? goal.targetValue
                          : completed
                            ? c.value
                            : 0,
                      updatedAt: now,
                    }
                  : c,
              ),
            }
          }
          const record: CompletionRecord = {
            id: uid('cmp'),
            goalId,
            userId: goal.userId,
            date,
            completed: true,
            value: goal.targetValue,
            createdAt: now,
            updatedAt: now,
          }
          return { ...s, completions: [...s.completions, record] }
        })
      },
      resetDemoData: () => setState(resetState()),
    }),
    [state, viewingUser, currentUser, isAdmin, resolvedTheme, mutate],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
