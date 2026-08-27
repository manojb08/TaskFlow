import { useEffect, useState } from 'react'
import { UserPlus } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { UserAvatar } from '@/components/common/UserAvatar'
import { useUsers } from '@/hooks/useUsers'
import { useMyTasksCount } from '@/hooks/useMyTasksCount'
import { useToast } from '@/components/ui/toast'
import { listTasks } from '@/api/tasks'

export function TeamPage() {
  const { users, isLoading } = useUsers()
  const myTasksCount = useMyTasksCount()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [taskCounts, setTaskCounts] = useState<Record<string, number>>({})

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

  return (
    <AppShell breadcrumb="Team" myTasksCount={myTasksCount}>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink">Team</h1>
          <p className="mt-1 text-sm text-ink/50">People working on your projects.</p>
        </div>
        <Button onClick={() => toast({ title: 'Invites are not available in this demo' })}>
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
            <TableHead>Assigned tasks</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={4}>
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
                  <TableCell className="text-ink/60">{taskCounts[member._id] ?? '—'} tasks</TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </AppShell>
  )
}
