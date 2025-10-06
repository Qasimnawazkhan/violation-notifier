'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/nextauth'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import type { Route } from 'next'

export async function updateCredentials(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/login' as Route)
  }

  const userId = session.user.id
  const currentPassword = String(formData.get('currentPassword') || '')
  const newUsernameRaw = (formData.get('newUsername') || '') as string
  const newPasswordRaw = (formData.get('newPassword') || '') as string

  const newUsername = newUsernameRaw.trim() || null
  const newPassword = newPasswordRaw

  if (!newUsername && !newPassword) {
    redirect('/account?error=Nothing%20to%20update' as Route)
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) redirect('/login?error=Session%20invalid' as Route)

  const valid = await bcrypt.compare(currentPassword, user.password_hash)
  if (!valid) {
    redirect('/account?error=Current%20password%20is%20incorrect' as Route)
  }

  const data: { username?: string | null; password_hash?: string } = {}
  if (newUsername !== null) data.username = newUsername.length ? newUsername : null
  if (newPassword && newPassword.length >= 6) {
    data.password_hash = await bcrypt.hash(newPassword, 10)
  } else if (newPassword) {
    redirect(
      '/account?error=New%20password%20must%20be%20at%20least%206%20characters' as Route
    )
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data,
    })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      redirect('/account?error=Username%20already%20taken' as Route)
    }
    throw e
  }

  revalidatePath('/account')
  redirect('/account?updated=1' as Route)
}