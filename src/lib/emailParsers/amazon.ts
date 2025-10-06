import { ViolationType } from '@prisma/client'

export function parseAmazonEmail(body: string): {
  driverId?: string
  driverName?: string
  violationType?: ViolationType
  occurredAt?: Date
  vin?: string
} {
  const text = (body || '').replace(/\r/g, '')

  // Labeled patterns
  let driverId = pickFirstMatch(text, [
    /Driver\s*ID\s*[:\-#]\s*([A-Za-z0-9._-]+)/i,
    /\bID\s*[:\-#]\s*([A-Za-z0-9._-]+)/i,
    /DriverID\s*[:\-#]\s*([A-Za-z0-9._-]+)/i
  ])

  let driverName = pickFirstMatch(text, [
    /Driver\s*Name\s*[:\-]\s*([^\n]+)/i,
    /\bName\s*[:\-]\s*([^\n]+)/i
  ])?.trim()

  // Fallback: "<NAME> (<ID>) driving ..."
  const fallback = text.match(/\b([A-Z][A-Za-z .'-]+)\s*\(([A-Za-z0-9._-]{6,})\)\s+driving\b/i)
  if ((!driverId || !driverName) && fallback) {
    if (!driverName) driverName = fallback[1].trim()
    if (!driverId) driverId = fallback[2].trim()
  }

  // Optional: drop "DA " prefix
  if (driverName) driverName = driverName.replace(/^\s*DA\s+/i, '').trim()

  // VIN
  const vin = pickFirstMatch(text, [
    /\bVIN[#:\s]*([A-Z0-9]+)\b/i
  ])

  // OccurredAt (if present)
  const occurredAtStr = pickFirstMatch(text, [
    /Occurred\s*At\s*[:\-]\s*([^\n]+)/i,
    /Event(?:\s*Time)?\s*[:\-]\s*([^\n]+)/i,
    /\bDate\s*[:\-]\s*([^\n]+)/i,
    /\bTimestamp\s*[:\-]\s*([^\n]+)/i
  ])
  const occurredAt = parseDateLoose(occurredAtStr)

  const violationType = inferViolationType(text)
  return { driverId, driverName, violationType, occurredAt, vin }
}

function pickFirstMatch(text: string, patterns: RegExp[]): string | undefined {
  for (const re of patterns) {
    const m = text.match(re)
    if (m?.[1]) return m[1].trim()
  }
  return undefined
}

function parseDateLoose(s?: string): Date | undefined {
  if (!s) return undefined
  const d = new Date(s)
  return isNaN(d.getTime()) ? undefined : d
}

function inferViolationType(text: string): ViolationType | undefined {
  const lc = text.toLowerCase()
  if (/(over.?speed|speeding|excess speed)/.test(lc)) return 'OverSpeeding'
  if (/(seat.?belt)/.test(lc)) return 'SeatBelt'
  if (/(following distance|tailgating)/.test(lc)) return 'FollowingDistance'
  if (/(phone|mobile|cell\s*phone|handheld)/.test(lc)) return 'PhoneUse'
  if (/(signal|indicator|turn signal)/.test(lc)) return 'SignalBreak'
  if (/(document|license|registration|paperwork)/.test(lc)) return 'DocumentsMissing'
  return 'Other'
}