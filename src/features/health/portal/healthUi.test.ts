import { describe, expect, it } from 'vitest'
import type { HealthState } from '../data/types'
import { companionGreeting, miraNoticed } from './healthUi'

const NOW = new Date('2026-10-05T15:00:00')
const localDay = (ago: number) => {
  const d = new Date(NOW)
  d.setDate(d.getDate() - ago)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}
const todayAt = (hour: number) => {
  const d = new Date(NOW)
  d.setHours(hour, 30, 0, 0)
  return d.toISOString()
}

const EMPTY: HealthState = {
  checkIns: [],
  entries: [],
  habits: [],
  habitLogs: [],
  lastLoadedAt: NOW.toISOString(),
}

describe('miraNoticed — the Overview strip', () => {
  it('leads with the best live habit streak', () => {
    const state: HealthState = {
      ...EMPTY,
      habits: [
        { id: 'h1', name: 'Walk', createdAt: '2026-09-01T00:00:00Z' },
        { id: 'h2', name: 'Stretch', createdAt: '2026-09-01T00:00:00Z' },
      ],
      habitLogs: [
        ...[0, 1, 2].map((ago, i) => ({
          id: `w${i}`,
          habitId: 'h1',
          day: localDay(ago),
          createdAt: NOW.toISOString(),
        })),
        ...[0, 1].map((ago, i) => ({
          id: `s${i}`,
          habitId: 'h2',
          day: localDay(ago),
          createdAt: NOW.toISOString(),
        })),
      ],
    }
    expect(miraNoticed(state, 'en', NOW)).toBe('“Walk” — 3 days running.')
  })

  it('quotes today’s check-in note when there is no streak', () => {
    const state: HealthState = {
      ...EMPTY,
      checkIns: [
        {
          id: 'c1',
          mood: 3,
          energy: null,
          note: 'Long meeting day,   tired but okay',
          createdAt: todayAt(9),
        },
      ],
    }
    expect(miraNoticed(state, 'en', NOW)).toBe(
      'You wrote today: “Long meeting day, tired but okay”',
    )
  })

  it('falls back to the mood word, then the week count, then silence', () => {
    const moodOnly: HealthState = {
      ...EMPTY,
      checkIns: [{ id: 'c1', mood: 4, energy: null, note: '', createdAt: todayAt(8) }],
    }
    expect(miraNoticed(moodOnly, 'en', NOW)).toBe('You checked in today — feeling good.')

    const week: HealthState = {
      ...EMPTY,
      checkIns: [3, 5].map((ago) => ({
        id: `c${ago}`,
        mood: 3,
        energy: null,
        note: '',
        createdAt: new Date(Date.parse(localDay(ago) + 'T12:00:00')).toISOString(),
      })),
    }
    expect(miraNoticed(week, 'en', NOW)).toContain('2 times this week')

    expect(miraNoticed(EMPTY, 'en', NOW)).toBeNull()
    expect(miraNoticed(undefined, 'en')).toBeNull()
  })

  it('speaks French', () => {
    const state: HealthState = {
      ...EMPTY,
      checkIns: [{ id: 'c1', mood: 4, energy: null, note: '', createdAt: todayAt(8) }],
    }
    expect(miraNoticed(state, 'fr', NOW)).toBe(
      'Vous avez pris le point aujourd’hui — bien.',
    )
  })

  it('notes an absence when a returning user goes quiet — but never greets a stranger with it', () => {
    /* 4 old check-ins, newest 5 days ago: a lapsed regular. */
    const quiet: HealthState = {
      ...EMPTY,
      checkIns: [5, 8, 12, 20].map((ago) => ({
        id: `c${ago}`,
        mood: 3,
        energy: null,
        note: '',
        createdAt: new Date(Date.parse(localDay(ago) + 'T12:00:00')).toISOString(),
      })),
    }
    expect(miraNoticed(quiet, 'en', NOW)).toBe(
      'It’s been 5 days since your last check-in — the door’s open whenever.',
    )

    /* Two stale check-ins don't make a relationship — stays silent. */
    const thin: HealthState = {
      ...EMPTY,
      checkIns: [10, 20].map((ago) => ({
        id: `c${ago}`,
        mood: 3,
        energy: null,
        note: '',
        createdAt: new Date(Date.parse(localDay(ago) + 'T12:00:00')).toISOString(),
      })),
    }
    expect(miraNoticed(thin, 'en', NOW)).toBeNull()

    /* A yesterday check-in isn't an absence. */
    const recent: HealthState = {
      ...EMPTY,
      checkIns: [1, 4, 9].map((ago) => ({
        id: `c${ago}`,
        mood: 3,
        energy: null,
        note: '',
        createdAt: new Date(Date.parse(localDay(ago) + 'T12:00:00')).toISOString(),
      })),
    }
    expect(miraNoticed(recent, 'en', NOW)).not.toContain('door')
  })
})

describe('companionGreeting', () => {
  it('always ends with the arrival question', () => {
    expect(companionGreeting(EMPTY, 'en', NOW)).toContain('How are you arriving today?')
    expect(companionGreeting(EMPTY, 'fr', NOW)).toContain('aujourd’hui')
  })
})
