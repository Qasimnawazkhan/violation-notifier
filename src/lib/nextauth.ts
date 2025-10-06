import type { NextAuthOptions } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import type { Role } from '@prisma/client'

type AppUser = {
  id: string
  email: string
  name: string | null
  role: Role // 'system_admin' | 'company_admin'
  company_id: string | null
}

export const authOptions = {
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        identifier: { label: 'Email or username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const identifier = credentials?.identifier?.trim()
        const password = credentials?.password
        if (!identifier || !password) return null

        const user = await prisma.user.findFirst({
          where: {
            OR: [{ email: identifier }, { username: identifier }],
          },
        })
        if (!user) return null

        const valid = await bcrypt.compare(password, user.password_hash)
        if (!valid) return null

        const appUser: AppUser = {
          id: user.id,
          email: user.email,
          name: user.username ?? user.email,
          role: user.role,
          company_id: user.company_id ?? null,
        }
        return appUser
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // The credentials provider returns our AppUser object here
        const u = user as AppUser
        token.id = u.id
        token.role = u.role
        token.company_id = u.company_id ?? null
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        // Types are augmented in src/types/next-auth.d.ts so no "any" casts are needed
        session.user.id = token.id as string
        session.user.role = token.role as Role
        session.user.company_id = (token.company_id as string | null) ?? null
      }
      return session
    },
  },
} satisfies NextAuthOptions