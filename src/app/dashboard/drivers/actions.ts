'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/nextauth'
import { Prisma } from '@prisma/client'
import type { Route } from 'next'

// Helper to redirect to /dashboard with query params (typed routes don't include ?query)
function redirectToDashboard(search: Record<string, string>) {
  const qs = new URLSearchParams(search).toString()
  // Cast once here to satisfy typed routes; typed Route doesn't model query strings
  redirect((`/dashboard?${qs}`) as unknown as Route)
}

async function requireCompanySession() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.company_id) {
    redirect('/login')
  }
  return { session, companyId: session.user.company_id as string }
}

function val(input: FormDataEntryValue | null, required = false) {
  const s = (input ?? '').toString().trim()
  if (required && !s) throw new Error('Missing required field')
  return s || null
}

// Normalize a phone number to E.164 where possible.
// - Strips spaces, dashes, parentheses
// - Converts leading '00' to '+'
// - If no leading '+', optionally prepends DEFAULT_COUNTRY_CODE (e.g., +92)
// Returns normalized E.164 string or null if cannot normalize.
function normalizeE164(raw: string, defaultCountryCode?: string): string | null {
  let s = raw.trim()
  s = s.replace(/[^\d+]/g, '')
  if (s.startsWith('00')) s = '+' + s.slice(2)
  if (!s.startsWith('+')) {
    if (defaultCountryCode && defaultCountryCode.startsWith('+')) {
      s = defaultCountryCode + s
    } else {
      return null
    }
  }
  if (!/^\+\d{6,15}$/.test(s)) return null
  return s
}

export async function createDriver(formData: FormData) {
  const { companyId } = await requireCompanySession()

  const name = val(formData.get('name'), true) as string
  const driver_id = val(formData.get('driver_id'), true) as string // maps to external_driver_id
  const whatsappRaw = val(formData.get('driver_whatsapp'), true) as string // required per schema
  const vehicle_number = val(formData.get('vehicle_number'), true) as string

  const normalized = normalizeE164(whatsappRaw, process.env.DEFAULT_COUNTRY_CODE)
  if (!normalized) {
    redirectToDashboard({ error: 'WhatsApp must be in E.164 format, e.g. +1234567890' })
  }

  try {
    await prisma.driver.create({
      data: {
        name,
        external_driver_id: driver_id,
        whatsapp_e164: normalized!, // ensured above
        vehicle_number,
        company_id: companyId,
      },
    })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      redirectToDashboard({ error: 'Driver already exists with that ID or vehicle' })
    }
    throw e
  }

  revalidatePath('/dashboard')
  redirectToDashboard({ created: '1' })
}

export async function updateDriver(formData: FormData) {
  const { companyId } = await requireCompanySession()

  const id = val(formData.get('id'), true) as string
  const name = val(formData.get('name'), true) as string
  const driver_id = val(formData.get('driver_id'), true) as string
  const whatsappRaw = val(formData.get('driver_whatsapp')) // may be blank to keep unchanged
  const vehicle_number = val(formData.get('vehicle_number'), true) as string

  const driver = await prisma.driver.findFirst({ where: { id, company_id: companyId } })
  if (!driver) {
    redirectToDashboard({ error: 'Driver not found or not yours' })
  }

  let whatsapp_e164: string | undefined
  if (typeof whatsappRaw === 'string') {
    if (whatsappRaw.trim() === '') {
      whatsapp_e164 = undefined
    } else {
      const normalized = normalizeE164(whatsappRaw, process.env.DEFAULT_COUNTRY_CODE)
      if (!normalized) {
        redirectToDashboard({ error: 'WhatsApp must be in E.164 format, e.g. +1234567890' })
      }
      whatsapp_e164 = normalized!
    }
  }

  try {
    await prisma.driver.update({
      where: { id },
      data: {
        name,
        external_driver_id: driver_id,
        whatsapp_e164, // undefined => do not change
        vehicle_number,
      },
    })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      redirectToDashboard({ error: 'Duplicate driver ID or vehicle number' })
    }
    throw e
  }

  revalidatePath('/dashboard')
  redirectToDashboard({ updated: '1' })
}

export async function deleteDriver(formData: FormData) {
  const { companyId } = await requireCompanySession()

  const id = val(formData.get('id'), true) as string

  const res = await prisma.driver.deleteMany({
    where: { id, company_id: companyId },
  })

  if (res.count === 0) {
    redirectToDashboard({ error: 'Driver not found or not yours' })
  }

  revalidatePath('/dashboard')
  redirectToDashboard({ deleted: '1' })
}