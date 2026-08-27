import { useEffect, useState } from 'react'
import { listTasks } from '@/api/tasks'

export interface DashboardStats {
  total: number
  todo: number
  inProgress: number
  done: number
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    Promise.all([
      listTasks({ limit: 1 }),
      listTasks({ limit: 1, status: 'todo' }),
      listTasks({ limit: 1, status: 'in_progress' }),
      listTasks({ limit: 1, status: 'done' }),
    ])
      .then(([all, todo, inProgress, done]) => {
        if (cancelled) return
        setStats({
          total: all.meta.total,
          todo: todo.meta.total,
          inProgress: inProgress.meta.total,
          done: done.meta.total,
        })
      })
      .catch(() => {
        if (!cancelled) setStats(null)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { stats, isLoading }
}
