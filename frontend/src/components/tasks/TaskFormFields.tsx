import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PRIORITY_LABELS, STATUS_LABELS, TASK_PRIORITIES, TASK_STATUSES } from '@/types'
import type { TaskPriority, TaskStatus, User } from '@/types'

const UNASSIGNED = '__unassigned__'

export interface TaskFormState {
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  assigneeId: string | null
  dueDate: string // yyyy-mm-dd, '' = none
}

interface TaskFormFieldsProps {
  value: TaskFormState
  onChange: (next: TaskFormState) => void
  users: User[]
  titleError?: string
  dueDateError?: string
}

export function TaskFormFields({ value, onChange, users, titleError, dueDateError }: TaskFormFieldsProps) {
  function set<K extends keyof TaskFormState>(key: K, val: TaskFormState[K]) {
    onChange({ ...value, [key]: val })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="task-title">
          Task Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="task-title"
          value={value.title}
          onChange={(e) => set('title', e.target.value)}
          maxLength={200}
        />
        {titleError && <p className="text-xs text-destructive">{titleError}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="task-description">Description</Label>
          <span className="text-xs text-ink/30">{value.description.length}/2000</span>
        </div>
        <Textarea
          id="task-description"
          value={value.description}
          onChange={(e) => set('description', e.target.value)}
          maxLength={2000}
          placeholder="Add context, acceptance criteria or links..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Status</Label>
          <Select value={value.status} onValueChange={(v) => set('status', v as TaskStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Priority</Label>
          <Select value={value.priority} onValueChange={(v) => set('priority', v as TaskPriority)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Assignee</Label>
          <Select
            value={value.assigneeId ?? UNASSIGNED}
            onValueChange={(v) => set('assigneeId', v === UNASSIGNED ? null : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
              {users.map((u) => (
                <SelectItem key={u._id} value={u._id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="task-due-date">Due Date</Label>
          <Input
            id="task-due-date"
            type="date"
            value={value.dueDate}
            onChange={(e) => set('dueDate', e.target.value)}
          />
          {dueDateError && <p className="text-xs text-destructive">{dueDateError}</p>}
        </div>
      </div>
    </div>
  )
}

export function emptyTaskForm(): TaskFormState {
  return { title: '', description: '', status: 'todo', priority: 'medium', assigneeId: null, dueDate: '' }
}
