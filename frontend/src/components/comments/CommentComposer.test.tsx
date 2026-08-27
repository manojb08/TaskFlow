import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CommentComposer } from './CommentComposer'
import { useUsers } from '@/hooks/useUsers'
import type { User } from '@/types'

vi.mock('@/hooks/useUsers')

const USERS: User[] = [
  { _id: '1', name: 'Sarah Chen', email: 'sarah@taskflow.io', role: 'member', status: 'active', createdAt: '', updatedAt: '' },
  { _id: '2', name: 'Sam Patel', email: 'sam@taskflow.io', role: 'member', status: 'active', createdAt: '', updatedAt: '' },
  { _id: '3', name: 'Alex Morgan', email: 'alex@taskflow.io', role: 'admin', status: 'active', createdAt: '', updatedAt: '' },
]

function setup() {
  vi.mocked(useUsers).mockReturnValue({ users: USERS, isLoading: false })
  return render(<CommentComposer onSubmit={vi.fn().mockResolvedValue(undefined)} />)
}

describe('CommentComposer', () => {
  it('shows mention suggestions when typing @ and inserts the selected name on click', async () => {
    setup()
    const textarea = screen.getByPlaceholderText('Add a comment...') as HTMLTextAreaElement

    await userEvent.type(textarea, '@Sa')

    expect(await screen.findByText('Sarah Chen')).toBeInTheDocument()
    expect(screen.getByText('Sam Patel')).toBeInTheDocument()
    expect(screen.queryByText('Alex Morgan')).not.toBeInTheDocument()

    await userEvent.click(screen.getByText('Sarah Chen'))

    expect(textarea.value).toBe('@Sarah Chen ')
  })
})
