'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Prisma } from '@prisma/client'

function toSlug(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export async function createCompany(formData: FormData) {
  const name = formData.get('name')?.toString().trim() ?? ''
  const slugInput = formData.get('slug')?.toString().trim() ?? ''
  const contact_email = formData.get('contact_email')?.toString().trim() || null
  const contact_phone = formData.get('contact_phone')?.toString().trim() || null
  const whatsapp_sender_id =
    formData.get('whatsapp_sender_id')?.toString().trim() || null

  if (!name) {
    redirect('/admin/companies?error=Company%20name%20is%20required')
  }

  const slug = toSlug(slugInput || name)
  if (!slug) {
    redirect('/admin/companies?error=Valid%20slug%20is%20required')
  }

  try {
    await prisma.company.create({
      data: {
        name,
        slug,
        contact_email,
        contact_phone,
        whatsapp_sender_id,
      },
    })
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === 'P2002'
    ) {
      // Unique constraint failed (likely on slug)
      redirect('/admin/companies?error=Slug%20already%20exists')
    }
    throw e
  }

  revalidatePath('/admin/companies')
  redirect('/admin/companies?created=1')
}