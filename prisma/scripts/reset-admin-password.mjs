/* Usage:
   node prisma/scripts/reset-admin-password.mjs admin@example.com "Admin@123"
   or
   node prisma/scripts/reset-admin-password.mjs admin "Admin@123"
*/
import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

async function main() {
  const [identifier, newPassword] = process.argv.slice(2)
  if (!identifier || !newPassword) {
    console.error('Usage: node prisma/scripts/reset-admin-password.mjs <email-or-username> <new-password>')
    process.exit(1)
  }

  const prisma = new PrismaClient()
  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: identifier, mode: 'insensitive' } },
          { username: { equals: identifier, mode: 'insensitive' } },
        ],
      },
    })

    if (!user) {
      console.error('No user found for identifier:', identifier)
      process.exit(1)
    }

    const hash = await bcrypt.hash(newPassword, 10)

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash: hash,
        role: Role.system_admin, // ensure admin role if this is your admin account
      },
    })

    console.log('Updated admin user:', {
      id: updated.id,
      email: updated.email,
      username: updated.username,
      role: updated.role,
    })
    console.log('You can now log in with:', {
      identifier: updated.username ?? updated.email,
      password: newPassword,
    })
  } catch (e) {
    console.error('Error updating admin password:', e)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()