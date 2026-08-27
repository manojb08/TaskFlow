import { apiRequest } from './client'
import type { User } from '@/types'

interface AuthResponse {
  success: true
  data: { user: User; accessToken: string }
}

export function register(input: { name: string; email: string; password: string }) {
  return apiRequest<AuthResponse>('/auth/register', { method: 'POST', body: input })
}

export function login(input: { email: string; password: string }) {
  return apiRequest<AuthResponse>('/auth/login', { method: 'POST', body: input })
}

export function refresh() {
  return apiRequest<{ success: true; data: { accessToken: string } }>('/auth/refresh', {
    method: 'POST',
    skipAuthRetry: true,
  })
}

export function logout() {
  return apiRequest<{ success: true }>('/auth/logout', { method: 'POST', skipAuthRetry: true })
}

export function me() {
  return apiRequest<{ success: true; data: { user: User } }>('/auth/me')
}

export function forgotPassword(email: string) {
  return apiRequest<{
    success: true
    data: { message: string; resetToken?: string; resetUrl?: string }
  }>('/auth/forgot-password', { method: 'POST', body: { email } })
}

export function setPassword(token: string, password: string) {
  return apiRequest<{ success: true; data: { message: string } }>('/auth/set-password', {
    method: 'POST',
    body: { token, password },
  })
}
