import { apiRequest } from './client'
import type { User } from '@/types'

export function listUsers() {
  return apiRequest<{ success: true; data: { users: User[] } }>('/users')
}
