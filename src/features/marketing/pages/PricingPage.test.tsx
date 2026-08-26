import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LangProvider } from '@/i18n/LangProvider'
import { ThemeProvider } from '@/lib/theme'
import { AuthProvider } from '@/features/app/auth/AuthProvider'
import { PlanProvider } from '@/features/app/billing/PlanProvider'
import { PAID_PLANS_DISABLED_DURING_BETA } from '@/config/plans'
import { PricingPage } from './PricingPage'

/**
 * Mirrors the production wrapping in src/app/router.tsx's `pricing()`
 * helper (Auth + Plan providers only, not the full app AppProviders bundle)
 * so this test exercises the same provider composition /pricing actually
 * renders with.
 */
function renderPricing(route = '/pricing') {
  return render(
    <ThemeProvider>
      <LangProvider>
        <MemoryRouter initialEntries={[route]}>
          <AuthProvider>
            <PlanProvider>
              <Routes>
                <Route path="/pricing" element={<PricingPage />} />
              </Routes>
            </PlanProvider>
          </AuthProvider>
        </MemoryRouter>
      </LangProvider>
    </ThemeProvider>,
  )
}

describe('PricingPage', () => {
  it('renders the hero and all four plan tiers in English', () => {
    renderPricing()
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Pick a plan that fits today. Upgrade when your HR work grows.',
      }),
    ).toBeInTheDocument()

    /* Each tier name now appears in both the plan card and the comparison
       table header, so assert presence rather than a single occurrence. */
    for (const name of ['Free / Beta', 'Starter', 'Growth', 'Professional']) {
      expect(screen.getAllByText(name).length).toBeGreaterThan(0)
    }
    /* Paid plans are beta-disabled (PAID_PLANS_DISABLED_DURING_BETA), so every
       paid tier (Starter, Growth, Pro) shows "Coming soon" instead of Growth's
       usual "Most popular" badge. */
    expect(screen.getAllByText('Coming soon').length).toBe(3)
    expect(screen.queryByText('Most popular')).toBeNull()
  })

  /* The billing toggle is hidden while PAID_PLANS_DISABLED_DURING_BETA is on
     (no path should advertise a price nobody can buy). The annual-price
     calculation (annualPerMonth / annualTotal) is still unit-tested in
     plans.test.ts — this test only covers the toggle interaction itself. */
  it.skipIf(PAID_PLANS_DISABLED_DURING_BETA)(
    'switches plan prices when toggling to annual billing',
    async () => {
      const user = userEvent.setup()
      renderPricing()
      expect(screen.getByText('$49')).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: /Annual/i }))
      expect(screen.getByText('$41')).toBeInTheDocument()
      expect(screen.queryByText('$49')).not.toBeInTheDocument()
    },
  )

  it('hides the annual billing toggle while paid plans are beta-disabled', () => {
    if (!PAID_PLANS_DISABLED_DURING_BETA) return
    renderPricing()
    expect(screen.queryByRole('button', { name: /Annual/i })).toBeNull()
    // Only monthly prices are shown — Growth at $49.
    expect(screen.getByText('$49')).toBeInTheDocument()
  })

  it('renders the feature comparison table', () => {
    renderPricing()
    expect(screen.getByText('AI Advisor')).toBeInTheDocument()
    expect(screen.getByText('Advisor access')).toBeInTheDocument()
    expect(screen.getByText('Save & export documents')).toBeInTheDocument()
  })

  it('shows the not-legal-advice disclaimer', () => {
    renderPricing()
    expect(screen.getByText(/not provide legal advice/i)).toBeInTheDocument()
  })

  it('re-localizes to French via the header language toggle', async () => {
    const user = userEvent.setup()
    renderPricing()
    const [langToggle] = screen.getAllByRole('button', { name: /Toggle language/ })
    await user.click(langToggle as HTMLElement)
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Choisissez un forfait qui convient aujourd’hui. Évoluez quand vos RH grandissent.',
      }),
    ).toBeInTheDocument()
  })

  it('shows paid plans as disabled "Available after beta" while beta plan disabling is on', () => {
    renderPricing()
    const betaCtas = screen.getAllByRole('button', { name: /Available after beta/i })
    expect(betaCtas.length).toBeGreaterThan(0)
    for (const button of betaCtas) {
      expect(button).toBeDisabled()
    }
    expect(screen.queryByRole('button', { name: /Sign in to continue/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /Upgrade to Growth/i })).toBeNull()
  })

  it('shows a success card with plan name and workspace link for a Stripe return', () => {
    renderPricing('/pricing?checkout=success&plan=growth')
    expect(screen.getByText('Payment received')).toBeInTheDocument()
    expect(screen.getByText(/your subscription is being set up/i)).toBeInTheDocument()
    /* The purchased plan name appears as a badge inside the success card
       (and elsewhere on the page — plan cards + comparison table). */
    const heading = screen.getByText('Payment received')
    const card = heading.closest('[role="status"]')!
    expect(card.querySelector('.badge')!.textContent).toBe('Growth')
    /* A CTA links the user back to their workspace. */
    const workspaceLink = screen.getByRole('link', { name: /go to your workspace/i })
    expect(workspaceLink).toHaveAttribute('href', '/app/welcome')
  })

  it('shows a plain success notice when no plan param is present', () => {
    renderPricing('/pricing?checkout=success')
    /* Falls back to the simpler gold banner without the card layout. */
    expect(screen.getByText(/your subscription is being set up/i)).toBeInTheDocument()
    expect(screen.queryByText('Payment received')).toBeNull()
  })

  it('shows a cancelled notice for a Stripe return', () => {
    renderPricing('/pricing?checkout=cancelled')
    expect(screen.getByText(/checkout was cancelled/i)).toBeInTheDocument()
  })
})
