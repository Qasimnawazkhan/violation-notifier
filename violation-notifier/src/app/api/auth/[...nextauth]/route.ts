import NextAuth, { type NextAuthOptions, type User } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/server/db'
import bcrypt from 'bcryptjs'

type Role = 'system_admin' | 'company_admin' | 'company_user'

interface ExtendedUser extends User {
  role: Role
  company_id?: string | null
  password_hash?: string | null
}

const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials): Promise<ExtendedUser | null> {
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
        const u = user as ExtendedUser
        token.role = u.role
        token.company_id = u.company_id ?? null
      }
      return token
    },
    async session({ session, token }) {
      // token.* come from JWT callback (module augmentation handles types)
      session.role = token.role as Role | undefined
      session.company_id = token.company_id as string | null | undefined
      return session
    }
  },
  pages: {
    signIn: '/login'
  }
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }