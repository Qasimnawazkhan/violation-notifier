import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminEmail = 'admin@example.com'
  const adminPass = 'admin123'
  const adminHash = await bcrypt.hash(adminPass, 10)

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password_hash: adminHash,
      role: 'system_admin'
    }
  })

  const company = await prisma.company.upsert({
    where: { slug: 'acme' },
    update: {},
    create: {
      name: 'Acme Logistics',
      slug: 'acme',
      contact_email: 'ops@acme.test',
      contact_phone: '+15551234567'
    }
  })

  const userEmail = 'ops@acme.test'
  const userPass = 'company123'
  const userHash = await bcrypt.hash(userPass, 10)

  await prisma.user.upsert({
    where: { email: userEmail },
    update: {},
    create: {
      email: userEmail,
      password_hash: userHash,
      role: 'company_admin',
      company: { connect: { id: company.id } }
    }
  })

  await prisma.driver.createMany({
    data: [
      {
        company_id: company.id,
        external_driver_id: 'DRV-1001',
        name: 'Jane Doe',
        whatsapp_e164: '+15550000001',
        vehicle_number: 'ACME-01',
        consent_status: 'granted',
        consent_at: new Date()
      },
      {
        company_id: company.id,
        external_driver_id: 'DRV-1002',
        name: 'John Smith',
        whatsapp_e164: '+15550000002',
        vehicle_number: 'ACME-02',
        consent_status: 'granted',
        consent_at: new Date()
      }
    ],
    skipDuplicates: true
  })

  console.log('Seed complete: admin/admin123 & ops@acme.test/company123')
}

main().catch(e => {
  console.error(e)
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})