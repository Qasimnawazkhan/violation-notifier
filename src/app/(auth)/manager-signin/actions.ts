'use server'

import { signIn } from 'next-auth/react'

export async function signInManager(identifier: string, password: string) {
  return signIn('manager', {
    identifier,
    password,
    callbackUrl: '/manager',
    redirect: true,
  })
}