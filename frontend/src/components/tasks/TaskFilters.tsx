import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { PRIORITY_LABELS, STATUS_LABELS, TASK_PRIORITIES, TASK_STATUSES } from '@/types'
import type { User } from '@/types'
import type { TaskListParams } from '@/api/tasks'

const ALL = '__all__'

interface TaskFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  status: string
  onStatusChange: (value: string) => void
  priority: string
  onPriorityChange: (value: string) => void
  assignee: string
  onAssigneeChange: (value: string) => void
  sortBy: NonNullable<TaskListParams['sortBy']>
  sortOrder: NonNullable<TaskListParams['sortOrder']>
  onSortChange: (sortBy: NonNullable<TaskListParams['sortBy']>, sortOrder: NonNullable<TaskListParams['sortOrder']>) => void
  users: User[]
  onClearAll: () => void
  hasActiveFilters: boolean
}

const SORT_OPTIONS: { value: string; label: string; sortBy: NonNullable<TaskListParams['sortBy']>; sortOrder: NonNullable<TaskListParams['sortOrder']> }[] = [
  { value: 'updated-desc', label: 'Last updated', sortBy: 'updatedAt', sortOrder: 'desc' },
  { value: 'created-desc', label: 'Newest created', sortBy: 'createdAt', sortOrder: 'desc' },
  { value: 'created-asc', label: 'Oldest created', sortBy: 'createdAt', sortOrder: 'asc' },
  { value: 'priority-desc', label: 'Priority (high first)', sortBy: 'priority', sortOrder: 'desc' },
  { value: 'title-asc', label: 'Title (A–Z)', sortBy: 'title', sortOrder: 'asc' },
]

export function TaskFilters(props: TaskFiltersProps) {
  const {
    search,
    onSearchChange,
    status,
    onStatusChange,
    priority,
    onPriorityChange,
    assignee,
    onAssigneeChange,
    sortBy,
    sortOrder,
    onSortChange,
    users,
    onClearAll,
    hasActiveFilters,
  } = props

  const activeSortValue =
    SORT_OPTIONS.find((o) => o.sortBy === sortBy && o.sortOrder === sortOrder)?.value ?? 'updated-desc'

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative sm:w-64">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink/30" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search tasks..."
          className="pl-8"
        />
      </div>

      <Select value={status || ALL} onValueChange={(v) => onStatusChange(v === ALL ? '' : v)}>
        <SelectTrigger className="sm:w-40">
          <span className="text-ink/40">Status:&nbsp;</span>
          <SelectValue placeholder="All" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All</SelectItem>
          {TASK_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={priority || ALL} onValueChange={(v) => onPriorityChange(v === ALL ? '' : v)}>
        <SelectTrigger className="sm:w-40">
          <span className="text-ink/40">Priority:&nbsp;</span>
          <SelectValue placeholder="All" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All</SelectItem>
          {TASK_PRIORITIES.map((p) => (
            <SelectItem key={p} value={p}>
              {PRIORITY_LABELS[p]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={assignee || ALL} onValueChange={(v) => onAssigneeChange(v === ALL ? '' : v)}>
        <SelectTrigger className="sm:w-44">
          <span className="text-ink/40">Assignee:&nbsp;</span>
          <SelectValue placeholder="Anyone" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Anyone</SelectItem>
          {users.map((u) => (
            <SelectItem key={u._id} value={u._id}>
              {u.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="sm:ml-auto flex items-center gap-2">
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearAll}>
            Clear all
          </Button>
        )}
        <Select
          value={activeSortValue}
          onValueChange={(v) => {
            const opt = SORT_OPTIONS.find((o) => o.value === v)
            if (opt) onSortChange(opt.sortBy, opt.sortOrder)
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
