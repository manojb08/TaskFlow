import { type KeyboardEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Search } from 'lucide-react'
import { UserAvatar } from '@/components/common/UserAvatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/context/AuthContext'

export function Topbar({ breadcrumb }: { breadcrumb: string }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  function onSearchKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && search.trim()) {
      navigate(`/tasks?search=${encodeURIComponent(search.trim())}`)
    }
  }

  return (
    <header className="flex h-topbar items-center justify-between gap-4 border-b border-border bg-white px-6">
      <nav className="flex items-center gap-1.5 text-sm text-ink/50">
        <span>TaskFlow</span>
        <span>/</span>
        <span className="font-medium text-ink">{breadcrumb}</span>
      </nav>

      <div className="flex items-center gap-3">
        <div className="relative hidden sm:block">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={onSearchKeyDown}
            placeholder="Search tasks..."
            className="h-8 w-56 rounded-[8px] border border-border bg-surface pl-8 pr-3 text-sm placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <button
          type="button"
          aria-label="Notifications"
          className="rounded-[8px] p-1.5 text-ink/50 hover:bg-muted"
        >
          <Bell className="h-4 w-4" />
        </button>

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-full focus:outline-none focus:ring-2 focus:ring-accent">
              <UserAvatar user={user} />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <div className="px-2 py-1.5 text-sm">
                <p className="font-medium text-ink">{user.name}</p>
                <p className="text-xs text-ink/50">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive onSelect={() => logout()}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}
