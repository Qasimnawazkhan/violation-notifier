import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/nextauth'
import { redirect } from 'next/navigation'
import { updateCredentials } from './actions'

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>
}

export default async function AccountPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const email = session.user?.email ?? ''
  const username = session.user?.name ?? ''

  const updated = searchParams?.updated === '1'
  const error =
    typeof searchParams?.error === 'string' ? searchParams?.error : undefined

  return (
    <main style={{ padding: 24, maxWidth: 640, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 12 }}>My account</h1>
      <p style={{ marginTop: 0, color: '#6b7280' }}>
        You can sign in with your email or username. Update your username or password below.
      </p>

      {updated && (
        <div
          style={{
            marginBottom: 12,
            padding: 12,
            border: '1px solid #bbf7d0',
            background: '#f0fdf4',
            color: '#166534',
            borderRadius: 6,
          }}
        >
          Changes saved.
        </div>
      )}
      {error && (
        <div
          style={{
            marginBottom: 12,
            padding: 12,
            border: '1px solid #fecaca',
            background: '#fef2f2',
            color: '#991b1b',
            borderRadius: 6,
          }}
        >
          {error}
        </div>
      )}

      <section
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          padding: 16,
          background: 'white',
        }}
      >
        <form action={updateCredentials}>
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label style={{ display: 'grid', gap: 6 }}>
                <span>Current email</span>
                <input
                  value={email}
                  readOnly
                  style={{
                    padding: '8px 10px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 6,
                    background: '#f9fafb',
                  }}
                />
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span>Current username</span>
                <input
                  value={username}
                  readOnly
                  style={{
                    padding: '8px 10px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 6,
                    background: '#f9fafb',
                  }}
                />
              </label>
            </div>

            <label style={{ display: 'grid', gap: 6 }}>
              <span>New username (optional)</span>
              <input
                name="newUsername"
                placeholder="Enter a new username or leave blank"
                style={{ padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 6 }}
              />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span>New password (optional)</span>
              <input
                name="newPassword"
                type="password"
                placeholder="At least 6 characters"
                style={{ padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 6 }}
              />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span>Current password (required to save changes)</span>
              <input
                name="currentPassword"
                type="password"
                required
                placeholder="Enter your current password to confirm"
                style={{ padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 6 }}
              />
            </label>

            <div>
              <button
                type="submit"
                style={{
                  padding: '8px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: 6,
                  background: '#111827',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                Save changes
              </button>
            </div>
          </div>
        </form>
      </section>
    </main>
  )
}