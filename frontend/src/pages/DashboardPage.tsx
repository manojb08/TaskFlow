import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, CircleDot, Layers, ListTodo } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog'
import { TaskTable } from '@/components/tasks/TaskTable'
import { DeleteTaskDialog } from '@/components/tasks/DeleteTaskDialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/context/AuthContext'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { useTaskList } from '@/hooks/useTaskList'
import { useMyTasksCount } from '@/hooks/useMyTasksCount'
import type { Task } from '@/types'

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function DashboardPage() {
  const { user } = useAuth()
  const { stats, isLoading: statsLoading } = useDashboardStats()
  const myTasksCount = useMyTasksCount()
  const { tasks, isLoading, error, refetch, setTasks } = useTaskList({
    limit: 6,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  })
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null)

  const firstName = user?.name.split(' ')[0] ?? ''

  const cards = [
    { label: 'Total Tasks', value: stats?.total, icon: Layers },
    { label: 'To Do', value: stats?.todo, icon: CircleDot },
    { label: 'In Progress', value: stats?.inProgress, icon: ListTodo },
    { label: 'Completed', value: stats?.done, icon: CheckCircle2 },
  ]

  return (
    <AppShell breadcrumb="Dashboard" myTasksCount={myTasksCount}>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink">
            {greeting()}, {firstName}
          </h1>
          <p className="mt-1 text-sm text-ink/50">Here&apos;s what&apos;s happening with your tasks.</p>
        </div>
        <CreateTaskDialog onCreated={(task) => setTasks((prev) => [task, ...prev])} />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-[10px] border border-border bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-ink/50">{card.label}</p>
              <card.icon className="h-4 w-4 text-ink/30" />
            </div>
            {statsLoading ? (
              <Skeleton className="mt-2 h-8 w-12" />
            ) : (
              <p className="mt-1 font-heading text-3xl font-bold text-ink">{card.value ?? '—'}</p>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-[10px] border border-border bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Recent Tasks</h2>
          <Link to="/tasks" className="flex items-center gap-1 text-sm font-medium text-accent hover:underline">
            View all tasks
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <TaskTable
          tasks={tasks}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          onDeleteRequest={setDeleteTarget}
          hasActiveFilters={false}
        />
      </div>

      <DeleteTaskDialog
        task={deleteTarget}
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onDeleted={(id) => setTasks((prev) => prev.filter((t) => t._id !== id))}
      />
    </AppShell>
  )
}
