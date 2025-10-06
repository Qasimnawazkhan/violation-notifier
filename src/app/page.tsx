import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/nextauth'
import { redirect } from 'next/navigation'

export default async function Home() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const role = session.user.role
  if (role === 'system_admin') redirect('/admin')
  if (role === 'company_admin') redirect('/dashboard')

  redirect('/login')
}