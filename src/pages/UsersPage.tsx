import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Plus, Pencil } from 'lucide-react'
import { subDays } from 'date-fns'
import { useApp } from '../context/AppContext'
import { computeRangeStats, dateKey } from '../lib/analytics'
import { Field, Modal, btnGhost, btnPrimary, inputClass } from '../components/ui'
import { AVATAR_COLORS, type User } from '../types'
import { initials, cn } from '../lib/utils'

export function UsersPage() {
  const {
    state,
    isAdmin,
    addUser,
    updateUser,
    toggleUserActive,
    setViewingUserId,
    resolvedTheme,
  } = useApp()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)

  const end = dateKey(new Date())
  const start = dateKey(subDays(new Date(), 29))

  const comparison = useMemo(
    () =>
      state.users
        .filter((u) => u.active)
        .map((u) => {
          const stats = computeRangeStats(
            state.goals,
            state.completions,
            u.id,
            start,
            end,
          )
          return {
            user: u,
            avgPct: stats.avgPct,
            consistency: stats.consistencyScore,
            completed: stats.totalCompleted,
            goals: state.goals.filter((g) => g.userId === u.id && g.active)
              .length,
          }
        })
        .sort((a, b) => b.avgPct - a.avgPct),
    [state.users, state.goals, state.completions, start, end],
  )

  const chartData = comparison.map((c) => ({
    name: c.user.name.split(' ')[0],
    pct: c.avgPct,
  }))

  const axisColor = resolvedTheme === 'dark' ? '#9aa39a' : '#5c635c'

  if (!isAdmin) return <Navigate to="/" replace />

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-up">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--color-accent)]">Users</p>
          <h1 className="font-display text-4xl tracking-tight md:text-5xl">
            Team management
          </h1>
          <p className="mt-1 text-[var(--color-ink-muted)]">
            Each user&apos;s goals and history stay logically separated
          </p>
        </div>
        <button
          type="button"
          className={btnPrimary}
          onClick={() => {
            setEditing(null)
            setOpen(true)
          }}
        >
          <Plus className="h-4 w-4" />
          Add user
        </button>
      </div>

      <section className="card p-5">
        <h2 className="font-display text-2xl">30-day comparison</h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fill: axisColor, fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-surface-elevated)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 12,
                }}
              />
              <Bar dataKey="pct" fill="#0F766E" radius={[8, 8, 0, 0]} name="Avg %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid gap-3">
        {state.users.map((user) => {
          const row = comparison.find((c) => c.user.id === user.id)
          return (
            <article
              key={user.id}
              className={cn(
                'card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between',
                !user.active && 'opacity-60',
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: user.avatarColor }}
                >
                  {initials(user.name)}
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{user.name}</h3>
                    <span className="rounded-md bg-[var(--color-surface)] px-2 py-0.5 text-xs capitalize">
                      {user.role}
                    </span>
                    {!user.active && (
                      <span className="rounded-md bg-rose-100 px-2 py-0.5 text-xs text-rose-800 dark:bg-rose-950 dark:text-rose-200">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--color-ink-muted)]">{user.email}</p>
                  {row && (
                    <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                      {row.goals} active goals · {row.avgPct}% avg · consistency{' '}
                      {row.consistency}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={btnGhost + ' !px-3 !py-2'}
                  onClick={() => setViewingUserId(user.id)}
                  disabled={!user.active}
                >
                  View dashboard
                </button>
                <button
                  type="button"
                  className={btnGhost + ' !px-3 !py-2'}
                  onClick={() => {
                    setEditing(user)
                    setOpen(true)
                  }}
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
                {user.role !== 'admin' && (
                  <button
                    type="button"
                    className={btnGhost + ' !px-3 !py-2'}
                    onClick={() => toggleUserActive(user.id)}
                  >
                    {user.active ? 'Deactivate' : 'Activate'}
                  </button>
                )}
              </div>
            </article>
          )
        })}
      </div>

      <UserFormModal
        open={open}
        onClose={() => setOpen(false)}
        user={editing}
        onSave={(data) => {
          if (editing) updateUser(editing.id, data)
          else
            addUser({
              name: data.name!,
              email: data.email!,
              role: data.role ?? 'user',
              active: data.active ?? true,
              avatarColor: data.avatarColor,
            })
          setOpen(false)
        }}
      />
    </div>
  )
}

function UserFormModal({
  open,
  onClose,
  user,
  onSave,
}: {
  open: boolean
  onClose: () => void
  user: User | null
  onSave: (data: Partial<User>) => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'user'>('user')
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0])
  const [prev, setPrev] = useState(open)

  if (open !== prev) {
    setPrev(open)
    if (open) {
      setName(user?.name ?? '')
      setEmail(user?.email ?? '')
      setRole(user?.role ?? 'user')
      setAvatarColor(user?.avatarColor ?? AVATAR_COLORS[0])
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={user ? 'Edit user' : 'Add user'}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          onSave({ name, email, role, avatarColor })
        }}
      >
        <Field label="Name">
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Field>
        <Field label="Email">
          <input
            className={inputClass}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>
        <Field label="Role">
          <select
            className={inputClass}
            value={role}
            onChange={(e) => setRole(e.target.value as 'admin' | 'user')}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </Field>
        <Field label="Avatar color">
          <div className="flex flex-wrap gap-2">
            {AVATAR_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={cn(
                  'h-8 w-8 rounded-full',
                  avatarColor === c &&
                    'ring-2 ring-offset-2 ring-[var(--color-accent)]',
                )}
                style={{ background: c }}
                onClick={() => setAvatarColor(c)}
                aria-label={c}
              />
            ))}
          </div>
        </Field>
        <div className="flex justify-end gap-2">
          <button type="button" className={btnGhost} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={btnPrimary}>
            Save
          </button>
        </div>
      </form>
    </Modal>
  )
}
