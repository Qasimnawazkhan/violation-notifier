import { ViolationType } from '@prisma/client'

export const VIOLATION_KEYWORD_MAP: Record<ViolationType, string[]> = {
  OverSpeeding: ['overspeed', 'over-speed', 'overspeeding', 'speeding', 'speed limit', 'over speed'],
  SeatBelt: ['seatbelt', 'seat belt', 'no seatbelt', 'belt not fastened'],
  FollowingDistance: ['following distance', 'tailgating', 'too close', 'safe distance'],
  PhoneUse: ['phone use', 'using phone', 'mobile use', 'cellphone', 'handheld device'],
  SignalBreak: ['signal break', 'red light', 'signal violation', 'ran red', 'signalbreak'],
  DocumentsMissing: ['missing documents', 'license missing', 'registration missing', 'paperwork', 'docs missing'],
  Other: [],
}

const MASTER_REGEX = new RegExp(
  '\\b(' +
    Object.values(VIOLATION_KEYWORD_MAP)
      .flat()
      .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|') +
    ')\\b',
  'i'
)

export interface ParsedEmailResult {
  driverExternalId?: string
  vehicleNumber?: string
  violationTypes: ViolationType[]
  rawDriverMatch?: string
  textUsed: string
}

interface DriverExtractionOptions {
  driverIdPatterns?: RegExp[]
  vehiclePatterns?: RegExp[]
}

const DEFAULT_DRIVER_PATTERNS = [
  /driver[\s:_-]*id[\s:_-]*([A-Za-z0-9\-]+)/i,
  /driver[\s:_-]*#\s*([A-Za-z0-9\-]+)/i,
  /\bDID[:\s\-]*([A-Za-z0-9\-]{3,})\b/i,
]

const DEFAULT_VEHICLE_PATTERNS = [
  /vehicle[\s:_-]*no[\s:_-]*([A-Za-z0-9\-]+)/i,
  /vehicle[\s:_-]*number[\s:_-]*([A-Za-z0-9\-]+)/i,
  /\bVRN[:\s\-]*([A-Za-z0-9\-]{3,})\b/i,
]

export function parseViolationEmail(
  subject: string,
  body: string,
  opts: DriverExtractionOptions = {}
): ParsedEmailResult {
  const fullLower = [subject, body].join('\n').toLowerCase()
  const textUsed = (subject + '\n' + body).slice(0, 4000)

  const driverPatterns = opts.driverIdPatterns ?? DEFAULT_DRIVER_PATTERNS
  const vehiclePatterns = opts.vehiclePatterns ?? DEFAULT_VEHICLE_PATTERNS

  let driverExternalId: string | undefined
  for (const rx of driverPatterns) {
    const m = rx.exec(fullLower)
    if (m?.[1]) {
      driverExternalId = m[1].toUpperCase()
      break
    }
  }

  let vehicleNumber: string | undefined
  for (const rx of vehiclePatterns) {
    const m = rx.exec(fullLower)
    if (m?.[1]) {
      vehicleNumber = m[1].toUpperCase()
      break
    }
  }

  const found = new Set<ViolationType>()

  // Early exit: if the master keyword regex does not match at all, only fallback logic can classify as Other.
  const keywordsLikelyPresent = MASTER_REGEX.test(fullLower)

  if (keywordsLikelyPresent) {
    for (const [type, arr] of Object.entries(VIOLATION_KEYWORD_MAP) as [ViolationType, string[]][]) {
      for (const kw of arr) {
        const rx = new RegExp('\\b' + kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i')
        if (rx.test(fullLower)) {
          found.add(type)
          break
        }
      }
    }
  }

  if (found.size === 0 && /violation|incident|infraction|offense/.test(fullLower)) {
    found.add('Other')
  }

  return {
    driverExternalId,
    vehicleNumber,
    violationTypes: [...found],
    textUsed,
  }
}