import { DefaultSession } from "next-auth"

type Role = "system_admin" | "company_admin" | "company_user"

declare module "next-auth" {
  interface Session extends DefaultSession {
    role?: Role
    company_id?: string | null
    user: {
      id?: string
      email?: string | null
    } & DefaultSession["user"]
  }

  interface User {
    id?: string
    email?: string | null
    role: Role
    company_id?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role
    company_id?: string | null
  }
}

export {}