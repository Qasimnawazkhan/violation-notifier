import imap from 'imap-simple';
import { simpleParser } from 'mailparser';
import axios from 'axios';
import prisma from '../lib/prisma';

// Amazon violation email parser
function parseAmazonViolationEmail(body: string, receivedDate?: Date) {
  // Extract driver name, driver ID, vehicle VIN
  const driverMatch = body.match(/your ([A-Z]+) \(([\w\d]+)\) driving VIN# ([\w\d]+)/i);
  // Extract violation type
  const violationTypeMatch = body.match(/unsafe behavior related to ([\w\s]+)/i);

  // Use receivedDate for date and time
  let date: string | null = null;
  let time: string | null = null;
  if (receivedDate) {
    const dateObj = new Date(receivedDate);
    if (!isNaN(dateObj.getTime())) {
      date = dateObj.toISOString().slice(0, 10);     // 'YYYY-MM-DD'
      time = dateObj.toISOString().slice(11, 19);    // 'HH:MM:SS'
    }
  }

  return {
    driverName: driverMatch ? driverMatch[1] : null,
    driverId: driverMatch ? driverMatch[2] : null,
    vehicleVin: driverMatch ? driverMatch[3] : null,
    violationType: violationTypeMatch ? violationTypeMatch[1].trim() : null,
    date,
    time,
  };
}

interface CompanyIMAP {
  id: string;
  name: string;
  slug: string;
  contact_email: string | null;
  contact_phone: string | null;
  whatsapp_sender_id: string | null;
  provider: string | null;
  imap_user: string | null;
  imap_password: string | null;
}

function getImapConfig(provider: string, user: string, password: string) {
  switch (provider) {
    case 'gmail':
      return { imap: { user, password, host: 'imap.gmail.com', port: 993, tls: true, authTimeout: 3000 } };
    case 'outlook':
      return { imap: { user, password, host: 'outlook.office365.com', port: 993, tls: true, authTimeout: 3000 } };
    case 'yahoo':
      return { imap: { user, password, host: 'imap.mail.yahoo.com', port: 993, tls: true, authTimeout: 3000 } };
    default:
      throw new Error('Unsupported provider');
  }
}

// Helper to post violation to backend with secret header
async function postViolationToBackend(data: Record<string, unknown>) {
  const secret = process.env.INBOUND_AMAZON_SECRET || '';
  try {
    const response = await axios.post(
      'http://localhost:3000/api/inbound/amazon',
      data,
      { headers: { 'x-webhook-secret': secret } }
    );
    return response.data;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error
      ? err.message
      : typeof err === 'object' && err !== null && 'toString' in err
        ? (err as { toString: () => string }).toString()
        : String(err);
    // axios error response if available
    if (typeof err === 'object' && err !== null && 'response' in err) {
      // @ts-expect-error TS doesn't know err.response exists on axios errors, but we need to log error details
      console.error('Failed to post violation to backend:', err.response?.data || errorMsg);
    } else {
      console.error('Failed to post violation to backend:', errorMsg);
    }
    throw err;
  }
}

// Poll the inbox for new Amazon violation emails and notify driver instantly
async function pollCompanyInbox(company: CompanyIMAP) {
  const { provider, imap_user, imap_password, id, name } = company;
  if (!provider || !imap_user || !imap_password) return;

  const config = getImapConfig(provider, imap_user, imap_password);

  try {
    const connection = await imap.connect(config);
    await connection.openBox('INBOX');
    const searchCriteria = ['UNSEEN', ['FROM', 'noreply@amazon.com']];
    const fetchOptions = { bodies: ['HEADER', 'TEXT'], markSeen: true };
    const results = await connection.search(searchCriteria, fetchOptions);

    for (const item of results) {
      const all = item.parts.find((p: { which: string }) => p.which === 'TEXT');
      if (!all) continue;

      const parsed = await simpleParser(all.body);
      const body = parsed.text || '';
      const received_at = parsed.date;

      // Parse violation details from email body and received date
      const violationDetails = parseAmazonViolationEmail(body, received_at);

      // Post violation data to backend with secret header
      try {
        await postViolationToBackend({
          company_id: id,
          ...violationDetails,
          mail_from: parsed.from?.text || '',
          received_at,
        });
      } catch {
        // Logging already handled in postViolationToBackend
      }

      // Instantly notify driver (customize this endpoint and message as needed)
      if (violationDetails.driverId) {
        try {
          await axios.post('http://localhost:3000/api/notify-driver', {
            driverId: violationDetails.driverId,
            message: `Dear ${violationDetails.driverName}, a safety violation was detected (${violationDetails.violationType}) on ${violationDetails.date} at ${violationDetails.time}. Please review your driving behavior.`,
            company_id: id,
          });
        } catch (err: unknown) {
          const errorMsg = err instanceof Error
            ? err.message
            : typeof err === 'object' && err !== null && 'toString' in err
              ? (err as { toString: () => string }).toString()
              : String(err);
          if (typeof err === 'object' && err !== null && 'response' in err) {
            // @ts-expect-error For axios error response logging: err.response is valid on axios error objects
            console.error('Failed to notify driver via WhatsApp:', err.response?.data || errorMsg);
          } else {
            console.error('Failed to notify driver via WhatsApp:', errorMsg);
          }
        }
      }
    }
    await connection.end();
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`Error polling ${name}:`, errorMsg);
  }
}

// Main process: runs poller in a loop
export async function main() {
  while (true) {
    const companies: CompanyIMAP[] = await prisma.company.findMany({
      where: {
        imap_user: { not: null },
        imap_password: { not: null },
        provider: { not: null }
      },
      select: {
        id: true,
        name: true,
        slug: true,
        contact_email: true,
        contact_phone: true,
        whatsapp_sender_id: true,
        provider: true,
        imap_user: true,
        imap_password: true
      }
    });

    for (const company of companies) {
      await pollCompanyInbox(company);
    }
    await prisma.$disconnect();

    // Wait 30 seconds before checking for new mail again
    await new Promise((resolve) => setTimeout(resolve, 30000));
  }
}

main().catch((err: unknown) => {
  const errorMsg = err instanceof Error ? err.message : String(err);
  console.error(errorMsg);
});