import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { parseAmazonEmail } from '@/lib/emailParsers/amazon'
import { sendWhatsAppTemplate, sendWhatsAppText } from '@/lib/whatsapp'
import { ViolationType, Prisma } from '@prisma/client'

function verifySecret(req: NextRequest) {
  const expected = (process.env.INBOUND_AMAZON_SECRET || '').trim()
  const got = (req.headers.get('x-webhook-secret') || '').trim()
  return !!expected && !!got && expected === got
}

type DriverPick = {
  id: string
  name: string
  external_driver_id: string
  whatsapp_e164: string
  company_id: string
}

export async function GET() {
  return NextResponse.json({ ok: true, route: '/api/inbound/amazon' })
}

export async function POST(req: NextRequest) {
  if (!verifySecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: { from?: string; to?: string; subject?: string; text?: string; html?: string }
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const from = (payload.from ?? '').toLowerCase()
  const subject = payload.subject ?? ''
  const text = payload.text ?? stripHtml(payload.html ?? '')
  if (!text) return NextResponse.json({ error: 'Email body is empty' }, { status: 400 })
  if (!from.includes('amazon')) {
    return NextResponse.json({ error: 'Sender not allowed' }, { status: 403 })
  }

  const parsed = parseAmazonEmail(text)
  const externalIdRaw = (parsed.driverId || '').trim()
  const driverNameParsed = (parsed.driverName || '').trim()

  if (!externalIdRaw && !driverNameParsed) {
    return NextResponse.json({ error: 'Could not find driver info in email' }, { status: 422 })
  }
  if (!parsed.violationType) {
    return NextResponse.json({ error: 'Could not determine violation type' }, { status: 422 })
  }

  let driver: DriverPick | null = null

  // 1. Try external_driver_id
  if (externalIdRaw) {
    const byExternal = await prisma.driver.findMany({
      where: { external_driver_id: externalIdRaw },
      select: {
        id: true,
        name: true,
        external_driver_id: true,
        whatsapp_e164: true,
        company_id: true
      },
      take: 3
    })
    if (byExternal.length === 1) {
      driver = byExternal[0]
    } else if (byExternal.length > 1) {
      return NextResponse.json(
        { error: 'Multiple drivers share this external_driver_id; need company filter' },
        { status: 409 }
      )
    }
  }

  // 2. Fallback to exact name
  if (!driver && driverNameParsed) {
    const byName = await prisma.driver.findMany({
      where: { name: driverNameParsed },
      select: {
        id: true,
        name: true,
        external_driver_id: true,
        whatsapp_e164: true,
        company_id: true
      },
      take: 3
    })
    if (byName.length === 1) {
      driver = byName[0]
    } else if (byName.length === 0) {
      return NextResponse.json(
        { error: 'Driver not found by external_driver_id or name' },
        { status: 404 }
      )
    } else {
      return NextResponse.json(
        { error: 'Multiple drivers match this name; need external ID or company filter' },
        { status: 409 }
      )
    }
  }

  if (!driver) {
    return NextResponse.json({ error: 'Driver not found' }, { status: 404 })
  }

  const occurredAt = parsed.occurredAt ?? new Date()

  // PATCH: Duplicate handling for violations
  let violation: { id: string; violation_type: string; occurred_at: Date | null } | null = null
  try {
    // Check for duplicate violation first
    violation = await prisma.violation.findFirst({
      where: {
        company_id: driver.company_id,
        driver_id: driver.id,
        violation_type: parsed.violationType as ViolationType,
        source_ref: subject.slice(0, 200) || null,
      },
      select: { id: true, violation_type: true, occurred_at: true }
    })

    if (!violation) {
      // Only create if no duplicate found
      violation = await prisma.violation.create({
        data: {
          company_id: driver.company_id,
          driver_id: driver.id,
          violation_type: parsed.violationType as ViolationType,
          occurred_at: occurredAt,
          status: 'pending_match',
          source: 'email',
          source_ref: subject.slice(0, 200) || null
        },
        select: { id: true, violation_type: true, occurred_at: true }
      })
    }
  } catch (err: unknown) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      violation = await prisma.violation.findFirst({
        where: {
          company_id: driver.company_id,
          driver_id: driver.id,
          violation_type: parsed.violationType as ViolationType,
          source_ref: subject.slice(0, 200) || null,
        },
        select: { id: true, violation_type: true, occurred_at: true }
      })
    } else {
      throw err
    }
  }

  if (!violation || !violation.occurred_at) {
    return NextResponse.json({ error: 'Could not find or create violation.' }, { status: 500 })
  }

  const violationLabel = humanizeViolationType(parsed.violationType as ViolationType)
  const vin = parsed.vin || 'N/A'
  const dateStr = formatUtcPlus0000(violation.occurred_at)
  const displayName = driver.name
  const displayExternal = driver.external_driver_id

  const message =
    `🚨 Amazon Safety Violation 🚨\n` +
    `Driver: ${displayName} (${displayExternal})\n` +
    `Violation: ${violationLabel}\n` +
    `VIN: ${vin}\n` +
    `Date: ${dateStr}`

  const templateName = (process.env.WABA_TEMPLATE_NAME || '').trim()
  const forceText =
    (process.env.WABA_FORCE_TEXT || 'true').trim().toLowerCase() === 'true'

  try {
    if (forceText || !templateName) {
      await sendWhatsAppText({ to: driver.whatsapp_e164, body: message })
    } else {
      await sendWhatsAppTemplate({
        to: driver.whatsapp_e164,
        templateName,
        languageCode: (process.env.WABA_TEMPLATE_LANG || 'en_US').trim(),
        bodyParams: [displayName, displayExternal, violationLabel, vin, dateStr]
      })
    }
  } catch (err) {
    console.error('WhatsApp send failed:', err)
    return NextResponse.json({ error: 'WhatsApp send failed', violation }, { status: 502 })
  }

  // Respond with info if duplicate or created
  return NextResponse.json({ ok: true, violation, sent: message }, { status: 201 })
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}
function formatUtcPlus0000(d: Date) {
  const iso = d.toISOString()
  return iso.slice(0, 19) + '+0000'
}
function humanizeViolationType(v: ViolationType): string {
  switch (v) {
    case 'FollowingDistance': return 'Following distance'
    case 'OverSpeeding': return 'Over speeding'
    case 'SeatBelt': return 'Seat belt'
    case 'PhoneUse': return 'Phone use'
    case 'SignalBreak': return 'Signal break'
    case 'DocumentsMissing': return 'Documents missing'
    default: return 'Other'
  }
}