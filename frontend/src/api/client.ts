import type { ApiErrorBody } from '@/types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1'

export class ApiClientError extends Error {
  status: number
  code: string
  details?: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

// Held in memory only (never localStorage) — the httpOnly refresh cookie is what survives a reload.
let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

type RefreshHandler = () => Promise<string | null>
let refreshHandler: RefreshHandler | null = null
let pendingRefresh: Promise<string | null> | null = null

export function registerRefreshHandler(handler: RefreshHandler) {
  refreshHandler = handler
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT'
  body?: unknown
  skipAuthRetry?: boolean
}

async function rawRequest<T>(path: string, options: RequestOptions): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    credentials: 'include',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const isJson = res.headers.get('content-type')?.includes('application/json')
  const payload = isJson ? await res.json() : null

  if (!res.ok) {
    const errBody = payload as ApiErrorBody | null
    throw new ApiClientError(
      res.status,
      errBody?.error?.code ?? 'UNKNOWN_ERROR',
      errBody?.error?.message ?? res.statusText,
      errBody?.error?.details,
    )
  }

  return payload as T
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  try {
    return await rawRequest<T>(path, options)
  } catch (err) {
    const isAuthError = err instanceof ApiClientError && err.status === 401
    if (isAuthError && !options.skipAuthRetry && refreshHandler) {
      pendingRefresh ??= refreshHandler().finally(() => {
        pendingRefresh = null
      })
      const newToken = await pendingRefresh
      if (newToken) {
        return rawRequest<T>(path, { ...options, skipAuthRetry: true })
      }
    }
    throw err
  }
}
