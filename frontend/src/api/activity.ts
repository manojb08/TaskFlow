import { apiRequest } from './client'
import type { ActivityEntry } from '@/types'

interface ListResponse {
  success: true
  data: { activity: ActivityEntry[] }
}

export function listActivity(taskId: string) {
  return apiRequest<ListResponse>(`/tasks/${taskId}/activity`)
}
