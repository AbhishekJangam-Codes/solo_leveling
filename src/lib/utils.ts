import {
  Apple,
  Dumbbell,
  CheckSquare,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import type { GoalCategory, Priority } from '../types'
import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export const categoryMeta: Record<
  GoalCategory,
  {
    icon: LucideIcon
    color: string
    bg: string
    darkBg: string
    label: string
  }
> = {
  Diet: {
    icon: Apple,
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    darkBg: 'bg-emerald-500',
    label: 'Diet',
  },
  Exercise: {
    icon: Dumbbell,
    color: 'text-sky-700 dark:text-sky-300',
    bg: 'bg-sky-50 dark:bg-sky-950/50',
    darkBg: 'bg-sky-500',
    label: 'Exercise',
  },
  'To-Do': {
    icon: CheckSquare,
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-50 dark:bg-amber-950/50',
    darkBg: 'bg-amber-500',
    label: 'To-Do',
  },
  'Cleaning & Hygiene': {
    icon: Sparkles,
    color: 'text-violet-700 dark:text-violet-300',
    bg: 'bg-violet-50 dark:bg-violet-950/50',
    darkBg: 'bg-violet-500',
    label: 'Cleaning & Hygiene',
  },
}

export const priorityMeta: Record<
  Priority,
  { className: string; dot: string }
> = {
  High: {
    className:
      'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200',
    dot: 'bg-rose-500',
  },
  Medium: {
    className:
      'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
    dot: 'bg-amber-500',
  },
  Low: {
    className:
      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    dot: 'bg-slate-400',
  },
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}
