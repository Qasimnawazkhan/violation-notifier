'use client'

import { signOut } from 'next-auth/react'

export default function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: '/login' })}
      aria-label="Sign out"
      title="Sign out"
      style={{
        padding: '6px 10px',
        border: '1px solid #e5e7eb',
        borderRadius: 6,
        background: '#f9fafb',
        cursor: 'pointer',
      }}
    >
      Sign out
    </button>
  )
}