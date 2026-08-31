import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { LangProvider } from '@/i18n/LangProvider'
import {
  hasAnalyticsConsent,
  hasConsentResponse,
  setAnalyticsConsent,
} from '@/lib/analyticsConsent'
import { ConsentBanner } from './ConsentBanner'
import { openCookiePreferences } from './cookiePreferences'

function renderBanner() {
  return render(
    <LangProvider>
      <MemoryRouter>
        <ConsentBanner />
      </MemoryRouter>
    </LangProvider>,
  )
}

describe('ConsentBanner', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it('shows on the first visit, when no choice has been recorded', () => {
    renderBanner()
    expect(screen.getByRole('button', { name: 'Accept' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Decline' })).toBeInTheDocument()
    // Links to the Cookie Policy.
    expect(screen.getByRole('link', { name: 'Cookie Policy' })).toHaveAttribute(
      'href',
      expect.stringContaining('cookie'),
    )
  })

  it('records consent and hides itself on Accept', async () => {
    renderBanner()
    await userEvent.click(screen.getByRole('button', { name: 'Accept' }))
    expect(hasAnalyticsConsent()).toBe(true)
    expect(hasConsentResponse()).toBe(true)
    expect(screen.queryByRole('button', { name: 'Accept' })).toBeNull()
  })

  it('records a refusal and hides itself on Decline', async () => {
    renderBanner()
    await userEvent.click(screen.getByRole('button', { name: 'Decline' }))
    expect(hasAnalyticsConsent()).toBe(false)
    // A refusal is still a recorded response — the banner should not return.
    expect(hasConsentResponse()).toBe(true)
    expect(screen.queryByRole('button', { name: 'Decline' })).toBeNull()
  })

  it('stays hidden when a choice already exists', () => {
    setAnalyticsConsent(false)
    renderBanner()
    expect(screen.queryByRole('button', { name: 'Accept' })).toBeNull()
  })

  it('reopens when the footer control fires the preferences event', async () => {
    setAnalyticsConsent(true)
    renderBanner()
    // Hidden because a choice exists…
    expect(screen.queryByRole('button', { name: 'Decline' })).toBeNull()
    // …until the footer's "Cookie preferences" control reopens it.
    act(() => openCookiePreferences())
    expect(screen.getByRole('button', { name: 'Decline' })).toBeInTheDocument()
  })
})
