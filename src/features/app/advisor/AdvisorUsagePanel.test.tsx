import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ForcedLangProvider } from '@/i18n/ForcedLangProvider'
import { ThemeProvider } from '@/lib/theme'
import { PlanContext, makePlanContextValue } from '@/features/app/billing/planContext'
import { WorkspaceModeContext } from '@/features/app/workspaceMode/workspaceModeContext'
import type { WorkspaceModeContextValue } from '@/features/app/workspaceMode/workspaceModeContext'
import { AdvisorUsagePanel } from './AdvisorUsagePanel'
import { fetchAdvisorUsageSummary } from './advisorUsageSummaryApi'

vi.mock('./advisorUsageSummaryApi', () => ({
  fetchAdvisorUsageSummary: vi.fn(),
}))

const fetchMock = vi.mocked(fetchAdvisorUsageSummary)

const MODE: WorkspaceModeContextValue = {
  mode: 'production',
  isAdmin: true,
  identity: {
    companyName: 'Dutiva Canada Inc.',
    user: {
      name: 'Martin',
      initials: 'MC',
      role: { en: 'Admin', fr: 'Admin' },
      email: 'martin.constantineau@dutiva.ca',
    },
  },
  companyName: 'Dutiva Canada Inc.',
  organizationId: '11111111-1111-4111-8111-111111111111',
  memberRole: 'owner',
  isOrgAdmin: true,
  setMode: async () => {},
  refreshIdentity: async () => {},
}

const SUMMARY = {
  organizationId: '11111111-1111-4111-8111-111111111111',
  plan: 'free',
  monthlyLimit: 20,
  monthlyUsed: 0,
  monthlyRemaining: 20,
  rolloverBalance: 0,
  nearestRolloverExpiry: null,
  packBalance: 0,
  overageEnabled: false,
  overageUsed: 0,
  overageCap: 500,
  nextResetAt: '2026-10-01T00:00:00.000Z',
}

function renderPanel(staff: boolean) {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <ForcedLangProvider lang="en">
          <PlanContext.Provider
            value={makePlanContextValue({
              plan: staff ? 'pro' : 'free',
              subscriptionStatus: staff ? 'active' : 'inactive',
              stripeCustomerId: null,
              organizationId: MODE.organizationId,
              isAdmin: staff,
              loading: false,
            })}
          >
            <WorkspaceModeContext.Provider value={MODE}>
              <AdvisorUsagePanel />
            </WorkspaceModeContext.Provider>
          </PlanContext.Provider>
        </ForcedLangProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

describe('AdvisorUsagePanel', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    fetchMock.mockResolvedValue(SUMMARY)
  })

  it('shows customer included-reply framing for non-staff', async () => {
    renderPanel(false)
    await waitFor(() => {
      expect(screen.getByText('This month: 20 of 20 included left')).toBeInTheDocument()
    })
    expect(screen.getByText(/Overage billing: No/)).toBeInTheDocument()
  })

  it('tells @dutiva.ca staff replies are not capped and frames the org meter as visibility', async () => {
    renderPanel(true)
    await waitFor(() => {
      expect(
        screen.getByText(/Internal Dutiva account — Advisor replies aren’t capped/),
      ).toBeInTheDocument()
    })
    expect(
      screen.getByText(
        'Workspace meter (visibility only): 0 used this month against a Free org bank of 20.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText('This month: 20 of 20 included left')).not.toBeInTheDocument()
  })
})
