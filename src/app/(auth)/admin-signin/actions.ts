'use server'

import { signIn } from 'next-auth/react'

export async function signInAdmin(identifier: string, password: string) {
  return signIn('admin', {
    identifier,
    password,
    callbackUrl: '/admin',
    redirect: true,
  })
}