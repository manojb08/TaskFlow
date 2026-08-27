import { useEffect, useState } from 'react'
import { listUsers } from '@/api/users'
import type { User } from '@/types'

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    listUsers()
      .then((res) => {
        if (!cancelled) setUsers(res.data.users)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { users, isLoading }
}
