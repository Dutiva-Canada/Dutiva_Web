import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ForcedLangProvider } from '@/i18n/ForcedLangProvider'
import { LangProvider } from '@/i18n/LangProvider'
import { ThemeProvider } from '@/lib/theme'
import { PlanContext } from './planContext'
import type { PlanContextValue } from './planContext'
import { makePlanContextValue } from './planContext'
import { WorkspaceModeContext } from '@/features/app/workspaceMode/workspaceModeContext'
import type { WorkspaceModeContextValue } from '@/features/app/workspaceMode/workspaceModeContext'

const { PLAN_FEATURE_GATES_ENABLED } = vi.hoisted(() => ({
  PLAN_FEATURE_GATES_ENABLED: { value: false },
}))

vi.mock('@/config/plans', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/config/plans')>()
  return {
    ...actual,
    get PLAN_FEATURE_GATES_ENABLED() {
      return PLAN_FEATURE_GATES_ENABLED.value
    },
  }
})

import { PlanGate } from './PlanGate'
import type { PlanFeature } from '@/config/planEntitlements'

/* PlanGate has two bypass paths — admin and demo mode — plus the
   PLAN_FEATURE_GATES_ENABLED off switch. Enforcement is production mode
   with gates on and a plan below `required`. Contexts are mocked so the
   test doesn't need Supabase or a real session. */

const DEMO_MODE: WorkspaceModeContextValue = {
  mode: 'demo',
  isAdmin: false,
  identity: {
    companyName: 'Northgate Logistics Inc.',
    user: {
      name: 'Riley Chen',
      initials: 'RC',
      role: { en: 'HR Manager', fr: 'Gestionnaire RH' },
      email: 'riley@northgate.ca',
    },
  },
  companyName: 'Northgate Logistics Inc.',
  organizationId: null,
  memberRole: null,
  isOrgAdmin: false,
  setMode: vi.fn(),
  admissionStatus: 'idle',
  clearAdmissionStatus: vi.fn(),
}

const PROD_MODE: WorkspaceModeContextValue = {
  ...DEMO_MODE,
  mode: 'production',
}

function makePlanCtx(overrides: Partial<PlanContextValue> = {}): PlanContextValue {
  return makePlanContextValue({
    plan: 'free',
    subscriptionStatus: 'active',
    stripeCustomerId: null,
    organizationId: null,
    isAdmin: false,
    loading: false,
    ...overrides,
  })
}

function renderGate(
  planCtx: PlanContextValue,
  modeCtx: WorkspaceModeContextValue,
  opts: { required?: 'free' | 'starter' | 'growth' | 'pro'; feature?: PlanFeature } = {
    required: 'growth',
  },
) {
  return render(
    <ThemeProvider>
      <LangProvider>
        <MemoryRouter>
          <WorkspaceModeContext.Provider value={modeCtx}>
            <PlanContext.Provider value={planCtx}>
              {opts.feature !== undefined ? (
                <PlanGate feature={opts.feature}>
                  <div data-testid="content">Premium content</div>
                </PlanGate>
              ) : (
                <PlanGate required={opts.required ?? 'growth'}>
                  <div data-testid="content">Premium content</div>
                </PlanGate>
              )}
            </PlanContext.Provider>
          </WorkspaceModeContext.Provider>
        </MemoryRouter>
      </LangProvider>
    </ThemeProvider>,
  )
}

describe('PlanGate', () => {
  it('renders children in demo mode regardless of plan', () => {
    PLAN_FEATURE_GATES_ENABLED.value = true
    renderGate(makePlanCtx({ plan: 'free' }), DEMO_MODE)
    expect(screen.getByTestId('content')).toBeInTheDocument()
  })

  it('renders children in production when feature gates are off, even on a free plan', () => {
    PLAN_FEATURE_GATES_ENABLED.value = false
    renderGate(makePlanCtx({ plan: 'free' }), PROD_MODE, { required: 'growth' })
    expect(screen.getByTestId('content')).toBeInTheDocument()
  })

  it('renders children in production mode when plan meets the requirement', () => {
    PLAN_FEATURE_GATES_ENABLED.value = true
    renderGate(makePlanCtx({ plan: 'growth' }), PROD_MODE, { required: 'growth' })
    expect(screen.getByTestId('content')).toBeInTheDocument()
  })

  it('renders children in production mode when plan exceeds the requirement', () => {
    PLAN_FEATURE_GATES_ENABLED.value = true
    renderGate(makePlanCtx({ plan: 'pro' }), PROD_MODE, { required: 'growth' })
    expect(screen.getByTestId('content')).toBeInTheDocument()
  })

  it('renders the upgrade nudge in production mode when gates are on and plan is below required', () => {
    PLAN_FEATURE_GATES_ENABLED.value = true
    renderGate(makePlanCtx({ plan: 'free' }), PROD_MODE, { required: 'growth' })
    expect(screen.queryByTestId('content')).not.toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/pricing?upgrade=growth')
  })

  it('renders the upgrade nudge when subscription is past due despite a paid plan', () => {
    PLAN_FEATURE_GATES_ENABLED.value = true
    renderGate(makePlanCtx({ plan: 'pro', subscriptionStatus: 'past_due' }), PROD_MODE, {
      required: 'growth',
    })
    expect(screen.queryByTestId('content')).not.toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/pricing?upgrade=growth')
  })

  it('localizes the upgrade nudge to the French pricing page', () => {
    PLAN_FEATURE_GATES_ENABLED.value = true
    render(
      <ThemeProvider>
        <MemoryRouter>
          <ForcedLangProvider lang="fr">
            <WorkspaceModeContext.Provider value={PROD_MODE}>
              <PlanContext.Provider value={makePlanCtx({ plan: 'free' })}>
                <PlanGate required="growth">
                  <div data-testid="content">Premium content</div>
                </PlanGate>
              </PlanContext.Provider>
            </WorkspaceModeContext.Provider>
          </ForcedLangProvider>
        </MemoryRouter>
      </ThemeProvider>,
    )
    expect(screen.queryByTestId('content')).not.toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/fr/tarifs?upgrade=growth')
  })

  it('renders children when isAdmin is true, even on a free plan in production', () => {
    PLAN_FEATURE_GATES_ENABLED.value = true
    renderGate(makePlanCtx({ plan: 'free', isAdmin: true }), PROD_MODE, { required: 'pro' })
    expect(screen.getByTestId('content')).toBeInTheDocument()
  })

  it('renders nothing while loading when gates are on', () => {
    PLAN_FEATURE_GATES_ENABLED.value = true
    renderGate(makePlanCtx({ loading: true }), PROD_MODE)
    expect(screen.queryByTestId('content')).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('renders children while loading when gates are off', () => {
    PLAN_FEATURE_GATES_ENABLED.value = false
    renderGate(makePlanCtx({ loading: true }), PROD_MODE)
    expect(screen.getByTestId('content')).toBeInTheDocument()
  })

  it('gates Word export behind starter via word_compatible_export feature', () => {
    PLAN_FEATURE_GATES_ENABLED.value = true
    renderGate(makePlanCtx({ plan: 'free' }), PROD_MODE, {
      feature: 'word_compatible_export',
    })
    expect(screen.queryByTestId('content')).not.toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/pricing?upgrade=starter')
  })

  it('allows word_compatible_export on starter with an active subscription', () => {
    PLAN_FEATURE_GATES_ENABLED.value = true
    renderGate(makePlanCtx({ plan: 'starter' }), PROD_MODE, {
      feature: 'word_compatible_export',
    })
    expect(screen.getByTestId('content')).toBeInTheDocument()
  })

  it('allows free features without an active subscription', () => {
    PLAN_FEATURE_GATES_ENABLED.value = true
    renderGate(makePlanCtx({ plan: 'free', subscriptionStatus: 'inactive' }), PROD_MODE, {
      feature: 'pdf_export',
    })
    expect(screen.getByTestId('content')).toBeInTheDocument()
  })

  it('gates Growth module features behind growth', () => {
    PLAN_FEATURE_GATES_ENABLED.value = true
    renderGate(makePlanCtx({ plan: 'starter' }), PROD_MODE, {
      feature: 'operational_analytics',
    })
    expect(screen.queryByTestId('content')).not.toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/pricing?upgrade=growth')
  })
})
