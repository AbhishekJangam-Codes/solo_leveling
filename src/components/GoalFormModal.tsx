import { useState, type FormEvent } from 'react'
import type { Goal, GoalCategory, Priority, Frequency } from '../types'
import { CATEGORIES, PRIORITIES } from '../types'
import { Field, Modal, btnGhost, btnPrimary, inputClass } from './ui'
import { useApp } from '../context/AppContext'

const WEEKDAYS = [
  { v: 0, l: 'Sun' },
  { v: 1, l: 'Mon' },
  { v: 2, l: 'Tue' },
  { v: 3, l: 'Wed' },
  { v: 4, l: 'Thu' },
  { v: 5, l: 'Fri' },
  { v: 6, l: 'Sat' },
]

type FormState = {
  name: string
  category: GoalCategory
  priority: Priority
  frequency: Frequency
  customDays: number[]
  targetValue: string
  unit: string
  startDate: string
  endDate: string
  notes: string
  userId: string
}

function toForm(goal?: Goal, defaultUserId?: string): FormState {
  return {
    name: goal?.name ?? '',
    category: goal?.category ?? 'To-Do',
    priority: goal?.priority ?? 'Medium',
    frequency: goal?.frequency ?? 'Daily',
    customDays: goal?.customDays ?? [1, 2, 3, 4, 5],
    targetValue: goal?.targetValue != null ? String(goal.targetValue) : '',
    unit: goal?.unit ?? '',
    startDate: goal?.startDate ?? new Date().toISOString().slice(0, 10),
    endDate: goal?.endDate ?? '',
    notes: goal?.notes ?? '',
    userId: goal?.userId ?? defaultUserId ?? '',
  }
}

export function GoalFormModal({
  open,
  onClose,
  goal,
  defaultUserId,
}: {
  open: boolean
  onClose: () => void
  goal?: Goal | null
  defaultUserId: string
}) {
  const { addGoal, updateGoal, state, isAdmin } = useApp()
  const [form, setForm] = useState<FormState>(() => toForm(goal ?? undefined, defaultUserId))

  // Reset when opening
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) setForm(toForm(goal ?? undefined, defaultUserId))
  }

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    const payload = {
      name: form.name.trim(),
      category: form.category,
      priority: form.priority,
      frequency: form.frequency,
      customDays: form.frequency === 'Custom' ? form.customDays : undefined,
      targetValue: form.targetValue ? Number(form.targetValue) : undefined,
      unit: form.unit || undefined,
      startDate: form.startDate,
      endDate: form.endDate || undefined,
      notes: form.notes,
      userId: form.userId,
    }
    if (goal) updateGoal(goal.id, payload)
    else addGoal(payload)
    onClose()
  }

  const toggleDay = (d: number) => {
    set(
      'customDays',
      form.customDays.includes(d)
        ? form.customDays.filter((x) => x !== d)
        : [...form.customDays, d].sort(),
    )
  }

  return (
    <Modal open={open} onClose={onClose} title={goal ? 'Edit goal' : 'New goal'} wide>
      <form onSubmit={submit} className="space-y-4">
        {isAdmin && (
          <Field label="User">
            <select
              className={inputClass}
              value={form.userId}
              onChange={(e) => set('userId', e.target.value)}
            >
              {state.users
                .filter((u) => u.active)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
            </select>
          </Field>
        )}
        <Field label="Goal name">
          <input
            className={inputClass}
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. Drink 3L water"
            required
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <select
              className={inputClass}
              value={form.category}
              onChange={(e) => set('category', e.target.value as GoalCategory)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Priority">
            <select
              className={inputClass}
              value={form.priority}
              onChange={(e) => set('priority', e.target.value as Priority)}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Frequency">
          <div className="flex gap-2">
            {(['Daily', 'Custom'] as Frequency[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => set('frequency', f)}
                className={
                  form.frequency === f
                    ? btnPrimary + ' flex-1'
                    : btnGhost + ' flex-1'
                }
              >
                {f}
              </button>
            ))}
          </div>
        </Field>
        {form.frequency === 'Custom' && (
          <Field label="Active days">
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((d) => (
                <button
                  key={d.v}
                  type="button"
                  onClick={() => toggleDay(d.v)}
                  className={
                    form.customDays.includes(d.v)
                      ? 'rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-xs font-semibold text-white dark:text-teal-950'
                      : btnGhost + ' !px-3 !py-1.5 !text-xs'
                  }
                >
                  {d.l}
                </button>
              ))}
            </div>
          </Field>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Target value">
            <input
              className={inputClass}
              type="number"
              min={0}
              step="any"
              value={form.targetValue}
              onChange={(e) => set('targetValue', e.target.value)}
              placeholder="Optional"
            />
          </Field>
          <Field label="Unit">
            <input
              className={inputClass}
              value={form.unit}
              onChange={(e) => set('unit', e.target.value)}
              placeholder="liters, min…"
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start date">
            <input
              className={inputClass}
              type="date"
              value={form.startDate}
              onChange={(e) => set('startDate', e.target.value)}
              required
            />
          </Field>
          <Field label="End date">
            <input
              className={inputClass}
              type="date"
              value={form.endDate}
              onChange={(e) => set('endDate', e.target.value)}
            />
          </Field>
        </div>
        <Field label="Notes">
          <textarea
            className={inputClass}
            rows={3}
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Context, reminders…"
          />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className={btnGhost} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={btnPrimary}>
            {goal ? 'Save changes' : 'Create goal'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
