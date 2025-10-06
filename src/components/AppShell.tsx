import * as React from 'react'
import Link from 'next/link'
import { getServerSession } from 'next-auth'

type AppShellProps = { children: React.ReactNode; hideRightNav?: boolean }

export default async function AppShell({ children, hideRightNav = false }: AppShellProps) {
  const session = await getServerSession()

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b bg-white px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">
          <Link href="/">Violation Notifier</Link>
        </h1>

        <nav className="flex items-center gap-4 text-sm">
          {!hideRightNav && (
            <>
              {!session ? (
                <>
                  <Link href="/login?role=admin" className="hover:underline">Admin Login</Link>
                  <Link href="/login?role=manager" className="hover:underline">Manager Login</Link>
                </>
              ) : (
                <>
                  {session.user.role === 'system_admin' && (
                    <Link href="/admin/companies" className="hover:underline">Admin</Link>
                  )}
                  {(session.user.role === 'company_admin' || session.user.role === 'system_admin') && (
                    <Link href="/company/drivers" className="hover:underline">Company</Link>
                  )}
                </>
              )}
            </>
          )}
        </nav>
      </header>

      <main className="max-w-5xl mx-auto w-full py-8 px-6">{children}</main>
    </div>
  )
}   