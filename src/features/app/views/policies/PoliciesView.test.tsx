import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { renderApp } from '@/test/renderApp'
import { listChain } from '@/test/productionWorkspace'
import { AdvisorRail } from '@/features/app/rail/AdvisorRail'
import { DocStudioOverlay } from '@/features/app/docstudio/DocStudioOverlay'
import { PoliciesView } from './PoliciesView'

function renderPolicies() {
  return renderApp(
    <>
      <PoliciesView />
      <AdvisorRail />
      <DocStudioOverlay />
    </>,
    { route: '/app/policies', path: '/app/policies' },
  )
}

describe('PoliciesView', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the register with statuses and review dates', () => {
    renderPolicies()

    expect(screen.getByText('Review status across your policy library.')).toBeInTheDocument()

    /* All six fixture policies. */
    expect(screen.getByText('Remote Work Policy')).toBeInTheDocument()
    expect(screen.getByText('Vacation & Time Off Policy')).toBeInTheDocument()
    expect(screen.getByText('Code of Conduct')).toBeInTheDocument()
    expect(screen.getByText('Workplace Accommodation Policy')).toBeInTheDocument()
    expect(screen.getByText('Anti-Harassment & Violence Policy')).toBeInTheDocument()
    expect(screen.getByText('Expense Reimbursement Policy')).toBeInTheDocument()

    /* Status chips + last-reviewed lines. */
    expect(screen.getAllByText('Up to date')).toHaveLength(3)
    expect(screen.getAllByText('Needs review')).toHaveLength(2)
    expect(screen.getByText('Missing')).toBeInTheDocument()
    expect(screen.getByText('Last reviewed 14 months ago')).toBeInTheDocument()
    expect(screen.getByText('Last reviewed never generated')).toBeInTheDocument()

    expect(screen.getAllByRole('button', { name: 'Review with Advisor' })).toHaveLength(6)
  })

  it('opens the Advisor rail on review, and "Draft it now" hands a Missing policy to Document Studio', () => {
    renderPolicies()

    /* Row 6 — Expense Reimbursement Policy (Missing). */
    const reviewButtons = screen.getAllByRole('button', { name: 'Review with Advisor' })
    act(() => {
      fireEvent.click(reviewButtons[5]!)
    })

    const rail = screen.getByRole('dialog', { name: 'Ask Advisor' })
    expect(within(rail).getByText('Expense Reimbursement Policy')).toBeInTheDocument()

    /* Let the advisor turn think (850ms) and stream to done. */
    act(() => {
      vi.advanceTimersByTime(850 + 2000)
    })
    expect(
      within(rail).getByText(
        'This policy hasn’t been generated yet. I can draft a first version now.',
      ),
    ).toBeInTheDocument()

    /* The card's primary action closes the rail and opens Document Studio. */
    act(() => {
      fireEvent.click(within(rail).getByRole('button', { name: 'Draft it now' }))
    })
    expect(screen.queryByRole('dialog', { name: 'Ask Advisor' })).not.toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Document Studio' })).toBeInTheDocument()
    expect(screen.getByText('Advisor is drafting…')).toBeInTheDocument()
  })
})

describe('PoliciesView in production mode', () => {
  afterEach(() => {
    vi.doUnmock('@/lib/supabaseClient')
    vi.resetModules()
  })

  /** Admin signed in, production stored, one org, real hr_policies. */
  function mockProductionClient(initialPolicies: Record<string, unknown>[]) {
    const policyRows = [...initialPolicies]
    const insert = vi.fn((row: Record<string, unknown>) => ({
      select: () => ({
        single: () => {
          const created = {
            id: `policy-${policyRows.length + 1}`,
            name: row.name,
            status: row.status,
            last_reviewed: row.last_reviewed ?? null,
          }
          policyRows.push(created)
          return Promise.resolve({ data: created, error: null })
        },
      }),
    }))
    const update = vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) }))

    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: {
        auth: {
          getSession: () =>
            Promise.resolve({
              data: { session: { user: { id: 'u1', email: 'martin.constantineau@dutiva.ca' } } },
            }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
        },
        rpc: vi.fn((fn: string) => {
          if (fn === 'is_admin_user') return Promise.resolve({ data: true, error: null })
          if (fn === 'current_user_is_workspace_member')
            return Promise.resolve({ data: true, error: null })
          return Promise.resolve({ data: null, error: null })
        }),
        from: vi.fn((table: string) => {
          if (table === 'workspace_preferences') {
            return {
              select: () => ({
                eq: () => ({
                  maybeSingle: () => Promise.resolve({ data: { mode: 'production' }, error: null }),
                }),
              }),
            }
          }
          if (table === 'profiles') {
            return {
              select: () => ({
                eq: () => ({
                  maybeSingle: () =>
                    Promise.resolve({
                      data: {
                        legal_name: 'Dutiva Canada Inc.',
                        company_name: null,
                        primary_contact: 'Martin Constantineau',
                        province: 'Ontario',
                        city: 'Ottawa',
                      },
                      error: null,
                    }),
                }),
              }),
            }
          }
          if (table === 'organization_members') {
            return {
              select: () => ({
                eq: () => ({
                  eq: () => ({
                    order: () => ({
                      limit: () => ({
                        maybeSingle: () =>
                          Promise.resolve({ data: { organization_id: 'org-1' }, error: null }),
                      }),
                    }),
                  }),
                }),
              }),
            }
          }
          if (table === 'hr_policies') {
            return {
              select: () => ({
                eq: () => ({
                  order: () => listChain(policyRows),
                }),
              }),
              insert,
              update,
            }
          }
          throw new Error(`unexpected table: ${table}`)
        }),
      },
    }))
    vi.resetModules()
    return { insert, update }
  }

  it('renders the real register instead of the Northgate fixtures', async () => {
    mockProductionClient([
      {
        id: 'policy-1',
        name: 'Vacation Policy',
        status: 'needs_review',
        last_reviewed: '2025-05-01',
      },
    ])
    const { renderApp: renderAppFresh } = await import('@/test/renderApp')
    const { PoliciesView: PoliciesViewFresh } = await import('./PoliciesView')

    renderAppFresh(<PoliciesViewFresh />, { route: '/app/policies', path: '/app/policies' })

    expect(await screen.findByText('Vacation Policy')).toBeInTheDocument()
    expect(screen.getByText('1 policy')).toBeInTheDocument()
    expect(screen.getByText('Last reviewed: 2025-05-01')).toBeInTheDocument()
    expect(screen.queryByText('Remote Work Policy')).not.toBeInTheDocument()
  })

  it('adds a missing-policy gap and marks it up to date (stamping the review date)', async () => {
    const { insert, update } = mockProductionClient([])
    const { renderApp: renderAppFresh } = await import('@/test/renderApp')
    const { PoliciesView: PoliciesViewFresh } = await import('./PoliciesView')

    renderAppFresh(<PoliciesViewFresh />, { route: '/app/policies', path: '/app/policies' })

    expect(await screen.findByText('No policies yet')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Add policy' }))
    fireEvent.change(screen.getByLabelText('Policy name'), {
      target: { value: 'Expense Reimbursement Policy' },
    })
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'missing' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save policy' }))

    expect(await screen.findByText('Expense Reimbursement Policy')).toBeInTheDocument()
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: 'org-1',
        name: 'Expense Reimbursement Policy',
        status: 'missing',
      }),
    )
    expect(screen.getAllByText('Missing').length).toBeGreaterThan(1)

    fireEvent.change(screen.getByLabelText('Policy status — Expense Reimbursement Policy'), {
      target: { value: 'up_to_date' },
    })
    await waitFor(() => expect(screen.getAllByText('Up to date').length).toBeGreaterThan(1))
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'up_to_date', last_reviewed: expect.any(String) }),
    )
    expect(screen.getByText(/Last reviewed: \d{4}-\d{2}-\d{2}/)).toBeInTheDocument()
  })
})
