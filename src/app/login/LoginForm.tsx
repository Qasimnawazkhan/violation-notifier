'use client'

import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const fd = new FormData(e.currentTarget)
    const identifier = String(fd.get('identifier') || '')
    const password = String(fd.get('password') || '')

    const res = await signIn('credentials', { redirect: false, identifier, password })
    if (!res || res.error) {
      setLoading(false)
      setError('Invalid credentials')
      return
    }

    try {
      // Read the session to decide where to go
      const sessRes = await fetch('/api/auth/session', { cache: 'no-store' })
      const session = await sessRes.json()
      const role = session?.user?.role as 'system_admin' | 'company_admin' | undefined

      if (role === 'system_admin') router.replace('/admin')
      else if (role === 'company_admin') router.replace('/dashboard')
      else router.replace('/')
    } catch {
      router.replace('/')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ maxWidth: 360, display: 'grid', gap: 12 }}>
      <label style={{ display: 'grid', gap: 6 }}>
        <span>Email or username</span>
        <input
          name="identifier"
          placeholder="you@example.com or your-username"
          required
          style={{ padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 6 }}
        />
      </label>

      <label style={{ display: 'grid', gap: 6 }}>
        <span>Password</span>
        <input
          name="password"
          type="password"
          placeholder="••••••••"
          required
          style={{ padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 6 }}
        />
      </label>

      {error && <div style={{ color: '#b91c1c' }}>{error}</div>}

      <button
        type="submit"
        disabled={loading}
        style={{
          padding: '8px 12px',
          border: '1px solid #e5e7eb',
          borderRadius: 6,
          background: '#111827',
          color: 'white',
          cursor: 'pointer',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}