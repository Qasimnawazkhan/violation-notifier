'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Prisma, Role } from '@prisma/client'
import { hash } from 'bcryptjs'

function toSlug(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export async function createCompanyWithAdmin(formData: FormData) {
  const name = String(formData.get('name') || '').trim()
  const contact_email = String(formData.get('contact_email') || '').trim()
  const contact_phone =
    (formData.get('contact_phone')?.toString().trim() as string) || null
  const whatsapp_sender_id =
    (formData.get('whatsapp_sender_id')?.toString().trim() as string) || null

  const username = String(formData.get('username') || '').trim()
  const password = String(formData.get('password') || '')

  if (!name) redirect('/admin?error=Company%20name%20is%20required')
  if (!contact_email) redirect('/admin?error=Contact%20email%20is%20required')
  if (!username) redirect('/admin?error=Username%20is%20required')
  if (!password || password.length < 6) {
    redirect('/admin?error=Password%20must%20be%20at%20least%206%20characters')
  }

  const slug = toSlug(name)
  const password_hash = await hash(password, 10)

  try {
    await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name,
          slug,
          contact_email,
          contact_phone,
          whatsapp_sender_id,
        },
      })

      await tx.user.create({
        data: {
          email: contact_email,
          username,
          password_hash,
          role: Role.company_admin, // ensure company admin role
          company_id: company.id, // link the user to the created company
        },
      })
    })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      // Unique constraint (slug/email/username) violated
      redirect(
        '/admin?error=Unique%20constraint%20failed.%20Try%20a%20different%20slug%2C%20email%2C%20or%20username'
      )
    }
    throw e
  }

  revalidatePath('/admin')
  redirect('/admin?created=1')
}

export async function updateCompany(formData: FormData) {
  const id = formData.get('id')?.toString()
  const name = formData.get('name')?.toString().trim() ?? ''
  const contact_email = formData.get('contact_email')?.toString().trim() || null
  const contact_phone = formData.get('contact_phone')?.toString().trim() || null
  const whatsapp_sender_id =
    formData.get('whatsapp_sender_id')?.toString().trim() || null

  if (!id) redirect('/admin?error=Missing%20company%20id')
  if (!name) redirect('/admin?error=Company%20name%20is%20required')

  try {
    await prisma.company.update({
      where: { id },
      data: { name, contact_email, contact_phone, whatsapp_sender_id },
    })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      // Unique violation on some unique field (e.g., slug if added later)
      redirect('/admin?error=Update%20failed%20due%20to%20duplicate%20value')
    }
    throw e
  }

  revalidatePath('/admin')
  redirect('/admin?updated=1')
}

export async function deleteCompany(formData: FormData) {
  const id = formData.get('id')?.toString()
  if (!id) redirect('/admin?error=Missing%20company%20id')

  try {
    await prisma.company.delete({ where: { id } })
  } catch (e) {
    // P2003: Foreign key constraint failed on the field (company has related records)
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') {
      redirect('/admin?error=Cannot%20delete%20company%20with%20related%20records')
    }
    throw e
  }

  revalidatePath('/admin')
  redirect('/admin?deleted=1')
}