type SendTextParams = { to: string; body: string }
type SendTemplateParams = {
  to: string
  templateName: string
  languageCode?: string
  bodyParams?: string[]
}

async function ensureEnv() {
  const token = (process.env.WHATSAPP_ACCESS_TOKEN || '').trim()
  const phoneId = (process.env.WABA_PHONE_NUMBER_ID || '').trim()
  if (!token) throw new Error('Missing WHATSAPP_ACCESS_TOKEN')
  if (!phoneId) throw new Error('Missing WABA_PHONE_NUMBER_ID')
  return { token, phoneId }
}

export async function sendWhatsAppText({ to, body }: SendTextParams) {
  const { token, phoneId } = await ensureEnv()
  const url = `https://graph.facebook.com/v19.0/${phoneId}/messages`
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: { preview_url: false, body }
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(`WhatsApp text send failed: ${res.status} ${err}`)
  }
}

export async function sendWhatsAppTemplate({
  to,
  templateName,
  languageCode = 'en_US',
  bodyParams = []
}: SendTemplateParams) {
  const { token, phoneId } = await ensureEnv()
  const url = `https://graph.facebook.com/v19.0/${phoneId}/messages`
  const components =
    bodyParams.length > 0
      ? [
          {
            type: 'body',
            parameters: bodyParams.map((v) => ({ type: 'text', text: v }))
          }
        ]
      : []
  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
      components
    }
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(`WhatsApp template send failed: ${res.status} ${err}`)
  }
}