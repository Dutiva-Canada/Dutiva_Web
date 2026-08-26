import { describe, expect, it } from 'vitest'
import { AdvisorUsageLimitError } from './chatApi'
import { usageLimitReply, usageWaitPhrase } from './usageLimit'

describe('usageWaitPhrase', () => {
  it.each([
    [1, 'a minute'],
    [90, 'a minute'],
    [91, '2 minutes'],
    [300, '5 minutes'],
    [1500, '25 minutes'],
    [3600, 'an hour'],
    [5400, 'an hour'],
    [5401, '2 hours'],
    [7200, '2 hours'],
    [82_800, '23 hours'],
  ])('renders %i seconds as "%s"', (seconds, expected) => {
    expect(usageWaitPhrase(seconds).en).toBe(expected)
  })

  it('always rounds up, so acting on the phrase cannot earn a second refusal', () => {
    expect(usageWaitPhrase(121).en).toBe('3 minutes')
    expect(usageWaitPhrase(3601).en).toBe('an hour')
    expect(usageWaitPhrase(7201).en).toBe('3 hours')
  })

  it('clamps at a day — no ceiling here has a longer window', () => {
    expect(usageWaitPhrase(86_400).en).toBe('24 hours')
    expect(usageWaitPhrase(999_999).en).toBe('24 hours')
  })

  it.each([[0], [-30], [Number.NaN], [Number.POSITIVE_INFINITY]])(
    'falls back to a minute for the nonsensical delay %p',
    (seconds) => {
      expect(usageWaitPhrase(seconds).en).toBe('a minute')
    },
  )

  it('ships French for every branch', () => {
    expect(usageWaitPhrase(60).fr).toBe('une minute')
    expect(usageWaitPhrase(600).fr).toBe('10 minutes')
    expect(usageWaitPhrase(3600).fr).toBe('une heure')
    expect(usageWaitPhrase(10_800).fr).toBe('3 heures')
  })
})

describe('usageLimitReply', () => {
  it('tells the user when their own budget frees up', () => {
    const reply = usageLimitReply(new AdvisorUsageLimitError('daily', 7200))
    expect(reply.en).toContain('about 2 hours')
    expect(reply.fr).toContain('environ 2 heures')
    expect(reply.en).not.toContain('{wait}')
    expect(reply.fr).not.toContain('{wait}')
  })

  it('says the rest of the product still works — the point of the beta', () => {
    const reply = usageLimitReply(new AdvisorUsageLimitError('burst', 300))
    expect(reply.en).toContain('Everything else in Dutiva still works')
    expect(reply.fr).toContain('Tout le reste de Dutiva fonctionne encore')
  })

  it('does not blame the user for a beta-wide ceiling', () => {
    const mine = usageLimitReply(new AdvisorUsageLimitError('daily_tokens', 600))
    const platform = usageLimitReply(new AdvisorUsageLimitError('platform_daily', 600))
    expect(mine.en).toContain("You've hit")
    expect(platform.en).toContain('beta-wide')
    expect(platform.en).not.toContain("You've hit")
  })

  it('names the included amount and pack prices on a commercial limit', () => {
    const reply = usageLimitReply(new AdvisorUsageLimitError('commercial', 86_400))
    expect(reply.en).toContain('80 included')
    expect(reply.en).toContain('$5')
    expect(reply.en).toContain('$15')
    expect(reply.en).toContain('not a plan feature')
    expect(reply.en).not.toContain('unlimited')
    expect(reply.fr).toContain('80')
    expect(reply.fr).toContain('5 $')
    expect(reply.en).not.toContain('{included}')
  })
})
