import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const companies = await prisma.company.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      contact_email: true,
    },
    orderBy: { name: 'asc' },
  })

  if (companies.length === 0) {
    console.log('No companies found.')
    return
  }

  console.log('Companies:')
  for (const c of companies) {
    console.log(
      `ID: ${c.id}\n  Name: ${c.name}\n  Slug: ${c.slug}\n  Email: ${c.contact_email ?? '—'}\n`
    )
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })