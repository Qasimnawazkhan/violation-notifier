import { ViolationType } from '@prisma/client'

export const VIOLATION_TYPE_VALUES: ViolationType[] = [
  'OverSpeeding',
  'SeatBelt',
  'FollowingDistance',
  'PhoneUse',
  'SignalBreak',
  'DocumentsMissing',
  'Other',
]