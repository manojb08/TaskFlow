import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { forgotPassword } from '@/api/auth'
import { ApiClientError } from '@/api/client'

function toRelativePath(url: string) {
  try {
    const parsed = new URL(url)
    return `${parsed.pathname}${parsed.search}`
  } catch {
    return url
  }
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resetUrl, setResetUrl] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await forgotPassword(email)
      setResetUrl(res.data.resetUrl ?? null)
      setSubmitted(true)
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
          <h1 className="font-heading text-2xl font-bold text-ink">Forgot your password?</h1>
          <p className="mt-1 text-sm text-ink/50">Enter your email and we&apos;ll send you a reset link.</p>
        </div>

        {submitted ? (
          <div className="rounded-[10px] border border-border bg-white p-6 shadow-xs">
            <p className="text-sm text-ink">If that email exists, we&apos;ve generated a reset link.</p>
            {resetUrl && (
              <div className="mt-4 rounded-[8px] border border-accent/20 bg-accent/10 p-3">
                <p className="text-xs font-medium text-ink">
                  Dev mode - no email service is configured, so here&apos;s the link directly:
                </p>
                <Link
                  to={toRelativePath(resetUrl)}
                  className="mt-1 block break-all text-sm text-accent hover:underline"
                >
                  {resetUrl}
                </Link>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={onSubmit} className="rounded-[10px] border border-border bg-white p-6 shadow-xs">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {error && <p className="rounded-[6px] bg-destructive-bg px-3 py-2 text-sm text-destructive">{error}</p>}

              <Button type="submit" disabled={submitting} className="mt-1 w-full">
                {submitting ? 'Sending…' : 'Send reset link'}
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
