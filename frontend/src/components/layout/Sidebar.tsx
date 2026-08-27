import { NavLink } from 'react-router-dom'
import { LayoutGrid, ListChecks, UserCircle2, Users, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutGrid
  badge?: number
}

export function Sidebar({ myTasksCount }: { myTasksCount?: number }) {
  const items: NavItem[] = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
    { to: '/tasks', label: 'Tasks', icon: ListChecks },
    { to: '/my-tasks', label: 'My Tasks', icon: UserCircle2, badge: myTasksCount },
    { to: '/team', label: 'Team', icon: Users },
  ]

  return (
    <aside className="hidden md:flex w-sidebar shrink-0 flex-col justify-between border-r border-border bg-surface">
      <div>
        <div className="flex h-topbar items-center gap-2 px-5">
          <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-ink text-sm font-bold text-white">
            T
          </div>
          <span className="font-heading text-base font-bold text-ink">TaskFlow</span>
        </div>

        <nav className="mt-2 flex flex-col gap-0.5 px-3">
          <p className="px-2 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-ink/40">
            Workspace
          </p>
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between rounded-[8px] px-2.5 py-2 text-sm font-medium text-ink/70 hover:bg-white',
                  isActive && 'bg-white text-ink shadow-xs',
                )
              }
            >
              <span className="flex items-center gap-2.5">
                <item.icon className="h-4 w-4" />
                {item.label}
              </span>
              {!!item.badge && (
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-ink/60">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="border-t border-border p-3">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-sm font-medium text-ink/70 hover:bg-white',
              isActive && 'bg-white text-ink',
            )
          }
        >
          <Settings className="h-4 w-4" />
          Settings
        </NavLink>
      </div>
    </aside>
  )
}
