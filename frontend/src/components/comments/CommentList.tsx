import { formatDistanceToNowStrict } from 'date-fns'
import { MoreHorizontal } from 'lucide-react'
import { UserAvatar } from '@/components/common/UserAvatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/context/AuthContext'
import type { Comment } from '@/types'

interface CommentListProps {
  comments: Comment[]
  isLoading: boolean
  onDelete: (commentId: string) => void
}

export function CommentList({ comments, isLoading, onDelete }: CommentListProps) {
  const { user } = useAuth()

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-2 h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (comments.length === 0) {
    return <p className="py-4 text-sm text-ink/40">No comments yet. Start the discussion below.</p>
  }

  return (
    <div className="flex flex-col divide-y divide-border">
      {comments.map((comment) => {
        const canDelete = user?._id === comment.author._id || user?.role === 'admin'
        return (
          <div key={comment._id} className="flex gap-3 py-4 first:pt-0">
            <UserAvatar user={comment.author} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm">
                  <span className="font-medium text-ink">{comment.author.name}</span>{' '}
                  <span className="text-ink/40">
                    {formatDistanceToNowStrict(new Date(comment.createdAt), { addSuffix: true })}
                  </span>
                </p>
                {canDelete && (
                  <DropdownMenu>
                    <DropdownMenuTrigger className="text-ink/30 hover:text-ink/60" aria-label="Comment actions">
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem destructive onSelect={() => onDelete(comment._id)}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm text-ink/80">{comment.body}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
