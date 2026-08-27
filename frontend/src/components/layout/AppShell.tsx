import { useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { Menu, LayoutGrid, ListChecks, UserCircle2, Users, Settings } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const MOBILE_NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { to: '/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/my-tasks', label: 'My Tasks', icon: UserCircle2 },
  { to: '/team', label: 'Team', icon: Users },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function AppShell({
  breadcrumb,
  myTasksCount,
  children,
}: {
  breadcrumb: string
  myTasksCount?: number
  children: ReactNode
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar myTasksCount={myTasksCount} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center border-b border-border bg-white md:hidden">
          <button
            type="button"
            aria-label="Open navigation"
            onClick={() => setMobileNavOpen(true)}
            className="px-4 py-3 text-ink/70"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
        <Topbar breadcrumb={breadcrumb} />
        <main className="flex-1 px-6 py-8 md:px-10 md:py-10">{children}</main>
      </div>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent>
          <SheetHeader>
            <div className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-ink text-xs font-bold text-white">
              T
            </div>
            <SheetTitle>TaskFlow</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-0.5">
            {MOBILE_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileNavOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 rounded-[8px] px-3 py-2 text-sm font-medium text-ink/70 hover:bg-muted',
                    isActive && 'bg-muted text-ink',
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  )
}
