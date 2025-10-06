import type { NextAuthOptions, Session, User as NextAuthUser } from 'next-auth'
import type { JWT } from 'next-auth/jwt'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/server/db'
import { Role } from '@prisma/client'

// Extend NextAuth User type to include role and company_id
declare module "next-auth" {
  interface User {
    role: Role
    company_id: string | null
  }
}

// If other files referenced AuthorizedUser, keep a single exported alias to NextAuth's User.
// Ensure there is NO other interface or type named AuthorizedUser elsewhere.
export type AuthorizedUser = NextAuthUser

async function verifyUser(params: {
  identifier: string
  password: string
  role: Role
}): Promise<NextAuthUser | null> {
  const id = params.identifier.trim().toLowerCase()
  const password = params.password
  if (!id || !password) return null

  const user = await prisma.user.findFirst({
    where: {
      role: params.role,
      OR: [{ email: id }, { username: id }],
    },
    select: {
      id: true,
      email: true,
      username: true,
      password_hash: true,
      role: true,
      company_id: true,
    },
  })
  if (!user) return null

  const ok = await bcrypt.compare(password, user.password_hash)
  if (!ok) return null

  // name must be string | null (never undefined)
  const result: NextAuthUser = {
    id: user.id,
    email: user.email,
    name: user.username ?? user.email ?? null,
    // augmented fields from src/types/next-auth.d.ts:
    role: user.role,
    company_id: user.company_id,
  } as NextAuthUser

  return result
}

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      id: 'admin',
      name: 'Admin',
      credentials: {
        email: { label: 'Email or username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const identifier = credentials?.email ?? ''
        const password = credentials?.password ?? ''
        return verifyUser({ identifier, password, role: Role.system_admin })
      },
    }),
    Credentials({
      id: 'manager',
      name: 'Company Manager',
      credentials: {
        email: { label: 'Email or username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const identifier = credentials?.email ?? ''
        const password = credentials?.password ?? ''
        return verifyUser({ identifier, password, role: Role.company_admin })
      },
    }),
  ],
  callbacks: {
    async jwt(
      { token, user }: { token: JWT; user?: NextAuthUser | null }
    ): Promise<JWT> {
      if (user) {
        token.role = user.role as Role
        token.company_id = user.company_id ?? null
      }
      return token
    },
    async session(
      { session, token }: { session: Session; token: JWT }
    ): Promise<Session> {
      if (session.user) {
        if (token.role) session.user.role = token.role as Role
        session.user.company_id = (token.company_id ?? null) as string | null
      }
      return session
    },
  },
}