import { describe, expect, it } from 'vitest'
import { relativeTimeLabel } from './workspaceNotificationsApi'

describe('relativeTimeLabel', () => {
  const now = Date.parse('2026-08-23T15:00:00.000Z')

  it('formats just-now and minute buckets', () => {
    expect(relativeTimeLabel('2026-08-23T14:59:45.000Z', now).en).toBe('Just now')
    expect(relativeTimeLabel('2026-08-23T14:50:00.000Z', now).en).toBe('10m ago')
    expect(relativeTimeLabel('2026-08-23T14:50:00.000Z', now).fr).toBe('Il y a 10 min')
  })

  it('formats hour and day buckets', () => {
    expect(relativeTimeLabel('2026-08-23T12:00:00.000Z', now).en).toBe('3h ago')
    expect(relativeTimeLabel('2026-08-22T15:00:00.000Z', now).en).toBe('Yesterday')
    expect(relativeTimeLabel('2026-08-20T15:00:00.000Z', now).fr).toBe('Il y a 3 jours')
  })
})
