import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { LoginPage } from './LoginPage'
import { AuthProvider } from '@/context/AuthContext'
import { ToastProvider } from '@/components/ui/toast'
import { ApiClientError } from '@/api/client'
import * as authApi from '@/api/auth'

vi.mock('@/api/auth')

function renderLoginPage() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <ToastProvider>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.mocked(authApi.refresh).mockRejectedValue(new ApiClientError(401, 'UNAUTHORIZED', 'No session'))
  })

  it('shows an error message when login fails with invalid credentials', async () => {
    vi.mocked(authApi.login).mockRejectedValue(new ApiClientError(401, 'UNAUTHORIZED', 'Invalid email or password'))
    renderLoginPage()

    await userEvent.type(screen.getByLabelText('Email'), 'user@taskflow.io')
    await userEvent.type(screen.getByLabelText('Password'), 'wrong-password')
    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }))

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument()
  })

  it('calls login with the entered credentials on submit', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      success: true,
      data: {
        user: {
          _id: '1',
          name: 'Alex Morgan',
          email: 'alex@taskflow.io',
          role: 'admin',
          status: 'active',
          createdAt: '',
          updatedAt: '',
        },
        accessToken: 'token',
      },
    })
    renderLoginPage()

    await userEvent.type(screen.getByLabelText('Email'), 'alex@taskflow.io')
    await userEvent.type(screen.getByLabelText('Password'), 'password123')
    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() =>
      expect(authApi.login).toHaveBeenCalledWith({ email: 'alex@taskflow.io', password: 'password123' }),
    )
  })
})
