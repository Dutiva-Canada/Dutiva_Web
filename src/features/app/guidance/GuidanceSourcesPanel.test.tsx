import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '@/test/renderApp'
import { authMessages } from '@/i18n/messages/auth'
import { guidanceMessages } from '@/i18n/messages/guidance'
import { GuidanceSourcesPanel, updatesAreStale } from './GuidanceSourcesPanel'
import type { LawUpdate } from './api'

/**
 * The test suite forces empty Supabase env vars (vite.config.ts), so
 * `supabase` is null and the panel is always signed-out here — exactly the
 * state most users hit. Authenticated fetch behavior is covered directly in
 * api.test.ts and AuthProvider.test.tsx.
 */
describe('GuidanceSourcesPanel', () => {
  it('shows the sign-in form when signed out', () => {
    renderApp(<GuidanceSourcesPanel />)
    expect(screen.getByText('Sign in to see real legal guidance sources and recent law changes.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send sign-in link' })).toBeInTheDocument()
  })

  it('states monitoring coverage without requiring sign-in', () => {
    /* The honesty about what is not monitored must not sit behind auth — a
       reader should not have to sign in to learn the panel cannot tell them
       about an Ontario amendment. */
    renderApp(<GuidanceSourcesPanel />)
    expect(screen.getByText(guidanceMessages.guidance_coverage_heading.en)).toBeInTheDocument()
    expect(screen.getByText('Ontario')).toBeInTheDocument()
    expect(screen.getByText('Quebec')).toBeInTheDocument()
    expect(screen.getByText('Federal')).toBeInTheDocument()
    expect(screen.getAllByText('Monitored')).toHaveLength(3)
    expect(screen.queryByText('Not monitored')).not.toBeInTheDocument()
    expect(
      screen.queryByText(guidanceMessages.guidance_coverage_none_active.en),
    ).not.toBeInTheDocument()
  })

  it('reports the not-configured error when submitting without Supabase configured', async () => {
    const user = userEvent.setup()
    renderApp(<GuidanceSourcesPanel />)
    await user.type(screen.getByLabelText('Work email'), 'a@b.com')
    await user.click(screen.getByRole('button', { name: 'Send sign-in link' }))
    expect(await screen.findByText(authMessages.auth_not_configured.en)).toBeInTheDocument()
  })
})

/**
 * The monitor behind these rows stopped for 52 days in 2026 and nothing in the
 * product said so — the panel rendered undated entries that read as current.
 * These cover the freshness guard that replaced that silence.
 */
describe('updatesAreStale', () => {
  const daysAgo = (n: number): string => new Date(Date.now() - n * 86_400_000).toISOString()
  const update = (detectedAt: string | null): LawUpdate => ({
    id: `u-${detectedAt ?? 'null'}`,
    jurisdiction: 'Ontario',
    lawName: 'Employment Standards Act, 2000',
    url: 'https://www.ontario.ca/laws/statute/00e41',
    changeSummary: null,
    detectedAt,
    eventType: 'change',
  })

  it('is not stale for a recent sweep', () => {
    expect(updatesAreStale([update(daysAgo(1))])).toBe(false)
  })

  it('is not stale just inside the window', () => {
    expect(updatesAreStale([update(daysAgo(6))])).toBe(false)
  })

  it('is stale once the newest report passes the window', () => {
    expect(updatesAreStale([update(daysAgo(8))])).toBe(true)
  })

  it('is stale at the gap that actually occurred', () => {
    expect(updatesAreStale([update(daysAgo(52))])).toBe(true)
  })

  it('judges by the newest entry, not the oldest', () => {
    expect(updatesAreStale([update(daysAgo(400)), update(daysAgo(2))])).toBe(false)
  })

  it('stays quiet when nothing carries a date', () => {
    expect(updatesAreStale([update(null)])).toBe(false)
    expect(updatesAreStale([])).toBe(false)
  })

  it('ignores an unparseable date rather than warning on it', () => {
    expect(updatesAreStale([update('not-a-date')])).toBe(false)
  })
})
