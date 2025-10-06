import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import type { Session } from 'next-auth'
import { authOptions } from '@/lib/nextauth'
import prisma from '@/lib/prisma'
import { hash } from 'bcryptjs'
import { Prisma } from '@prisma/client'

interface Body {
  email?: string
  password?: string
}

function requireSystemAdmin(session: Session | null) {
  if (!session?.user || session.user.role !== 'system_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

function isUniqueConstraint(e: unknown): e is Prisma.PrismaClientKnownRequestError {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002'
}

/**
 * POST /api/admin/companies/[id]/managers
 * Create a new company_admin user for the specified company.
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: company_id } = await context.params

  const session = await getServerSession(authOptions)
  const unauthorized = requireSystemAdmin(session)
  if (unauthorized) return unauthorized

  let body: Body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.email || !body.password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
  }

  const email = body.email.toLowerCase().trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
  }
  if (body.password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const company = await prisma.company.findUnique({ where: { id: company_id } })
  if (!company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 })
  }

  try {
    const password_hash = await hash(body.password, 10)

    const manager = await prisma.user.create({
      data: {
        email,
        password_hash,
        role: 'company_admin',
        company_id: company.id,
      },
      select: { id: true, email: true },
    })

    return NextResponse.json({ manager }, { status: 201 })
  } catch (e: unknown) {
    if (isUniqueConstraint(e)) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create manager' }, { status: 500 })
  }
}