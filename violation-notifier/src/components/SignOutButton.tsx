'use client'
import { signOut } from 'next-auth/react'

export default function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="text-red-600 text-sm underline"
    >
      Sign out
    </button>
  )
}