import { useEffect, useState } from 'react'
import { getTaskStats } from '@/api/tasks'
import type { TaskStats } from '@/types'

export function useDashboardStats() {
  const [stats, setStats] = useState<TaskStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    getTaskStats()
      .then((res) => {
        if (cancelled) return
        setStats(res.data)
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
