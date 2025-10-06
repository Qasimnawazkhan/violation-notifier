import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, slug, contact_email, contact_phone, whatsapp_sender_id, provider, imap_user, imap_password } = req.body;

  // TODO: Encrypt imap_password before saving!
  try {
    const company = await prisma.company.create({
      data: {
        name,
        slug,
        contact_email,
        contact_phone,
        whatsapp_sender_id,
        provider,
        imap_user,
        imap_password,
      },
    });
    res.status(201).json({ ok: true, company });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ ok: false, error: errorMsg });
  }
}