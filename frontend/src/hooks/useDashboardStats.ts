import { useEffect, useState } from 'react'
import { getTaskStats } from '@/api/tasks'
import { subscribe } from '@/lib/socket'
import type { TaskStats } from '@/types'

export function useDashboardStats() {
  const [stats, setStats] = useState<TaskStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [reloadToken, setReloadToken] = useState(0)

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
  }, [reloadToken])

  useEffect(() => {
    const bump = () => setReloadToken((t) => t + 1)
    const unsubs = [subscribe('task:created', bump), subscribe('task:updated', bump), subscribe('task:deleted', bump)]
    return () => unsubs.forEach((unsub) => unsub())
  }, [])

  return { stats, isLoading }
}
