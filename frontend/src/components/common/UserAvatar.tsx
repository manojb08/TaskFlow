import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn, initials } from '@/lib/utils'
import type { User } from '@/types'

const PALETTE = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-violet-100 text-violet-700',
  'bg-cyan-100 text-cyan-700',
]

function colorFor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return PALETTE[hash % PALETTE.length]
}

export function UserAvatar({ user, className }: { user: Pick<User, '_id' | 'name'>; className?: string }) {
  return (
    <Avatar className={cn('h-7 w-7', className)}>
      <AvatarFallback className={colorFor(user._id)}>{initials(user.name)}</AvatarFallback>
    </Avatar>
  )
}
