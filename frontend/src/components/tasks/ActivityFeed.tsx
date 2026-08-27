import { format, formatDistanceToNowStrict } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'
import { PRIORITY_LABELS, STATUS_LABELS } from '@/types'
import type { ActivityEntry, TaskPriority, TaskStatus } from '@/types'

interface ActivityFeedProps {
  activity: ActivityEntry[]
  isLoading: boolean
}

function describeActivity(entry: ActivityEntry): string {
  const to = entry.meta?.to
  switch (entry.action) {
    case 'created':
      return 'created this task'
    case 'status_changed':
      return `moved this to ${STATUS_LABELS[to as TaskStatus]}`
    case 'priority_changed':
      return `set priority to ${PRIORITY_LABELS[to as TaskPriority]}`
    case 'assignee_changed':
      return to ? `assigned this to ${to}` : 'unassigned this task'
    case 'due_date_changed':
      return to ? `set the due date to ${format(new Date(to), 'MMM d, yyyy')}` : 'cleared the due date'
    default:
      return ''
  }
}

export function ActivityFeed({ activity, isLoading }: ActivityFeedProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    )
  }

  if (activity.length === 0) return null

  return (
    <ul className="flex flex-col gap-3 text-sm">
      {activity.map((entry) => (
        <li key={entry._id} className="text-ink/70">
          <span className="font-medium text-ink">{entry.actor.name}</span> {describeActivity(entry)}{' '}
          <span className="text-ink/40">
            · {formatDistanceToNowStrict(new Date(entry.createdAt), { addSuffix: true })}
          </span>
        </li>
      ))}
    </ul>
  )
}
