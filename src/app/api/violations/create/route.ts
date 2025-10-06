import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/nextauth'
import prisma from '@/lib/prisma'
import { ViolationType } from '@prisma/client'
import { z } from 'zod'

/**
 * Keep the enum list here (or import from a central helper if you created one).
 */
const VIOLATION_TYPES: ViolationType[] = [
  'OverSpeeding',
  'SeatBelt',
  'FollowingDistance',
  'PhoneUse',
  'SignalBreak',
  'DocumentsMissing',
  'Other',
]

/**
 * Zod schema:
 * - Accept both driver_id and driverId (one required).
 * - violation_type must be a string; we then map to enum.
 * - occurred_at optional ISO datetime.
 */
const PayloadSchema = z.object({
  driver_id: z.string().min(1).optional(),
  driverId: z.string().min(1).optional(), // legacy camelCase
  violation_type: z.string().min(2),
  occurred_at: z
    .string()
    .datetime({ offset: true })
    .optional()
    .or(z.string().datetime().optional()), // tolerate no offset
  source: z.string().max(64).optional(),
  source_ref: z.string().max(256).optional(),
})

type Payload = z.infer<typeof PayloadSchema>

function normalizeViolationType(raw: string): ViolationType | null {
  // Case-insensitive match against known enum values.
  const normalized = VIOLATION_TYPES.find(
    vt => vt.toLowerCase() === raw.toLowerCase().trim()
  )
  return normalized ?? null
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse / validate JSON
  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = PayloadSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid payload',
        details: parsed.error.flatten(),
      },
      { status: 400 }
    )
  }

  const body: Payload = parsed.data

  // Support both driver_id and driverId; prioritize snake_case if both given.
  const driver_id = body.driver_id ?? body.driverId
  if (!driver_id) {
    return NextResponse.json(
      { error: 'driver_id (or driverId) is required' },
      { status: 400 }
    )
  }

  const vt = normalizeViolationType(body.violation_type)
  if (!vt) {
    return NextResponse.json(
      {
        error: 'Invalid violation_type',
        allowed: VIOLATION_TYPES,
      },
      { status: 400 }
    )
  }

  // Resolve driver inside same company
  const driver = await prisma.driver.findFirst({
    where: {
      id: driver_id,
      company_id: session.user.company_id,
    },
    select: { id: true },
  })

  if (!driver) {
    return NextResponse.json(
      { error: 'Driver not found or not in your company' },
      { status: 404 }
    )
  }

  let occurredAt: Date | null = null
  if (body.occurred_at) {
    try {
      occurredAt = new Date(body.occurred_at)
      if (isNaN(occurredAt.getTime())) {
        return NextResponse.json(
          { error: 'occurred_at is not a valid datetime' },
          { status: 400 }
        )
      }
    } catch {
      return NextResponse.json(
        { error: 'occurred_at parsing failed' },
        { status: 400 }
      )
    }
  } else {
    // If you prefer NOT to default, comment this out.
    occurredAt = new Date()
  }

  try {
    const violation = await prisma.violation.create({
      data: {
        company_id: session.user.company_id,
        driver_id: driver.id,
        violation_type: vt,
        occurred_at: occurredAt,
        status: 'pending_match', // mimic old behavior; adjust if you want immediate 'matched'
        source: body.source ?? 'api',
        source_ref: body.source_ref ?? null,
      },
      select: {
        id: true,
        violation_type: true,
        driver_id: true,
        occurred_at: true,
        status: true,
      },
    })

    return NextResponse.json({ violation }, { status: 201 })
  } catch (e: unknown) {
    // Handle unique constraint (e.g., if you added @@unique with source_ref)
    if (isPrismaUniqueError(e)) {
      return NextResponse.json(
        { error: 'Duplicate violation (company_id, driver_id, type, source_ref)' },
        { status: 409 }
      )
    }
    console.error('Violation create error:', e)
    return NextResponse.json(
      { error: 'Failed to create violation' },
      { status: 500 }
    )
  }
}

function isPrismaUniqueError(e: unknown): e is { code: string } {
  return (
    typeof e === 'object' &&
    e !== null &&
    'code' in e &&
    (e as { code?: string }).code === 'P2002'
  )
}

export const config = {
  runtime: 'nodejs',
}