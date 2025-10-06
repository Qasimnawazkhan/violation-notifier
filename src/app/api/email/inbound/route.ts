import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { parseViolationEmail } from '@/lib/violationEmailParser'
import { ViolationType } from '@prisma/client'

interface InboundPayload {
  secret?: string
  subject?: string
  text?: string
  html?: string
  messageId?: string
  from?: string
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isPrismaUniqueError(e: unknown): e is { code: 'P2002' } {
  return (
    typeof e === 'object' &&
    e !== null &&
    'code' in e &&
    (e as { code?: unknown }).code === 'P2002'
  )
}

export async function POST(req: NextRequest) {
  let body: InboundPayload
  try {
    body = (await req.json()) as InboundPayload
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  if (body.secret !== process.env.INBOUND_EMAIL_SHARED_SECRET) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const subject = body.subject || ''
  const text = body.text || ''
  const html = body.html || ''
  const messageId = body.messageId
  const from = body.from?.toLowerCase() || ''

  const allowedSenders = (process.env.ALLOWED_VIOLATION_SENDERS || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)

  if (allowedSenders.length && !allowedSenders.some(dom => from.endsWith(dom))) {
    return NextResponse.json({ ok: false, error: 'Sender not allowed' }, { status: 403 })
  }

  if (messageId) {
    const existing = await prisma.violation.findFirst({
      where: { source_ref: messageId },
      select: { id: true },
    })
    if (existing) {
      return NextResponse.json({ ok: true, dedupe: true })
    }
  }

  const parsed = parseViolationEmail(subject, text || stripHtml(html))

  if (!parsed.driverExternalId && !parsed.vehicleNumber) {
    return NextResponse.json({ ok: false, error: 'No driver reference detected' }, { status: 422 })
  }
  if (parsed.violationTypes.length === 0) {
    return NextResponse.json({ ok: false, error: 'No violation keywords found' }, { status: 422 })
  }

  const companyId = process.env.DEFAULT_COMPANY_ID
  if (!companyId) {
    return NextResponse.json({ ok: false, error: 'DEFAULT_COMPANY_ID not set' }, { status: 500 })
  }

  let driver = null
  if (parsed.driverExternalId) {
    driver = await prisma.driver.findFirst({
      where: {
        company_id: companyId,
        external_driver_id: parsed.driverExternalId,
      },
    })
  }
  if (!driver && parsed.vehicleNumber) {
    driver = await prisma.driver.findFirst({
      where: {
        company_id: companyId,
        vehicle_number: parsed.vehicleNumber,
      },
    })
  }

  if (!driver) {
    return NextResponse.json({ ok: false, error: 'Driver not found' }, { status: 404 })
  }

  const created: ViolationType[] = []

  for (const vt of parsed.violationTypes) {
    try {
      await prisma.violation.create({
        data: {
          company_id: companyId,
          driver_id: driver.id,
            violation_type: vt,
          source: 'email',
          source_ref: messageId,
          raw_excerpt: parsed.textUsed.slice(0, 500),
          status: 'matched',
          occurred_at: new Date(),
          source_email_id: null,
        },
      })
      created.push(vt)
    } catch (e) {
      if (isPrismaUniqueError(e)) {
        // duplicate
      } else {
        console.error('Insert violation error', e)
      }
    }
  }

  return NextResponse.json({
    ok: true,
    driver_id: driver.id,
    created_count: created.length,
    violations: created,
    dedupe: created.length === 0,
  })
}