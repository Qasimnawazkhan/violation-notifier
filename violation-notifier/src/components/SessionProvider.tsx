'use client'

import { SessionProvider as NextAuthProvider } from 'next-auth/react'
import type { Session } from 'next-auth'
import * as React from 'react'

export interface AppSessionProviderProps {
  children: React.ReactNode
  session?: Session | null
}

export function SessionProvider({ children, session }: AppSessionProviderProps) {
  return <NextAuthProvider session={session}>{children}</NextAuthProvider>
}