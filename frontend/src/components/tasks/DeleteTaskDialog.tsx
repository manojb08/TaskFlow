import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { deleteTask } from '@/api/tasks'
import { useToast } from '@/components/ui/toast'
import { ApiClientError } from '@/api/client'
import type { Task } from '@/types'

interface DeleteTaskDialogProps {
  task: Pick<Task, '_id' | 'title'> | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: (taskId: string) => void
}

export function DeleteTaskDialog({ task, open, onOpenChange, onDeleted }: DeleteTaskDialogProps) {
  const { toast } = useToast()
  const [deleting, setDeleting] = useState(false)

  async function onConfirm() {
    if (!task) return
    setDeleting(true)
    try {
      await deleteTask(task._id)
      toast({ title: 'Task deleted', variant: 'success' })
      onDeleted(task._id)
      onOpenChange(false)
    } catch (err) {
      toast({
        title: "Couldn't delete task",
        description: err instanceof ApiClientError ? err.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-destructive-bg">
            <Trash2 className="h-4 w-4 text-destructive" />
          </div>
          <DialogTitle>Delete this task?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-ink/60">
          &ldquo;{task?.title}&rdquo; and its comments will be permanently removed. This action can&apos;t be
          undone.
        </p>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
