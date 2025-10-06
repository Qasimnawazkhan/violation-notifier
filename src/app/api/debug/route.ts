import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = (searchParams.get('id') || '').trim()
  const total = await prisma.driver.count()
  const driver = id ? await prisma.driver.findUnique({ where: { id } }) : null

  // Tiny fingerprint to ensure we’re on the expected DB (does not expose secrets)
  const dbFingerprint =
    (process.env.DATABASE_URL || '').replace(/.+@/, '').slice(-24) || null

  return NextResponse.json({
    ok: true,
    id,
    driversTotal: total,
    found: !!driver,
    driver,
    dbFingerprint
  })
}