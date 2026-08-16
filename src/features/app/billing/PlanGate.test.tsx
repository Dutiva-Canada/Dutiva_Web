import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LangProvider } from '@/i18n/LangProvider'
import { ThemeProvider } from '@/lib/theme'
import { PlanContext } from './planContext'
import type { PlanContextValue } from './planContext'
import { WorkspaceModeContext } from '@/features/app/workspaceMode/workspaceModeContext'
import type { WorkspaceModeContextValue } from '@/features/app/workspaceMode/workspaceModeContext'
import { PlanGate } from './PlanGate'

/* PlanGate has two bypass paths — admin and demo mode — and one enforcement
   path: production mode with a plan below `required`. These tests cover all
   three, plus the loading state. The contexts are mocked directly so the
   test doesn't need Supabase or a real session. */

const DEMO_MODE: WorkspaceModeContextValue = {
  mode: 'demo',
  isAdmin: false,
  identity: {
    companyName: 'Northgate Logistics Inc.',
    user: { name: 'Riley Chen', initials: 'RC', role: { en: 'HR Manager', fr: 'Gestionnaire RH' }, email: 'riley@northgate.ca' },
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
  return {
    plan: 'free',
    subscriptionStatus: 'inactive',
    stripeCustomerId: null,
    isAdmin: false,
    loading: false,
    ...overrides,
  }
}

function renderGate(
  planCtx: PlanContextValue,
  modeCtx: WorkspaceModeContextValue,
  required: 'free' | 'starter' | 'growth' | 'pro' = 'growth',
) {
  return render(
    <ThemeProvider>
      <LangProvider>
        <MemoryRouter>
          <WorkspaceModeContext.Provider value={modeCtx}>
            <PlanContext.Provider value={planCtx}>
              <PlanGate required={required}>
                <div data-testid="content">Premium content</div>
              </PlanGate>
            </PlanContext.Provider>
          </WorkspaceModeContext.Provider>
        </MemoryRouter>
      </LangProvider>
    </ThemeProvider>,
  )
}

describe('PlanGate', () => {
  it('renders children in demo mode regardless of plan', () => {
    renderGate(makePlanCtx({ plan: 'free' }), DEMO_MODE)
    expect(screen.getByTestId('content')).toBeInTheDocument()
  })

  it('renders children in production mode when plan meets the requirement', () => {
    renderGate(makePlanCtx({ plan: 'growth' }), PROD_MODE, 'growth')
    expect(screen.getByTestId('content')).toBeInTheDocument()
  })

  it('renders children in production mode when plan exceeds the requirement', () => {
    renderGate(makePlanCtx({ plan: 'pro' }), PROD_MODE, 'growth')
    expect(screen.getByTestId('content')).toBeInTheDocument()
  })

  it('renders the upgrade nudge in production mode when plan is below required', () => {
    renderGate(makePlanCtx({ plan: 'free' }), PROD_MODE, 'growth')
    expect(screen.queryByTestId('content')).not.toBeInTheDocument()
    /* The upgrade nudge links to /pricing with the required plan. */
    expect(screen.getByRole('link')).toHaveAttribute('href', '/pricing?upgrade=growth')
  })

  it('renders children when isAdmin is true, even on a free plan in production', () => {
    renderGate(makePlanCtx({ plan: 'free', isAdmin: true }), PROD_MODE, 'pro')
    expect(screen.getByTestId('content')).toBeInTheDocument()
  })

  it('renders nothing while loading', () => {
    renderGate(makePlanCtx({ loading: true }), PROD_MODE)
    expect(screen.queryByTestId('content')).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
