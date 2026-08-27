import { cn } from '@/lib/utils'
import { PRIORITY_LABELS, type TaskPriority } from '@/types'

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  low: 'text-ink/40',
  medium: 'text-ink/60',
  high: 'text-warning',
  urgent: 'text-destructive',
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-sm font-medium', PRIORITY_COLOR[priority])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {PRIORITY_LABELS[priority]}
    </span>
  )
}
