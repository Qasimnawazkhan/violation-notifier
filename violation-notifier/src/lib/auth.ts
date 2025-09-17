import type { NextAuthOptions } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/server/db'

type Role = 'system_admin' | 'company_admin' | 'company_user'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.password_hash) return null

        const ok = await bcrypt.compare(credentials.password, user.password_hash)
        if (!ok) return null

        return {
          id: user.id,
          email: user.email,
          role: user.role as Role,
          company_id: user.company_id ?? null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as {
          role: Role
          company_id?: string | null
        }
        token.role = u.role
        token.company_id = u.company_id ?? null
      }
      return token
    },
    async session({ session, token }) {
      session.role = token.role as Role | undefined
      session.company_id = token.company_id as string | null | undefined
      return session
    }
  },
  pages: {
    signIn: '/login'
  }
}