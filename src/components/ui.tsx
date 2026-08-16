import type { ReactNode } from 'react'
import { cn } from '../lib/utils'

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  wide?: boolean
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative z-10 w-full max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] shadow-xl animate-fade-up',
          wide ? 'sm:max-w-2xl' : 'sm:max-w-lg',
        )}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-5 py-4">
          <h2 className="font-display text-2xl tracking-tight">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-[var(--color-ink-muted)] hover:bg-[var(--color-surface)]"
          >
            Close
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-muted)]">
        {label}
      </span>
      {children}
    </label>
  )
}

export const inputClass =
  'w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20'

export const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white dark:text-teal-950 hover:opacity-90 transition disabled:opacity-50'

export const btnGhost =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-transparent px-4 py-2.5 text-sm font-medium hover:bg-[var(--color-surface)] transition'
