import { useEffect, useState } from 'react'
import { listTasks } from '@/api/tasks'
import { useAuth } from '@/context/AuthContext'

export function useMyTasksCount(): number | undefined {
  const { user } = useAuth()
  const [count, setCount] = useState<number | undefined>(undefined)

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
  }, [user])

  return count
}
