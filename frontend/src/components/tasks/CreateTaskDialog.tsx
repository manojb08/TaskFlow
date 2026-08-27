import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { TaskFormFields, emptyTaskForm, type TaskFormState } from './TaskFormFields'
import { useUsers } from '@/hooks/useUsers'
import { createTask } from '@/api/tasks'
import { useToast } from '@/components/ui/toast'
import { ApiClientError } from '@/api/client'
import type { Task } from '@/types'

export function CreateTaskDialog({ onCreated }: { onCreated: (task: Task) => void }) {
  const { users } = useUsers()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<TaskFormState>(emptyTaskForm())
  const [titleError, setTitleError] = useState<string | undefined>()
  const [submitting, setSubmitting] = useState(false)

  function reset() {
    setForm(emptyTaskForm())
    setTitleError(undefined)
  }

  async function onSubmit() {
    if (!form.title.trim()) {
      setTitleError('Title is required')
      return
    }
    setSubmitting(true)
    try {
      const res = await createTask({
        title: form.title.trim(),
        description: form.description.trim(),
        status: form.status,
        priority: form.priority,
        assignee: form.assigneeId,
        dueDate: form.dueDate || null,
      })
      toast({ title: 'Task created', variant: 'success' })
      onCreated(res.data.task)
      setOpen(false)
      reset()
    } catch (err) {
      toast({
        title: 'Could not create task',
        description: err instanceof ApiClientError ? err.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Create Task
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
        </DialogHeader>
        <TaskFormFields value={form} onChange={setForm} users={users} titleError={titleError} />
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting ? 'Creating…' : 'Create Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
