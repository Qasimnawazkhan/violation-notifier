import express, { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { sendWhatsAppText } from '../lib/whatsapp';

const router = express.Router();

async function getDriverById(driverId: string) {
  return await prisma.driver.findUnique({
    where: { id: driverId }
  });
}

router.post('/api/notify-driver', async (req: Request, res: Response) => {
  const { driverId, message } = req.body;

  const driver = await getDriverById(driverId);

  if (!driver || !driver.whatsapp_e164) {
    return res.status(400).json({ error: 'Driver WhatsApp phone not found.' });
  }

  try {
    await sendWhatsAppText({
      to: driver.whatsapp_e164,
      body: message
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'WhatsApp message failed.', details: (err as Error).message });
  }
});

export default router;