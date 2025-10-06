import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/nextauth'
import { redirect } from 'next/navigation'
import LoginForm from './LoginForm'

export default async function LoginPage() {
  const session = await getServerSession(authOptions)

  if (session) {
    const role = session.user.role
    if (role === 'system_admin') redirect('/admin')
    if (role === 'company_admin') redirect('/dashboard')
    redirect('/') // fallback
  }

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ margin: 0, marginBottom: 12 }}>Sign in</h1>
      <LoginForm />
    </main>
  )
}