import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import type { Session } from 'next-auth'
import { authOptions } from '@/lib/nextauth'
import prisma from '@/lib/prisma'
import { Role } from '@prisma/client'

function requireSystemAdmin(session: Session | null) {
  if (!session?.user || session.user.role !== 'system_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

/**
 * GET /api/admin/companies/[id]
 * Returns a single company with its company_admin users.
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const session = await getServerSession(authOptions)
  const unauthorized = requireSystemAdmin(session)
  if (unauthorized) return unauthorized

  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      users: {
        where: { role: Role.company_admin },
        select: { id: true, email: true },
      },
    },
  })

  if (!company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 })
  }

  return NextResponse.json({ company })
}

/**
 * PUT /api/admin/companies/[id]
 * Updates mutable fields of a company.
 */
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const session = await getServerSession(authOptions)
  const unauthorized = requireSystemAdmin(session)
  if (unauthorized) return unauthorized

  let body: {
    name?: string
    contact_email?: string
    contact_phone?: string
    whatsapp_sender_id?: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  try {
    const updated = await prisma.company.update({
      where: { id },
      data: {
        name: body.name?.trim(),
        contact_email: body.contact_email?.trim(),
        contact_phone: body.contact_phone?.trim(),
        whatsapp_sender_id: body.whatsapp_sender_id?.trim(),
      },
    })
    return NextResponse.json({ company: updated })
  } catch {
    return NextResponse.json({ error: 'Failed to update company' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/companies/[id]
 * Performs a cascade-style deletion (manual) inside a transaction.
 */
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const session = await getServerSession(authOptions)
  const unauthorized = requireSystemAdmin(session)
  if (unauthorized) return unauthorized

  try {
    await prisma.$transaction(async (tx) => {
      await tx.whatsAppMessage.deleteMany({ where: { company_id: id } }).catch(async () => {
        // If delegate is actually whatsappMessage in your client, swap it:
        // await tx.whatsappMessage.deleteMany({ where: { company_id: id } })
      })
      await tx.violation.deleteMany({ where: { company_id: id } })
      await tx.inboundEmail.deleteMany({ where: { company_id: id } })
      await tx.driver.deleteMany({ where: { company_id: id } })
      await tx.auditLog.deleteMany({ where: { company_id: id } })
      await tx.user.deleteMany({ where: { company_id: id } })
      await tx.company.delete({ where: { id } })
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete company' }, { status: 500 })
  }
}