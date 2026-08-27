import { apiRequest } from './client'
import type { Task, TaskPriority, TaskStatus } from '@/types'

export interface TaskListParams {
  page?: number
  limit?: number
  search?: string
  status?: TaskStatus
  priority?: TaskPriority
  assignee?: string
  sortBy?: 'createdAt' | 'updatedAt' | 'priority' | 'dueDate' | 'title'
  sortOrder?: 'asc' | 'desc'
}

interface ListResponse {
  success: true
  data: { tasks: Task[] }
  meta: { page: number; limit: number; total: number; totalPages: number }
}

interface TaskResponse {
  success: true
  data: { task: Task }
}

export interface CreateTaskInput {
  title: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  assignee?: string | null
  dueDate?: string | null
}

export type UpdateTaskInput = Partial<CreateTaskInput>

function toQueryString(params: TaskListParams): string {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value))
  })
  const qs = query.toString()
  return qs ? `?${qs}` : ''
}

export function listTasks(params: TaskListParams) {
  return apiRequest<ListResponse>(`/tasks${toQueryString(params)}`)
}

export function getTask(id: string) {
  return apiRequest<TaskResponse>(`/tasks/${id}`)
}

export function createTask(input: CreateTaskInput) {
  return apiRequest<TaskResponse>('/tasks', { method: 'POST', body: input })
}

export function updateTask(id: string, input: UpdateTaskInput) {
  return apiRequest<TaskResponse>(`/tasks/${id}`, { method: 'PATCH', body: input })
}

export function deleteTask(id: string) {
  return apiRequest<{ success: true }>(`/tasks/${id}`, { method: 'DELETE' })
}
