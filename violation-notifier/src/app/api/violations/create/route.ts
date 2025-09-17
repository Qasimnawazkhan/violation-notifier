import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/server/db'
import { z } from 'zod'

const schema = z.object({
  driverId: z.string().optional(),
  violation_type: z.string().min(2),
  occurred_at: z.string().datetime().optional()
})

export async function POST(req: Request) {
  const session = await getServerSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!session.company_id) {
    return NextResponse.json({ error: 'No company context' }, { status: 400 })
  }

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { driverId, violation_type, occurred_at } = parsed.data

  const violation = await prisma.violation.create({
    data: {
      company_id: session.company_id,
      driver_id: driverId,
      violation_type,
      occurred_at: occurred_at ? new Date(occurred_at) : null,
      status: 'pending_match'
    }
  })

  return NextResponse.json({ violation })
}