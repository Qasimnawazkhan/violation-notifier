import { redirect } from 'next/navigation'
import type { Route } from 'next'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/nextauth'
import { ViolationType } from '@prisma/client'

/**
 * Master list of allowed violation types (enum values).
 * Exported both as ALLOWED_VIOLATION_TYPES and legacy name VIOLATION_TYPES
 * so existing imports keep working.
 */
export const ALLOWED_VIOLATION_TYPES: ViolationType[] = [
  'OverSpeeding',
  'SeatBelt',
  'FollowingDistance',
  'PhoneUse',
  'SignalBreak',
  'DocumentsMissing',
  'Other',
]

// Alias for existing code expecting VIOLATION_TYPES
export const VIOLATION_TYPES = ALLOWED_VIOLATION_TYPES

function redirectToDashboard(search: Record<string, string>) {
  const qs = new URLSearchParams(search).toString()
  redirect((`/dashboard?${qs}`) as unknown as Route)
}

async function requireCompanySession() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.company_id) {
    redirect('/login')
  }
  return { companyId: session.user.company_id as string }
}

function val(input: FormDataEntryValue | null, required = false) {
  const s = (input ?? '').toString().trim()
  if (required && !s) throw new Error('Missing required field')
  return s || null
}

export async function createViolation(formData: FormData) {
  'use server'

  const { companyId } = await requireCompanySession()

  const driver_id = val(formData.get('driver_id'), true) as string
  const vtRaw = val(formData.get('violation_type'), true) as string

  const vt = vtRaw as ViolationType
  if (!ALLOWED_VIOLATION_TYPES.includes(vt)) {
    redirectToDashboard({ error: 'Invalid violation type' })
  }

  const driver = await prisma.driver.findFirst({
    where: { id: driver_id, company_id: companyId },
    select: { id: true },
  })
  if (!driver) {
    redirectToDashboard({ error: 'Driver not found or not yours' })
  }

  await prisma.violation.create({
    data: {
      company_id: companyId,
      driver_id,
      violation_type: vt,
      source: 'manual',
      source_ref: null,
      raw_excerpt: null,
      status: 'matched',
    },
  })

  redirectToDashboard({ vadded: '1' })
}