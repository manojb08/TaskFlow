import { type FormEvent, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import { setPassword } from '@/api/auth'
import { ApiClientError } from '@/api/client'

const HEADINGS = {
  invite: 'Set your password',
  reset: 'Reset your password',
} as const

export function SetPasswordPage({ mode }: { mode: 'invite' | 'reset' }) {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const { toast } = useToast()

  const [password, setPasswordValue] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      await setPassword(token as string, password)
      toast({ title: 'Password set successfully', variant: 'success' })
      navigate('/login', { replace: true })
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-ink text-sm font-bold text-white">
              T
            </div>
            <span className="font-heading text-lg font-bold text-ink">TaskFlow</span>
          </div>
          <h1 className="font-heading text-2xl font-bold text-ink">{HEADINGS[mode]}</h1>
          <p className="mt-1 text-sm text-ink/50">Choose a new password for your account.</p>
        </div>

        {!token ? (
          <div className="rounded-[10px] border border-border bg-white p-6 shadow-xs">
            <p className="rounded-[6px] bg-destructive-bg px-3 py-2 text-sm text-destructive">
              This link is invalid or has expired.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="rounded-[10px] border border-border bg-white p-6 shadow-xs">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPasswordValue(e.target.value)}
                />
                <p className="text-xs text-ink/40">At least 8 characters.</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              {error && <p className="rounded-[6px] bg-destructive-bg px-3 py-2 text-sm text-destructive">{error}</p>}

              <Button type="submit" disabled={submitting} className="mt-1 w-full">
                {submitting ? 'Saving…' : 'Set password'}
              </Button>
            </div>
          </form>
        )}

        <p className="mt-5 text-center text-sm text-ink/50">
          <Link to="/login" className="font-medium text-accent hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
