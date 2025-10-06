import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@example.com'
  const username = process.env.ADMIN_USERNAME || 'admin'
  const password = process.env.ADMIN_PASSWORD || 'adminpass'
  const password_hash = await bcrypt.hash(password, 10)

  // Create a dummy Company for the admin or leave null depending on your app logic
  // If system_admin should not belong to a company, set company_id to null.
  const systemAdmin = await prisma.user.upsert({
    where: { email },
    update: {
      username,
      // Optionally rotate password in dev if you want:
      // password_hash,
      role: Role.system_admin,
    },
    create: {
      email,
      username,
      password_hash,
      role: Role.system_admin,
      company_id: null,
    },
  })

  console.log('Seeded system admin:', { id: systemAdmin.id, email: systemAdmin.email, username: systemAdmin.username })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })