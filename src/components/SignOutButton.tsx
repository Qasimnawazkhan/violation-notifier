'use client'

import { signOut } from 'next-auth/react'
import React from 'react'

export default function SignOutButton() {
  const handleEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = 'rgba(255,255,255,0.18)'
  }
  const handleLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = 'rgba(255,255,255,0.12)'
  }

  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{
        padding: '8px 12px',
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.4)',
        background: 'rgba(255,255,255,0.12)',
        color: 'white',
        fontWeight: 600,
        cursor: 'pointer',
        backdropFilter: 'blur(6px)',
      }}
      aria-label="Sign out"
    >
      Sign out
    </button>
  )
}