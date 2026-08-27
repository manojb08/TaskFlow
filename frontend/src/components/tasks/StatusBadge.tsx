import { Badge } from '@/components/ui/badge'
import { STATUS_LABELS, type TaskStatus } from '@/types'

const STATUS_VARIANT: Record<TaskStatus, 'default' | 'accent' | 'warning' | 'success' | 'destructive'> = {
  todo: 'default',
  in_progress: 'accent',
  in_review: 'warning',
  done: 'success',
  blocked: 'destructive',
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <Badge variant={STATUS_VARIANT[status]} dot>
      {STATUS_LABELS[status]}
    </Badge>
  )
}
