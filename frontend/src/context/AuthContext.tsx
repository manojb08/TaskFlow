import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as authApi from '@/api/auth'
import { ApiClientError, getAccessToken, registerRefreshHandler, setAccessToken } from '@/api/client'
import { connectSocket, disconnectSocket } from '@/lib/socket'
import type { User } from '@/types'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    registerRefreshHandler(async () => {
      try {
        const res = await authApi.refresh()
        setAccessToken(res.data.accessToken)
        return res.data.accessToken
      } catch {
        setAccessToken(null)
        setUser(null)
        return null
      }
    })
  }, [])

  useEffect(() => {
    async function bootstrap() {
      try {
        const refreshRes = await authApi.refresh()
        setAccessToken(refreshRes.data.accessToken)
        const meRes = await authApi.me()
        setUser(meRes.data.user)
      } catch (err) {
        if (!(err instanceof ApiClientError)) {
          // eslint-disable-next-line no-console
          console.error('Unexpected error bootstrapping session', err)
        }
        setAccessToken(null)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }
    bootstrap()
  }, [])

  useEffect(() => {
    if (!user) return
    connectSocket()
    return () => disconnectSocket()
  }, [user])

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password })
    setAccessToken(res.data.accessToken)
    setUser(res.data.user)
  }, [])

  const registerAccount = useCallback(async (name: string, email: string, password: string) => {
    const res = await authApi.register({ name, email, password })
    setAccessToken(res.data.accessToken)
    setUser(res.data.user)
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      setAccessToken(null)
      setUser(null)
    }
  }, [])

  const refreshUser = useCallback(async () => {
    const res = await authApi.me()
    setUser(res.data.user)
  }, [])

  const value = useMemo(
    () => ({ user, isLoading, login, register: registerAccount, logout, refreshUser }),
    [user, isLoading, login, registerAccount, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}

export function hasAccessToken(): boolean {
  return getAccessToken() !== null
}
