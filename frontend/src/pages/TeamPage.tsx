import { useEffect, useState } from 'react'
import { Copy, UserPlus } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { UserAvatar } from '@/components/common/UserAvatar'
import { useUsers } from '@/hooks/useUsers'
import { useMyTasksCount } from '@/hooks/useMyTasksCount'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/components/ui/toast'
import { listTasks } from '@/api/tasks'
import { inviteUser, listUsers } from '@/api/users'
import { ApiClientError } from '@/api/client'
import type { User, UserRole } from '@/types'

interface InviteResult {
  user: User
  inviteUrl: string
}

export function TeamPage() {
  const { user: currentUser } = useAuth()
  const { users: hookUsers, isLoading } = useUsers()
  const [users, setUsers] = useState<User[]>([])
  const myTasksCount = useMyTasksCount()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [taskCounts, setTaskCounts] = useState<Record<string, number>>({})

  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<UserRole>('member')
  const [inviteSubmitting, setInviteSubmitting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteResult, setInviteResult] = useState<InviteResult | null>(null)

  useEffect(() => {
    setUsers(hookUsers)
  }, [hookUsers])

  useEffect(() => {
    if (users.length === 0) return
    let cancelled = false
    Promise.all(
      users.map((u) =>
        listTasks({ assignee: u._id, limit: 1 })
          .then((res) => [u._id, res.meta.total] as const)
          .catch(() => [u._id, 0] as const),
      ),
    ).then((entries) => {
      if (!cancelled) setTaskCounts(Object.fromEntries(entries))
    })
    return () => {
      cancelled = true
    }
  }, [users])

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()),
  )

  function resetInviteForm() {
    setInviteName('')
    setInviteEmail('')
    setInviteRole('member')
    setInviteError(null)
    setInviteResult(null)
  }

  function onInviteButtonClick() {
    if (currentUser?.role !== 'admin') {
      toast({ title: 'Only admins can invite members' })
      return
    }
    setInviteOpen(true)
  }

  function onInviteDialogChange(next: boolean) {
    setInviteOpen(next)
    if (!next) resetInviteForm()
  }

  async function onInviteSubmit() {
    if (!inviteName.trim() || !inviteEmail.trim()) {
      setInviteError('Name and email are required.')
      return
    }
    setInviteSubmitting(true)
    setInviteError(null)
    try {
      const res = await inviteUser({ name: inviteName.trim(), email: inviteEmail.trim(), role: inviteRole })
      setInviteResult({ user: res.data.user, inviteUrl: res.data.inviteUrl })
    } catch (err) {
      setInviteError(err instanceof ApiClientError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setInviteSubmitting(false)
    }
  }

  async function onCopyInviteUrl() {
    if (!inviteResult) return
    await navigator.clipboard.writeText(inviteResult.inviteUrl)
    toast({ title: 'Copied' })
  }

  async function onDone() {
    setInviteOpen(false)
    resetInviteForm()
    try {
      const res = await listUsers()
      setUsers(res.data.users)
    } catch {
      // list still shows the previously loaded members; a manual refresh will pick this up
    }
  }

  return (
    <AppShell breadcrumb="Team" myTasksCount={myTasksCount}>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink">Team</h1>
          <p className="mt-1 text-sm text-ink/50">People working on your projects.</p>
        </div>
        <Button onClick={onInviteButtonClick}>
          <UserPlus className="h-4 w-4" />
          Invite Member
        </Button>
      </div>

      <div className="mb-4 sm:w-72">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search people..." />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Assigned tasks</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))
            : filtered.map((member) => (
                <TableRow key={member._id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <UserAvatar user={member} />
                      <span className="font-medium text-ink">{member.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-ink/60">{member.email}</TableCell>
                  <TableCell>
                    <Badge className="capitalize">{member.role}</Badge>
                  </TableCell>
                  <TableCell>
                    {member.status === 'active' ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="warning">Invited</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-ink/60">{taskCounts[member._id] ?? '—'} tasks</TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>

      <Dialog open={inviteOpen} onOpenChange={onInviteDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Member</DialogTitle>
          </DialogHeader>

          {inviteResult ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-ink/70">
                Share this link with {inviteResult.user.name} to let them set their password (no email service
                configured).
              </p>
              <div className="flex items-center gap-2">
                <Input readOnly value={inviteResult.inviteUrl} className="flex-1" />
                <Button type="button" variant="secondary" onClick={onCopyInviteUrl}>
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
              </div>
              <DialogFooter>
                <Button onClick={onDone}>Done</Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="invite-name">Name</Label>
                <Input id="invite-name" value={inviteName} onChange={(e) => setInviteName(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Role</Label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as UserRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {inviteError && (
                <p className="rounded-[6px] bg-destructive-bg px-3 py-2 text-sm text-destructive">{inviteError}</p>
              )}

              <DialogFooter>
                <Button variant="secondary" onClick={() => setInviteOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={onInviteSubmit} disabled={inviteSubmitting}>
                  {inviteSubmitting ? 'Inviting…' : 'Invite'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
