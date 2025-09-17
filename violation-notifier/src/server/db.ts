import { PrismaClient } from '@prisma/client'

declare global {
  // In dev with Next.js (hot reload), reuse a single client
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'warn', 'error']
      : ['error']
  })

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}