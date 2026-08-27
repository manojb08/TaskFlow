import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { listTasks, type TaskListParams } from '@/api/tasks'
import { ApiClientError } from '@/api/client'
import type { Task } from '@/types'

interface UseTaskListResult {
  tasks: Task[]
  isLoading: boolean
  error: string | null
  meta: { page: number; limit: number; total: number; totalPages: number }
  refetch: () => void
  setTasks: Dispatch<SetStateAction<Task[]>>
}

export function useTaskList(params: TaskListParams): UseTaskListResult {
  const [tasks, setTasks] = useState<Task[]>([])
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const paramsKey = JSON.stringify(params)

  const fetchTasks = useCallback(() => {
    setIsLoading(true)
    setError(null)
    listTasks(params)
      .then((res) => {
        setTasks(res.data.tasks)
        setMeta(res.meta)
      })
      .catch((err) => {
        setError(err instanceof ApiClientError ? err.message : 'Failed to load tasks. Please try again.')
      })
      .finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey, reloadToken])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const refetch = useCallback(() => setReloadToken((t) => t + 1), [])

  return { tasks, isLoading, error, meta, refetch, setTasks }
}
