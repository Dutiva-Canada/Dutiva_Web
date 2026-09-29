import { fill, relativeTime } from '@/lib/format'
import { investMessages as IM } from '@/i18n/messages/invest'

type X = (m: { en: string; fr: string }) => string

const unitKey = {
  now: 'invest_time_now',
  min: 'invest_time_min_ago',
  hr: 'invest_time_hr_ago',
  day: 'invest_time_day_ago',
} as const

/** Localized compact age ("2 h ago") for portal lists — null when the
    timestamp is unparseable or in the future. */
export function relTimeLabel(iso: string, x: X, now: Date = new Date()): string | null {
  const rt = relativeTime(iso, now)
  if (!rt) return null
  return fill(x(IM[unitKey[rt.unit]]), { count: rt.n })
}
