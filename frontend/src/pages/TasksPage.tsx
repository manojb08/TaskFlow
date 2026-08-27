import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { TaskFilters } from '@/components/tasks/TaskFilters'
import { TaskTable } from '@/components/tasks/TaskTable'
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog'
import { DeleteTaskDialog } from '@/components/tasks/DeleteTaskDialog'
import { Pagination } from '@/components/common/Pagination'
import { useTaskList } from '@/hooks/useTaskList'
import { useUsers } from '@/hooks/useUsers'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useMyTasksCount } from '@/hooks/useMyTasksCount'
import type { Task, TaskPriority, TaskStatus } from '@/types'
import type { TaskListParams } from '@/api/tasks'

const PAGE_SIZE = 8

export function TasksPage({ fixedAssignee }: { fixedAssignee?: string }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const { users } = useUsers()
  const myTasksCount = useMyTasksCount()
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null)

  const search = searchParams.get('search') ?? ''
  const status = searchParams.get('status') ?? ''
  const priority = searchParams.get('priority') ?? ''
  const assignee = fixedAssignee ?? searchParams.get('assignee') ?? ''
  const sortBy = (searchParams.get('sortBy') as TaskListParams['sortBy']) ?? 'updatedAt'
  const sortOrder = (searchParams.get('sortOrder') as TaskListParams['sortOrder']) ?? 'desc'
  const page = Number(searchParams.get('page') ?? '1')

  const debouncedSearch = useDebouncedValue(search, 300)

  function updateParams(patch: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams)
    Object.entries(patch).forEach(([key, value]) => {
      if (value) next.set(key, value)
      else next.delete(key)
    })
    if (!('page' in patch)) next.delete('page')
    setSearchParams(next, { replace: true })
  }

  const params: TaskListParams = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: debouncedSearch || undefined,
      status: (status as TaskStatus) || undefined,
      priority: (priority as TaskPriority) || undefined,
      assignee: assignee || undefined,
      sortBy,
      sortOrder,
    }),
    [page, debouncedSearch, status, priority, assignee, sortBy, sortOrder],
  )

  const { tasks, isLoading, error, meta, refetch, setTasks } = useTaskList(params)

  const hasActiveFilters = Boolean(search || status || priority || (assignee && !fixedAssignee))

  function clearAll() {
    setSearchParams({}, { replace: true })
  }

  return (
    <AppShell breadcrumb={fixedAssignee ? 'My Tasks' : 'Tasks'} myTasksCount={myTasksCount}>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink">{fixedAssignee ? 'My Tasks' : 'Tasks'}</h1>
          <p className="mt-1 text-sm text-ink/50">
            {fixedAssignee ? 'Tasks assigned to you.' : 'Manage and track work across the team.'}
          </p>
        </div>
        <CreateTaskDialog onCreated={(task) => setTasks((prev) => [task, ...prev])} />
      </div>

      <div className="mb-4">
        <TaskFilters
          search={search}
          onSearchChange={(v) => updateParams({ search: v || null })}
          status={status}
          onStatusChange={(v) => updateParams({ status: v || null })}
          priority={priority}
          onPriorityChange={(v) => updateParams({ priority: v || null })}
          assignee={fixedAssignee ? '' : assignee}
          onAssigneeChange={(v) => updateParams({ assignee: v || null })}
          sortBy={sortBy ?? 'updatedAt'}
          sortOrder={sortOrder ?? 'desc'}
          onSortChange={(nextSortBy, nextSortOrder) => updateParams({ sortBy: nextSortBy, sortOrder: nextSortOrder })}
          users={users}
          onClearAll={clearAll}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      <TaskTable
        tasks={tasks}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        onDeleteRequest={setDeleteTarget}
        onClearFilters={clearAll}
        hasActiveFilters={hasActiveFilters}
      />

      {!isLoading && !error && (
        <div className="mt-4">
          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            total={meta.total}
            limit={meta.limit}
            onPageChange={(p) => updateParams({ page: String(p) })}
          />
        </div>
      )}

      <DeleteTaskDialog
        task={deleteTarget}
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onDeleted={(id) => setTasks((prev) => prev.filter((t) => t._id !== id))}
      />
    </AppShell>
  )
}
