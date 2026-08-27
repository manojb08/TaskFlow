import { AppShell } from '@/components/layout/AppShell'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/common/UserAvatar'
import { useAuth } from '@/context/AuthContext'
import { useMyTasksCount } from '@/hooks/useMyTasksCount'

export function SettingsPage() {
  const { user, logout } = useAuth()
  const myTasksCount = useMyTasksCount()

  if (!user) return null

  return (
    <AppShell breadcrumb="Settings" myTasksCount={myTasksCount}>
      <h1 className="font-heading text-2xl font-bold text-ink">Settings</h1>
      <p className="mt-1 text-sm text-ink/50">Manage your profile.</p>

      <div className="mt-6 max-w-xl rounded-[10px] border border-border bg-white p-6">
        <div className="mb-6 flex items-center gap-4">
          <UserAvatar user={user} className="h-14 w-14 text-lg" />
          <div>
            <p className="font-medium text-ink">{user.name}</p>
            <p className="text-sm text-ink/50">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>Full name</Label>
            <Input value={user.name} disabled />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Email</Label>
            <Input value={user.email} disabled />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Role</Label>
            <Input value={user.role} disabled className="capitalize" />
          </div>
        </div>

        <p className="mt-4 text-xs text-ink/40">
          Profile editing isn&apos;t implemented in this build — see AI_USAGE.md / DECISIONS.md for scope notes.
        </p>

        <Button variant="destructive" className="mt-6" onClick={() => logout()}>
          Log out
        </Button>
      </div>
    </AppShell>
  )
}
