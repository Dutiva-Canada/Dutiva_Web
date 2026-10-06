import type { Bi, Lang } from '@/i18n/core'
import { pick } from '@/i18n/core'
import { healthMessages as HM } from '@/i18n/messages/health'
import { habitStreak } from '../data/healthStats'
import type { HealthState } from '../data/types'

/** Localized 1–5 labels for the mood and energy scales. */
export const MOOD_LABELS: Record<number, Bi> = {
  1: HM.health_mood_1,
  2: HM.health_mood_2,
  3: HM.health_mood_3,
  4: HM.health_mood_4,
  5: HM.health_mood_5,
}

export const ENERGY_LABELS: Record<number, Bi> = {
  1: HM.health_energy_1,
  2: HM.health_energy_2,
  3: HM.health_energy_3,
  4: HM.health_energy_4,
  5: HM.health_energy_5,
}

export function moodLabel(value: number | null, lang: Lang): string {
  if (value == null) return '—'
  const rounded = Math.round(value)
  const label = MOOD_LABELS[rounded]
  return label ? pick(label, lang) : value.toFixed(1)
}

export function energyLabel(value: number | null, lang: Lang): string {
  if (value == null) return '—'
  const rounded = Math.round(value)
  const label = ENERGY_LABELS[rounded]
  return label ? pick(label, lang) : value.toFixed(1)
}

const dateFmt = (lang: Lang, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', opts)

/** "Oct 4, 3:30 p.m." — compact timestamp for check-in rows. */
export function fmtDateTime(iso: string, lang: Lang): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return dateFmt(lang, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d)
}

/** "Oct 4, 2026" — journal entry dates. */
export function fmtDate(iso: string, lang: Lang): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return dateFmt(lang, { month: 'short', day: 'numeric', year: 'numeric' }).format(d)
}

/** "Oct 4" from a YYYY-MM-DD day key — chart labels. */
export function fmtDay(dayKey: string, lang: Lang): string {
  const [y, m, d] = dayKey.split('-').map(Number)
  if (!y || !m || !d) return dayKey
  return dateFmt(lang, { month: 'short', day: 'numeric' }).format(new Date(y, m - 1, d))
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

/** Mira's opening turn on an empty conversation — one breath: hello, at most
    one thing she noticed (the best live habit streak, else this week's
    check-in count), then a question. Deterministic and bilingual, so the
    companion speaks first without a model call. */
export function companionGreeting(
  state: HealthState | undefined,
  lang: Lang,
  now: Date = new Date(),
): string {
  const parts = [pick(HM.health_chat_hi, lang)]
  if (state) {
    let best: { name: string; streak: number } | null = null
    for (const h of state.habits) {
      const streak = habitStreak(state.habitLogs, h.id, now)
      if (streak >= 2 && (!best || streak > best.streak)) best = { name: h.name, streak }
    }
    if (best) {
      parts.push(
        pick(HM.health_chat_hi_streak, lang)
          .replace('{name}', best.name)
          .replace('{days}', String(best.streak)),
      )
    } else {
      const cutoff = now.getTime() - WEEK_MS
      const count = state.checkIns.filter((c) => Date.parse(c.createdAt) >= cutoff).length
      if (count >= 2) {
        parts.push(pick(HM.health_chat_hi_checkins, lang).replace('{count}', String(count)))
      }
    }
  }
  parts.push(pick(HM.health_chat_hi_ask, lang))
  return parts.join(' ')
}
