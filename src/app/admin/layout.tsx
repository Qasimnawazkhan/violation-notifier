import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/nextauth' // adjust path if needed

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const role = session.user?.role
  const isAdmin = role === 'system_admin' || role === 'company_admin'
  if (!isAdmin) redirect('/')

  return <>{children}</>
}