import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import type { Session } from 'next-auth'
import { authOptions } from '@/lib/nextauth'
import { prisma } from '@/server/db'
import { hashPassword } from '@/lib/password'
import { Prisma, Role } from '@prisma/client'

type SessionUserWithRole = Session['user'] & { role?: string }
function getRole(session: Session | null): string | undefined {
  return (session?.user as SessionUserWithRole | undefined)?.role
}

function requireSystemAdmin(session: Session | null) {
  if (getRole(session) !== 'system_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

async function generateUniqueSlug(baseName: string) {
  const base = slugify(baseName) || 'company'
  let suffix = 0
  let candidate = base
  for (let i = 0; i < 50; i++) {
    const existing = await prisma.company.findUnique({ where: { slug: candidate } })
    if (!existing) return candidate
    suffix += 1
    candidate = `${base}-${suffix}`
  }
  const uniq = Date.now().toString(36).slice(-5)
  return `${base}-${uniq}`
}

// List/search companies
export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  const unauthorized = requireSystemAdmin(session)
  if (unauthorized) return unauthorized

  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('query') || '').trim()

  const companies = await prisma.company.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { slug: { contains: q, mode: 'insensitive' } },
          ],
        }
      : undefined,
    orderBy: { slug: 'asc' },
    include: {
      users: {
        where: { role: Role.company_admin },
        select: { id: true, email: true },
      },
    },
    take: 100,
  })

  return NextResponse.json({ companies })
}

// Register company (and optional initial manager)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const unauthorized = requireSystemAdmin(session)
  if (unauthorized) return unauthorized

  const body = (await req.json().catch(() => null)) as {
    name?: string
    contact_email?: string
    contact_phone?: string
    whatsapp_sender_id?: string
    username?: string
    password?: string
  } | null

  if (!body || typeof body.name !== 'string') {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const name = body.name.trim()
  const contact_email = body.contact_email?.trim()
  const contact_phone = body.contact_phone?.trim()
  const whatsapp_sender_id = body.whatsapp_sender_id?.trim()
  const usernameRaw = body.username?.trim() || ''
  const password = body.password

  if ((usernameRaw && !password) || (!usernameRaw && password)) {
    return NextResponse.json({ error: 'Both username and password are required for manager account' }, { status: 400 })
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const slug = await generateUniqueSlug(name)

      const company = await tx.company.create({
        data: {
          name,
          slug,
          contact_email,
          contact_phone,
          whatsapp_sender_id,
        },
      })

      let manager: { id: string; email: string } | null = null
      if (usernameRaw && password) {
        const username = usernameRaw.toLowerCase()
        const isEmailLike = username.includes('@')
        const email = isEmailLike ? username : `${username}@${slug}.local`
        const password_hash = await hashPassword(password)

        manager = await tx.user.create({
          data: {
            email,
            username,
            password_hash,
            role: Role.company_admin,
            company_id: company.id,
          },
          select: { id: true, email: true },
        })
      }

      return { company, manager }
    })

    return NextResponse.json(result, { status: 201 })
  } catch (e: unknown) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') {
        return NextResponse.json({ error: 'Username or email already exists' }, { status: 409 })
      }
    }
    return NextResponse.json({ error: 'Failed to register company' }, { status: 500 })
  }
}