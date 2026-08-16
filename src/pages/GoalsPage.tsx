import { useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, Ban } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { GoalFormModal } from '../components/GoalFormModal'
import { CategoryBadge } from '../components/CategoryBadge'
import { PriorityBadge } from '../components/PriorityBadge'
import { btnPrimary, btnGhost } from '../components/ui'
import { CATEGORIES, PRIORITIES, type Goal, type GoalCategory, type Priority } from '../types'
import { cn } from '../lib/utils'

export function GoalsPage() {
  const { state, viewingUser, isAdmin, updateGoal, deleteGoal, deactivateGoal } =
    useApp()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Goal | null>(null)
  const [category, setCategory] = useState<GoalCategory | 'All'>('All')
  const [priority, setPriority] = useState<Priority | 'All'>('All')
  const [showInactive, setShowInactive] = useState(false)
  const [userFilter, setUserFilter] = useState<string>(viewingUser.id)

  // Keep filter aligned when admin switches "viewing as" in the sidebar
  if (!isAdmin && userFilter !== viewingUser.id) {
    setUserFilter(viewingUser.id)
  }

  const goals = useMemo(() => {
    const uid = isAdmin ? userFilter : viewingUser.id
    return state.goals
      .filter((g) => g.userId === uid)
      .filter((g) => showInactive || g.active)
      .filter((g) => category === 'All' || g.category === category)
      .filter((g) => priority === 'All' || g.priority === priority)
      .sort((a, b) => {
        const order = { High: 0, Medium: 1, Low: 2 }
        return order[a.priority] - order[b.priority] || a.name.localeCompare(b.name)
      })
  }, [
    state.goals,
    viewingUser.id,
    isAdmin,
    userFilter,
    category,
    priority,
    showInactive,
  ])

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-up">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--color-accent)]">Goals</p>
          <h1 className="font-display text-4xl tracking-tight md:text-5xl">
            Manage habits
          </h1>
          <p className="mt-1 text-[var(--color-ink-muted)]">
            Create, edit, and prioritize recurring goals
          </p>
        </div>
        <button
          type="button"
          className={btnPrimary}
          onClick={() => {
            setEditing(null)
            setModalOpen(true)
          }}
        >
          <Plus className="h-4 w-4" />
          New goal
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {isAdmin && (
          <select
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
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
        <label className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
          Show inactive
        </label>
      </div>

      <div className="space-y-3">
        {goals.map((goal) => (
          <article
            key={goal.id}
            className={cn(
              'card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between',
              !goal.active && 'opacity-60',
            )}
          >
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold">{goal.name}</h3>
                {!goal.active && (
                  <span className="rounded-md bg-slate-200 px-2 py-0.5 text-xs dark:bg-slate-700">
                    Inactive
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <CategoryBadge category={goal.category} />
                <PriorityBadge priority={goal.priority} />
                <span className="rounded-md bg-[var(--color-surface)] px-2 py-0.5 text-xs text-[var(--color-ink-muted)]">
                  {goal.frequency}
                  {goal.frequency === 'Custom' && goal.customDays
                    ? ` · ${goal.customDays.length} days/wk`
                    : ''}
                </span>
                {goal.targetValue != null && (
                  <span className="rounded-md bg-[var(--color-surface)] px-2 py-0.5 text-xs text-[var(--color-ink-muted)]">
                    Target: {goal.targetValue} {goal.unit}
                  </span>
                )}
              </div>
              {goal.notes && (
                <p className="text-sm text-[var(--color-ink-muted)]">{goal.notes}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={btnGhost + ' !px-3 !py-2'}
                onClick={() => {
                  setEditing(goal)
                  setModalOpen(true)
                }}
              >
                <Pencil className="h-4 w-4" />
                Edit
              </button>
              {goal.active ? (
                <button
                  type="button"
                  className={btnGhost + ' !px-3 !py-2'}
                  onClick={() => deactivateGoal(goal.id)}
                >
                  <Ban className="h-4 w-4" />
                  Deactivate
                </button>
              ) : (
                <button
                  type="button"
                  className={btnGhost + ' !px-3 !py-2'}
                  onClick={() => updateGoal(goal.id, { active: true })}
                >
                  Reactivate
                </button>
              )}
              <button
                type="button"
                className={btnGhost + ' !px-3 !py-2 text-rose-600'}
                onClick={() => {
                  if (
                    confirm(
                      'Delete this goal? Historical completion records will be kept.',
                    )
                  )
                    deleteGoal(goal.id)
                }}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </article>
        ))}
        {!goals.length && (
          <div className="card p-10 text-center text-[var(--color-ink-muted)]">
            No goals match these filters.
          </div>
        )}
      </div>

      <GoalFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        goal={editing}
        defaultUserId={isAdmin ? userFilter : viewingUser.id}
      />
    </div>
  )
}
