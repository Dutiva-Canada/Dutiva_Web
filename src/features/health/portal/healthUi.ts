import type { Bi, Lang } from '@/i18n/core'
import { pick } from '@/i18n/core'
import { healthMessages as HM } from '@/i18n/messages/health'
import { brokeStreak, dayKey, habitStreak, recentDayKeys } from '../data/healthStats'
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

/** "Oct 4, 3:30 p.m." — compact timestamp for check-in rows. Adds the
    year once the row isn't from this year, so old history stays legible. */
export function fmtDateTime(iso: string, lang: Lang, now: Date = new Date()): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return dateFmt(lang, {
    month: 'short',
    day: 'numeric',
    ...(d.getFullYear() !== now.getFullYear() ? { year: 'numeric' as const } : {}),
    hour: 'numeric',
    minute: '2-digit',
  }).format(d)
}

/** "Wednesday, October 15" — the orienting date line on Overview. */
export function fmtToday(lang: Lang, now: Date = new Date()): string {
  return dateFmt(lang, { weekday: 'long', month: 'long', day: 'numeric' }).format(now)
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

/** "Today, 3:30 p.m." / "Yesterday, …" / "Oct 4, …" — history timestamps
    lead with the relative day so recent rows scan faster. */
export function fmtRelativeDateTime(iso: string, lang: Lang, now: Date = new Date()): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const entryDay = new Date(d)
  entryDay.setHours(0, 0, 0, 0)
  const diff = Math.round((today.getTime() - entryDay.getTime()) / DAY_MS)
  if (diff === 0 || diff === 1) {
    const label = pick(diff === 0 ? HM.health_day_today : HM.health_day_yesterday, lang)
    const time = dateFmt(lang, { hour: 'numeric', minute: '2-digit' }).format(d)
    return `${label}, ${time}`
  }
  return fmtDateTime(iso, lang, now)
}

const DAY_MS = 24 * 60 * 60 * 1000

/* "This week" in the greetings is the same last-7-calendar-days window the
   stats and charts use — a rolling 7×24h cutoff would quietly disagree with
   the numbers on the page it sits next to. */
function weekCheckIns(state: HealthState, now: Date): number {
  const weekDays = new Set(recentDayKeys(7, now))
  return state.checkIns.filter((c) => weekDays.has(dayKey(c.createdAt))).length
}

/* A fresh break is a change; a live streak is a standing state — the change
   is the thing worth noticing. The 3-day floor keeps a two-day dabble from
   earning an elegy. */
function pausedHabit(
  state: HealthState,
  now: Date,
): { name: string; days: number } | null {
  let longest: { name: string; days: number } | null = null
  for (const h of state.habits) {
    const run = brokeStreak(state.habitLogs, h.id, now)
    if (run >= 3 && (!longest || run > longest.days)) longest = { name: h.name, days: run }
  }
  return longest
}

/** Mira's opening turn on an empty conversation — one breath: hello, at most
    one thing she noticed (a habit run that just paused, the best live
    streak, else this week's check-in count), then a question.
    Deterministic and bilingual, so she speaks first without a model call. */
export function companionGreeting(
  state: HealthState | undefined,
  lang: Lang,
  now: Date = new Date(),
): string {
  const parts = [pick(HM.health_chat_hi, lang)]
  if (state) {
    const paused = pausedHabit(state, now)
    let best: { name: string; streak: number } | null = null
    for (const h of state.habits) {
      const streak = habitStreak(state.habitLogs, h.id, now)
      if (streak >= 2 && (!best || streak > best.streak)) best = { name: h.name, streak }
    }
    if (paused) {
      parts.push(
        pick(HM.health_chat_hi_broke, lang)
          .replace('{name}', paused.name)
          .replace('{days}', String(paused.days)),
      )
    } else if (best) {
      parts.push(
        pick(HM.health_chat_hi_streak, lang)
          .replace('{name}', best.name)
          .replace('{days}', String(best.streak)),
      )
    } else {
      const count = weekCheckIns(state, now)
      if (count >= 2) {
        parts.push(pick(HM.health_chat_hi_checkins, lang).replace('{count}', String(count)))
      }
    }
  }
  parts.push(pick(HM.health_chat_hi_ask, lang))
  return parts.join(' ')
}

/** The Overview strip — Mira's quiet presence outside the chat tab. One
    thing she noticed, picked deterministically from local state (no call):
    a habit run that just paused, the best live streak, else a nod to
    today's check-in — quoting the note when there is one — else this
    week's check-in count. Null means nothing worth noticing; the strip
    stays hidden. */
export function miraNoticed(
  state: HealthState | undefined,
  lang: Lang,
  now: Date = new Date(),
): string | null {
  if (!state) return null
  const paused = pausedHabit(state, now)
  if (paused) {
    return pick(HM.health_home_mira_broke, lang)
      .replace('{name}', paused.name)
      .replace('{days}', String(paused.days))
  }
  let best: { name: string; streak: number } | null = null
  for (const h of state.habits) {
    const streak = habitStreak(state.habitLogs, h.id, now)
    if (streak >= 2 && (!best || streak > best.streak)) best = { name: h.name, streak }
  }
  if (best) {
    return pick(HM.health_home_mira_streak, lang)
      .replace('{name}', best.name)
      .replace('{days}', String(best.streak))
  }
  const startOfDay = new Date(now)
  startOfDay.setHours(0, 0, 0, 0)
  const todayCheckIn = state.checkIns.find(
    (c) => Date.parse(c.createdAt) >= startOfDay.getTime(),
  )
  if (todayCheckIn?.note.trim()) {
    const note = todayCheckIn.note.replace(/\s+/g, ' ').trim().slice(0, 80)
    return pick(HM.health_home_mira_note, lang).replace('{note}', note)
  }
  if (todayCheckIn) {
    return pick(HM.health_home_mira_checkin, lang).replace(
      '{mood}',
      moodLabel(todayCheckIn.mood, lang).toLowerCase(),
    )
  }
  /* Weekly rhythm — "your Sundays run low." Only fires when one weekday
     has 3+ logged days in the last 6 weeks AND averages clearly below the
     person's own norm (≥0.5 under their mean, ≤2.8 absolute): a single
     rough Tuesday never earns the line, and neither do three check-ins
     all taken on the same Tuesday — the count is days, not entries, and
     both sides of the comparison weight days equally. Observational,
     never causal — Mira names the pattern, she doesn't explain it. */
  const windowDays = new Set(recentDayKeys(42, now))
  const dayMoods = new Map<string, number[]>()
  for (const c of state.checkIns) {
    const key = dayKey(c.createdAt)
    if (!windowDays.has(key)) continue
    const list = dayMoods.get(key) ?? []
    list.push(c.mood)
    dayMoods.set(key, list)
  }
  if (dayMoods.size >= 8) {
    const byWeekday = new Map<number, number[]>()
    let overallTotal = 0
    for (const [key, moods] of dayMoods) {
      const dayMean = moods.reduce((a, b) => a + b, 0) / moods.length
      /* Noon anchors the weekday to the calendar date regardless of DST —
         the key is already a local day, so this can't drift a day. */
      const day = new Date(`${key}T12:00:00`).getDay()
      const list = byWeekday.get(day) ?? []
      list.push(dayMean)
      byWeekday.set(day, list)
      overallTotal += dayMean
    }
    const overall = overallTotal / dayMoods.size
    let lowDay: number | null = null
    let lowAvg = Infinity
    for (const [day, moods] of byWeekday) {
      if (moods.length < 3) continue
      const avg = moods.reduce((a, b) => a + b, 0) / moods.length
      if (avg <= overall - 0.5 && avg <= 2.8 && avg < lowAvg) {
        lowAvg = avg
        lowDay = day
      }
    }
    if (lowDay !== null) {
      /* Any real date on that weekday names it in the reader's locale —
         no hardcoded table. */
      const sample = state.checkIns.find(
        (c) => new Date(c.createdAt).getDay() === lowDay,
      )
      const name = dateFmt(lang, { weekday: 'long' }).format(
        new Date(sample?.createdAt ?? now),
      )
      return pick(HM.health_home_mira_weekday, lang).replace('{day}', name)
    }
  }
  const weekCount = weekCheckIns(state, now)
  if (weekCount >= 2) {
    /* The Overview strip's own wording — the greeting's "already" reads as
       a hello, not an observation. */
    return pick(HM.health_home_mira_week, lang).replace('{count}', String(weekCount))
  }
  /* Quiet-return: someone with a history who hasn't checked in for 3+ days.
     Never fires on a brand-new account — absence needs a relationship to
     be absent from. */
  const newest = state.checkIns[0]
  if (newest && state.checkIns.length >= 3) {
    const silentDays = Math.floor((now.getTime() - Date.parse(newest.createdAt)) / DAY_MS)
    if (silentDays >= 3) {
      return pick(HM.health_home_mira_away, lang).replace('{days}', String(silentDays))
    }
  }
  return null
}
