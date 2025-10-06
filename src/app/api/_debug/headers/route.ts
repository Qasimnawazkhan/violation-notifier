import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const got = req.headers.get('x-webhook-secret') || ''
  const expected = process.env.INBOUND_AMAZON_SECRET || ''
  return NextResponse.json({
    received: got,
    received_length: got.length,
    expected_length: expected.length
  })
}