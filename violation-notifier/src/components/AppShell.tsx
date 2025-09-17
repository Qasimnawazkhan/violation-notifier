import * as React from 'react'

type AppShellProps = { children: React.ReactNode }

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b bg-white px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Violation Notifier</h1>
      </header>
      <main className="max-w-5xl mx-auto w-full py-8 px-6">
        {children}
      </main>
    </div>
  )
}