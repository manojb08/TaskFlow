import { useEffect, useState } from 'react'
import { listTasks } from '@/api/tasks'
import { useAuth } from '@/context/AuthContext'
import { subscribe } from '@/lib/socket'

export function useMyTasksCount(): number | undefined {
  const { user } = useAuth()
  const [count, setCount] = useState<number | undefined>(undefined)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    if (!user) {
      setCount(undefined)
      return
    }
    let cancelled = false
    listTasks({ assignee: user._id, limit: 1 })
      .then((res) => {
        if (!cancelled) setCount(res.meta.total)
      })
      .catch(() => {
        if (!cancelled) setCount(undefined)
      })
    return () => {
      cancelled = true
    }
  }, [user, reloadToken])

  useEffect(() => {
    const bump = () => setReloadToken((t) => t + 1)
    const unsubs = [subscribe('task:created', bump), subscribe('task:updated', bump), subscribe('task:deleted', bump)]
    return () => unsubs.forEach((unsub) => unsub())
  }, [])

  return count
}
