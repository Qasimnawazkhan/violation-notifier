/**
 * Reprocess inbound emails still marked as pending (adjust logic as needed) to extract violations.
 */
import { PrismaClient, ViolationStatus, Prisma } from '@prisma/client'
import { parseViolationEmail } from '../../src/lib/violationEmailParser'

const prisma = new PrismaClient()
const TARGET_COMPANY_ID = process.env.DEFAULT_COMPANY_ID || null

// Stub: replace with actual S3 body retrieval using the provided key
async function fetchEmailBodyFromS3(s3Key: string): Promise<string> {
  void s3Key
  return ''
}

function isPrismaUniqueError(e: unknown): e is { code: 'P2002' } {
  return (
    typeof e === 'object' &&
    e !== null &&
    'code' in e &&
    (e as { code?: unknown }).code === 'P2002'
  )
}

async function main() {
  console.log('Starting inbound email reprocess...')

  // Correct typing for a where clause
  const whereClause: Prisma.InboundEmailWhereInput = {
    parsed_status: 'pending',
  }
  if (TARGET_COMPANY_ID) {
    whereClause.company_id = TARGET_COMPANY_ID
  }

  const emails = await prisma.inboundEmail.findMany({
    where: whereClause,
    take: 100,
    orderBy: { received_at: 'asc' },
  })

  if (emails.length === 0) {
    console.log('No pending inbound emails found.')
    return
  }

  console.log(`Found ${emails.length} pending emails`)

  for (const email of emails) {
    let bodyText = ''
    try {
      bodyText = await fetchEmailBodyFromS3(email.s3_key)
    } catch (e) {
      console.warn(`Fetch body failed for email ${email.id}:`, e)
    }

    const parsed = parseViolationEmail(email.subject || '', bodyText)

    if (parsed.violationTypes.length === 0) {
      await prisma.inboundEmail.update({
        where: { id: email.id },
        data: { parsed_status: 'failed' },
      })
      continue
    }

    // Resolve driver by external ID then vehicle number
    let driver = null
    if (parsed.driverExternalId) {
      driver = await prisma.driver.findFirst({
        where: {
          company_id: email.company_id,
          external_driver_id: parsed.driverExternalId,
        },
      })
    }
    if (!driver && parsed.vehicleNumber) {
      driver = await prisma.driver.findFirst({
        where: {
          company_id: email.company_id,
          vehicle_number: parsed.vehicleNumber,
        },
      })
    }

    if (!driver) {
      console.log(
        `Email ${email.id}: Driver not found (external=${parsed.driverExternalId} vehicle=${parsed.vehicleNumber})`
      )
      await prisma.inboundEmail.update({
        where: { id: email.id },
        data: { parsed_status: 'parsed' },
      })
      continue
    }

    for (const vt of parsed.violationTypes) {
      try {
        await prisma.violation.create({
          data: {
            company_id: email.company_id,
            driver_id: driver.id,
            violation_type: vt,
            source: 'email',
            source_ref: email.message_id,
            raw_excerpt: parsed.textUsed.slice(0, 300),
            status: 'matched' as ViolationStatus,
            occurred_at: email.received_at,
            source_email_id: email.id,
          },
        })
        console.log(
          `Created violation (${vt}) for driver ${driver.external_driver_id} from email ${email.id}`
        )
      } catch (err) {
        if (isPrismaUniqueError(err)) {
          console.log(
            `Duplicate violation skipped for driver ${driver.id} type=${vt} source_ref=${email.message_id}`
          )
        } else {
          console.error('Unexpected violation insert error:', err)
        }
      }
    }

    await prisma.inboundEmail.update({
      where: { id: email.id },
      data: { parsed_status: 'parsed' },
    })
  }

  console.log('Reprocess complete.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })