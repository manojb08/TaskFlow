import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Pagination } from './Pagination'

describe('Pagination', () => {
  it('disables Previous on the first page and Next on the last page', () => {
    render(<Pagination page={1} totalPages={1} total={5} limit={8} onPageChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  })

  it('calls onPageChange with the next page number', async () => {
    const onPageChange = vi.fn()
    render(<Pagination page={2} totalPages={3} total={24} limit={8} onPageChange={onPageChange} />)

    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(onPageChange).toHaveBeenCalledWith(3)

    await userEvent.click(screen.getByRole('button', { name: 'Previous' }))
    expect(onPageChange).toHaveBeenCalledWith(1)
  })

  it('renders nothing when there are no results', () => {
    const { container } = render(<Pagination page={1} totalPages={0} total={0} limit={8} onPageChange={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })
})
