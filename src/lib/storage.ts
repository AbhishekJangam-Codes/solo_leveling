import type { AppState } from '../types'
import { createSampleData } from './sampleData'

const STORAGE_KEY = 'pulsetrack_v1'

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AppState
      if (parsed?.users?.length && parsed?.goals) return parsed
    }
  } catch {
    // fall through
  }
  const fresh = createSampleData()
  saveState(fresh)
  return fresh
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // storage full / private mode
  }
}

export function resetState(): AppState {
  const fresh = createSampleData()
  saveState(fresh)
  return fresh
}
