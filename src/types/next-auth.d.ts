import type { DefaultSession } from 'next-auth'
import type { Role } from '@prisma/client'

/**
 * Re-export Prisma Role enum as AppRole for clarity if you ever need
 * to decouple in the future (e.g. introduce composite roles).
 */
export type AppRole = Role

declare module 'next-auth' {
  /**
   * User model as it exists in your database after authentication.
   * - `id` is always present after a successful login.
   * - `role` uses the Prisma Role enum (AppRole).
   * - `company_id` may be null (e.g. system-wide admin).
   */
  interface User {
    id: string
    role: AppRole
    company_id: string | null
  }

  /**
   * Augmented session:
   * - `session.user` merges DefaultSession['user'] with your fields.
   * - Marked as required (not optional) because once a session exists,
   *   you rely on these fields in server actions / route handlers.
   *   If you prefer stricter null checking before auth, change to `user?:`.
   */
  interface Session {
    user: {
      id: string
      role: AppRole
      company_id: string | null
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  /**
   * JWT payload persisted during callbacks.
   * Fields copied into session in the session callback.
   */
  interface JWT {
    id?: string
    role?: AppRole
    company_id?: string | null
  }
}