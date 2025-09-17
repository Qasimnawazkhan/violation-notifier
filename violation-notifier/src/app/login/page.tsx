'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams, useRouter } from 'next/navigation'
import type { Route } from 'next'

const ALLOWED_ROUTES: Route[] = [
  '/violations',
  '/login',
  '/admin/companies',
  '/company/drivers'
]

function coerceCallbackUrl(raw: string | null | undefined): Route {
  if (!raw) return '/violations'
  // Strip query and hash for route comparison
  const base = raw.split('?')[0].split('#')[0]
  if (ALLOWED_ROUTES.includes(base as Route)) {
    return base as Route
  }
  return '/violations'
}

export default function LoginPage() {
  const params = useSearchParams()
  const router = useRouter()

  const callbackUrl = coerceCallbackUrl(params.get('callbackUrl'))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
      callbackUrl
    })

    setLoading(false)

    if (res?.error) {
      setError(res.error)
      return
    }

    // We know callbackUrl is a valid Route now
    router.push(callbackUrl)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white border rounded p-6 space-y-4 shadow-sm"
      >
        <h1 className="text-lg font-semibold text-center">Sign In</h1>
        {error && (
          <div className="text-sm text-red-600 border border-red-300 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}
        <div className="space-y-1">
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            autoComplete="email"
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-300"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Password</label>
          <input
            type="password"
            autoComplete="current-password"
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-300"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
        <p className="text-xs text-gray-500 text-center">
          Use seed credentials (admin@example.com / admin123)
        </p>
      </form>
    </div>
  )
}