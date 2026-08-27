import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ForgotPasswordPage } from './ForgotPasswordPage'
import * as authApi from '@/api/auth'

vi.mock('@/api/auth')

function renderForgotPasswordPage() {
  return render(
    <MemoryRouter initialEntries={['/forgot-password']}>
      <ForgotPasswordPage />
    </MemoryRouter>,
  )
}

describe('ForgotPasswordPage', () => {
  it('calls forgotPassword with the entered email and shows the confirmation message', async () => {
    vi.mocked(authApi.forgotPassword).mockResolvedValue({
      success: true,
      data: { message: 'If that email exists, we have generated a reset link.' },
    })
    renderForgotPasswordPage()

    await userEvent.type(screen.getByLabelText('Email'), 'alex@taskflow.io')
    await userEvent.click(screen.getByRole('button', { name: 'Send reset link' }))

    await waitFor(() => expect(authApi.forgotPassword).toHaveBeenCalledWith('alex@taskflow.io'))
    expect(
      await screen.findByText("If that email exists, we've generated a reset link."),
    ).toBeInTheDocument()
  })
})
