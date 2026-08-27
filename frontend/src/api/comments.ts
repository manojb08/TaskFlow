import { apiRequest } from './client'
import type { Comment } from '@/types'

interface ListResponse {
  success: true
  data: { comments: Comment[] }
  meta: { page: number; limit: number; total: number; totalPages: number }
}

interface CommentResponse {
  success: true
  data: { comment: Comment }
}

export function listComments(taskId: string) {
  return apiRequest<ListResponse>(`/tasks/${taskId}/comments?limit=100`)
}

export function createComment(taskId: string, body: string) {
  return apiRequest<CommentResponse>(`/tasks/${taskId}/comments`, { method: 'POST', body: { body } })
}

export function deleteComment(commentId: string) {
  return apiRequest<{ success: true }>(`/comments/${commentId}`, { method: 'DELETE' })
}
