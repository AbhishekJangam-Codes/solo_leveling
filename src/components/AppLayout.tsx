import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Target,
  CalendarDays,
  BarChart3,
  Users,
  Settings,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { cn, initials } from '../lib/utils'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/users', label: 'Users', icon: Users, adminOnly: true },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function AppLayout() {
  const { viewingUser, currentUser, isAdmin, state, setViewingUserId, setCurrentUserId } =
    useApp()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenu, setUserMenu] = useState(false)

  const Sidebar = (
    <aside className="flex h-full w-64 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-3xl tracking-tight text-[var(--color-accent)]">
            PulseTrack
          </span>
        </div>
        <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
          Goals & habit intelligence
        </p>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {nav
          .filter((n) => !n.adminOnly || isAdmin)
          .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                  isActive
                    ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                    : 'text-[var(--color-ink-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]',
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}
      </nav>

      <div className="border-t border-[var(--color-border)] p-3 space-y-2">
        {isAdmin && (
          <div>
            <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
              Viewing as
            </p>
            <select
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
              value={state.viewingUserId}
              onChange={(e) => setViewingUserId(e.target.value)}
            >
              {state.users
                .filter((u) => u.active)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
            </select>
          </div>
        )}
        <div className="relative">
          <button
            type="button"
            onClick={() => setUserMenu((v) => !v)}
            className="flex w-full items-center gap-3 rounded-xl px-2 py-2 hover:bg-[var(--color-surface)]"
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: currentUser.avatarColor }}
            >
              {initials(currentUser.name)}
            </span>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-semibold">{currentUser.name}</p>
              <p className="truncate text-xs text-[var(--color-ink-muted)]">
                {currentUser.role}
              </p>
            </div>
            <ChevronDown className="h-4 w-4 text-[var(--color-ink-muted)]" />
          </button>
          {userMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-1 shadow-lg">
              <p className="px-2 py-1 text-[10px] font-semibold uppercase text-[var(--color-ink-muted)]">
                Switch account
              </p>
              {state.users
                .filter((u) => u.active)
                .map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-[var(--color-surface)]"
                    onClick={() => {
                      setCurrentUserId(u.id)
                      setUserMenu(false)
                    }}
                  >
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ background: u.avatarColor }}
                    >
                      {initials(u.name)}
                    </span>
                    {u.name}
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  )

  return (
    <div className="app-bg flex h-full min-h-screen">
      <div className="hidden md:block shrink-0">{Sidebar}</div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 z-50 shadow-xl">{Sidebar}</div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 px-4 py-3 backdrop-blur-md md:px-8">
          <button
            type="button"
            className="rounded-lg p-2 hover:bg-[var(--color-surface-elevated)] md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-[var(--color-ink-muted)]">
              Signed in as {currentUser.name}
              {isAdmin && viewingUser.id !== currentUser.id
                ? ` · viewing ${viewingUser.name}`
                : ''}
            </p>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8 scrollbar-thin">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
