import { apiRequest } from './client'
import type { User, UserRole } from '@/types'

export function listUsers() {
  return apiRequest<{ success: true; data: { users: User[] } }>('/users')
}

export function inviteUser(input: { name: string; email: string; role?: UserRole }) {
  return apiRequest<{ success: true; data: { user: User; inviteToken: string; inviteUrl: string } }>('/users', {
    method: 'POST',
    body: input,
  })
}

export function updateMe(input: { name: string }) {
  return apiRequest<{ success: true; data: { user: User } }>('/users/me', { method: 'PATCH', body: input })
}
