import * as React from 'react'
import AppShell from '@/components/AppShell'

export default async function AdminGroupLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}