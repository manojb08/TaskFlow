import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/common/UserAvatar'
import { useAuth } from '@/context/AuthContext'
import { useMyTasksCount } from '@/hooks/useMyTasksCount'
import { useToast } from '@/components/ui/toast'
import { updateMe } from '@/api/users'
import { ApiClientError } from '@/api/client'

export function SettingsPage() {
  const { user, logout, refreshUser } = useAuth()
  const myTasksCount = useMyTasksCount()
  const { toast } = useToast()

  const [name, setName] = useState(user?.name ?? '')
  const [saving, setSaving] = useState(false)

  if (!user) return null

  const dirty = name.trim() !== user.name && name.trim().length > 0

  async function onSave() {
    setSaving(true)
    try {
      await updateMe({ name: name.trim() })
      await refreshUser()
      toast({ title: 'Profile updated', variant: 'success' })
    } catch (err) {
      toast({
        title: "Couldn't update profile",
        description: err instanceof ApiClientError ? err.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

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
            <Label htmlFor="settings-name">Full name</Label>
            <Input id="settings-name" value={name} onChange={(e) => setName(e.target.value)} />
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
          Email and role aren&apos;t editable from here — email is your login identity, and role is managed by an
          admin.
        </p>

        <div className="mt-6 flex items-center justify-between">
          <Button onClick={onSave} disabled={!dirty || saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
          <Button variant="destructive" onClick={() => logout()}>
            Log out
          </Button>
        </div>
      </div>
    </AppShell>
  )
}
