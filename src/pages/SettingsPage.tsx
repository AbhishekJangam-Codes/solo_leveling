import { useApp } from '../context/AppContext'
import type { ThemeMode } from '../types'
import { btnGhost, btnPrimary } from '../components/ui'
import { cn } from '../lib/utils'

export function SettingsPage() {
  const { state, updateSettings, resetDemoData, resolvedTheme } = useApp()

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-up">
      <div>
        <p className="text-sm font-medium text-[var(--color-accent)]">Settings</p>
        <h1 className="font-display text-4xl tracking-tight md:text-5xl">
          Preferences
        </h1>
        <p className="mt-1 text-[var(--color-ink-muted)]">
          Theme, calendar, and demo data
        </p>
      </div>

      <section className="card space-y-4 p-5">
        <h2 className="font-display text-2xl">Appearance</h2>
        <p className="text-sm text-[var(--color-ink-muted)]">
          Current resolved theme: <strong>{resolvedTheme}</strong>
        </p>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['light', 'Light'],
              ['dark', 'Dark'],
              ['system', 'System'],
            ] as [ThemeMode, string][]
          ).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              onClick={() => updateSettings({ theme: mode })}
              className={cn(
                'rounded-xl px-4 py-2.5 text-sm font-medium',
                state.settings.theme === mode
                  ? 'bg-[var(--color-accent)] text-white dark:text-teal-950'
                  : 'border border-[var(--color-border)]',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="font-display text-2xl">Calendar</h2>
        <p className="text-sm text-[var(--color-ink-muted)]">Week starts on</p>
        <div className="flex gap-2">
          {(
            [
              [1, 'Monday'],
              [0, 'Sunday'],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => updateSettings({ weekStartsOn: v })}
              className={cn(
                'rounded-xl px-4 py-2.5 text-sm font-medium',
                state.settings.weekStartsOn === v
                  ? 'bg-[var(--color-accent)] text-white dark:text-teal-950'
                  : 'border border-[var(--color-border)]',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="font-display text-2xl">Data</h2>
        <p className="text-sm text-[var(--color-ink-muted)]">
          All tracking data is stored in your browser (localStorage). Historical
          completion records are never overwritten when you edit past days — only
          the same date&apos;s entry is updated.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={btnPrimary}
            onClick={() => {
              if (
                confirm(
                  'Reset to fresh sample data? Your current local data will be replaced.',
                )
              )
                resetDemoData()
            }}
          >
            Reset demo data
          </button>
          <button
            type="button"
            className={btnGhost}
            onClick={() => {
              const blob = new Blob([JSON.stringify(state, null, 2)], {
                type: 'application/json',
              })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `pulsetrack-export-${new Date().toISOString().slice(0, 10)}.json`
              a.click()
              URL.revokeObjectURL(url)
            }}
          >
            Export JSON
          </button>
        </div>
      </section>
    </div>
  )
}
