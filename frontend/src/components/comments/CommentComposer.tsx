import { useMemo, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useUsers } from '@/hooks/useUsers'
import type { User } from '@/types'

interface MentionState {
  start: number
  query: string
}

function findMentionQuery(text: string, cursor: number): MentionState | null {
  const upToCursor = text.slice(0, cursor)
  const match = upToCursor.match(/(?:^|[^\w])@([A-Za-z]*)$/)
  if (!match) return null
  const query = match[1]
  return { start: cursor - query.length - 1, query }
}

function matchUsers(users: User[], query: string): User[] {
  const q = query.toLowerCase()
  return users.filter((u) => u.name.split(/\s+/).some((part) => part.toLowerCase().startsWith(q))).slice(0, 5)
}

export function CommentComposer({ onSubmit }: { onSubmit: (body: string) => Promise<void> }) {
  const { users } = useUsers()
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [mention, setMention] = useState<MentionState | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const matches = useMemo(() => (mention ? matchUsers(users, mention.query) : []), [mention, users])

  async function handleSubmit() {
    const trimmed = body.trim()
    if (!trimmed || submitting) return
    setSubmitting(true)
    try {
      await onSubmit(trimmed)
      setBody('')
      setMention(null)
    } finally {
      setSubmitting(false)
    }
  }

  function syncMentionState(value: string, cursor: number) {
    setMention(findMentionQuery(value, cursor))
  }

  function insertMention(user: User) {
    if (!mention) return
    const end = mention.start + 1 + mention.query.length
    const before = body.slice(0, mention.start)
    const after = body.slice(end)
    const insertion = `@${user.name} `
    setBody(before + insertion + after)
    setMention(null)
    const cursor = before.length + insertion.length
    requestAnimationFrame(() => {
      const el = textareaRef.current
      if (el) {
        el.focus()
        el.setSelectionRange(cursor, cursor)
      }
    })
  }

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-4">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => {
            setBody(e.target.value)
            syncMentionState(e.target.value, e.target.selectionStart)
          }}
          onSelect={(e) => syncMentionState(e.currentTarget.value, e.currentTarget.selectionStart)}
          onKeyUp={(e) => syncMentionState(e.currentTarget.value, e.currentTarget.selectionStart)}
          placeholder="Add a comment..."
          className="min-h-[72px]"
          maxLength={2000}
          onKeyDown={(e) => {
            if (mention) {
              if (e.key === 'Escape') {
                e.preventDefault()
                setMention(null)
                return
              }
              if (e.key === 'Enter') {
                if (matches.length > 0) {
                  e.preventDefault()
                  insertMention(matches[0])
                }
                return
              }
              return
            }
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
          }}
        />
        {mention && (
          <div className="absolute left-0 top-full z-10 mt-1 w-56 overflow-hidden rounded-[8px] border border-border bg-white p-1 shadow-md">
            {matches.length > 0 ? (
              matches.map((u) => (
                <button
                  key={u._id}
                  type="button"
                  onClick={() => insertMention(u)}
                  className="flex w-full items-center rounded-[6px] px-2 py-1.5 text-left text-sm text-ink hover:bg-muted"
                >
                  {u.name}
                </button>
              ))
            ) : (
              <p className="px-2 py-1.5 text-sm text-ink/40">No matches</p>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-ink/30">Use @ to mention a teammate</p>
        <Button size="sm" onClick={handleSubmit} disabled={!body.trim() || submitting}>
          <Send className="h-3.5 w-3.5" />
          {submitting ? 'Posting…' : 'Comment'}
        </Button>
      </div>
    </div>
  )
}
