import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import { listChain } from '@/test/productionWorkspace'

describe('AnalyticsView in production mode', () => {
  afterEach(() => {
    vi.doUnmock('@/lib/supabaseClient')
    vi.resetModules()
  })

  /** Admin signed in, production stored, one org, the five module tables +
   *  score snapshots. */
  function mockProductionClient(data: {
    employees?: Record<string, unknown>[]
    hr_cases?: Record<string, unknown>[]
    compliance_tasks?: Record<string, unknown>[]
    compliance_findings?: Record<string, unknown>[]
    hr_obligations?: Record<string, unknown>[]
    hr_policies?: Record<string, unknown>[]
    compliance_score_snapshots?: Record<string, unknown>[]
    hr_expiry_records?: Record<string, unknown>[]
    hr_leaves?: Record<string, unknown>[]
  }) {
    const snapshotUpsert = vi.fn(() => Promise.resolve({ error: null }))
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
          if (fn === 'resolve_user_billing_organization')
            return Promise.resolve({ data: 'org-1', error: null })
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
                        plan: 'pro',
                        subscription_status: 'active',
                        stripe_customer_id: null,
                      },
                      error: null,
                    }),
                }),
              }),
            }
          }
          if (table === 'organizations') {
            return {
              select: () => ({
                eq: () => ({
                  maybeSingle: () =>
                    Promise.resolve({
                      data: {
                        plan: 'pro',
                        subscription_status: 'active',
                        stripe_customer_id: null,
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
          const rows = (data as Record<string, Record<string, unknown>[] | undefined>)[table] ?? []
          return {
            select: () => ({
              eq: () => ({
                order: () => listChain(rows),
              }),
            }),
            upsert: snapshotUpsert,
          }
        }),
      },
    }))
    vi.resetModules()
    return { snapshotUpsert }
  }

  const EMPLOYEE = (
    id: string,
    jurisdiction: string,
    status = 'active',
    extra: Record<string, unknown> = {},
  ) => ({
    id,
    name: `Employee ${id}`,
    title: null,
    email: null,
    jurisdiction,
    start_date: null,
    status,
    ...extra,
  })

  function daysAgoIso(days: number): string {
    return new Date(Date.now() - days * 86_400_000).toISOString()
  }

  function daysFromNowDate(days: number): string {
    return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10)
  }

  it('blends a live score from the real modules and records a snapshot', async () => {
    const { snapshotUpsert } = mockProductionClient({
      hr_policies: [
        { id: 'p1', name: 'Policy A', status: 'up_to_date', last_reviewed: null },
        { id: 'p2', name: 'Policy B', status: 'missing', last_reviewed: null },
      ],
      compliance_tasks: [
        {
          id: 't1',
          title: 'Task',
          priority: 'high',
          status: 'completed',
          category: 'review',
          due_at: null,
        },
      ],
      compliance_findings: [
        {
          id: 'f1',
          title: 'Finding',
          description: null,
          recommendation: null,
          severity: 'high',
          status: 'open',
        },
      ],
      hr_obligations: [
        {
          id: 'ob1',
          title: 'Vacation reconciliation',
          area: null,
          jurisdiction: null,
          due_on: null,
          recurrence: null,
          owner_name: null,
          status: 'ok',
          evidence: null,
        },
        {
          id: 'ob2',
          title: 'OHSA program review',
          area: null,
          jurisdiction: null,
          due_on: null,
          recurrence: null,
          owner_name: null,
          status: 'ok',
          evidence: null,
        },
        {
          id: 'ob3',
          title: 'CASL consent audit',
          area: null,
          jurisdiction: null,
          due_on: null,
          recurrence: null,
          owner_name: null,
          status: 'needs_evidence',
          evidence: null,
        },
      ],
      compliance_score_snapshots: [
        { month: '2026-05-01', score: 40, headcount: null, formula_version: 1 },
        { month: '2026-06-01', score: 45, headcount: null, formula_version: 1 },
      ],
    })
    const { renderApp: renderAppFresh } = await import('@/test/renderApp')
    const { AnalyticsView: AnalyticsViewFresh } = await import('./AnalyticsView')

    renderAppFresh(<AnalyticsViewFresh />, { route: '/app/analytics', path: '/app/analytics' })

    expect(await screen.findByText('From your workspace records.')).toBeInTheDocument()

    /* Components: policies 1/2 = 50, provenanced tasks 1/1 = 100,
       findings 0/5 weight = 0, obligations 2/3 = 67 → round(217/4) = 54. */
    const card = within(await screen.findByRole('region', { name: 'Compliance score' }))
    expect(await card.findByText('54', { selector: 'span' })).toBeInTheDocument()
    expect(card.getByText('Policies current')).toBeInTheDocument()
    expect(card.getByText('1 of 2')).toBeInTheDocument()
    expect(card.getByText('Tasks complete')).toBeInTheDocument()
    expect(card.getByText('Findings resolved (weighted by severity)')).toBeInTheDocument()
    expect(card.getByText('Obligations evidenced')).toBeInTheDocument()
    /* Findings (0%) is the lowest component. */
    expect(card.getAllByText('Lowest')).toHaveLength(1)
    /* Two v1 months sit in the charted window → the formula-change note. */
    expect(
      card.getByText('Earlier months were computed under a previous score formula.'),
    ).toBeInTheDocument()

    /* History = two stored months + this month's live point. */
    const table = card.getByRole('table')
    expect(within(table).getByText('May')).toBeInTheDocument()
    expect(within(table).getByText('40')).toBeInTheDocument()

    /* The live score (and headcount — zero roster here) was written down
       for next month's history. */
    const { waitFor } = await import('@testing-library/react')
    await waitFor(() => expect(snapshotUpsert).toHaveBeenCalled())
    expect(snapshotUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: 'org-1',
        score: 54,
        headcount: 0,
        formula_version: 3,
      }),
      expect.objectContaining({ onConflict: 'organization_id,month' }),
    )
  })

  it('caps the score while a critical finding is open and says so', async () => {
    mockProductionClient({
      hr_policies: [{ id: 'p1', name: 'Policy A', status: 'up_to_date', last_reviewed: null }],
      compliance_tasks: [
        {
          id: 't1',
          title: 'Task',
          priority: 'high',
          status: 'completed',
          category: 'review',
          due_at: null,
        },
      ],
      compliance_findings: [
        {
          id: 'f1',
          title: 'Critical exposure',
          description: null,
          recommendation: null,
          severity: 'critical',
          status: 'open',
        },
        {
          id: 'f2',
          title: 'Note',
          description: null,
          recommendation: null,
          severity: 'info',
          status: 'resolved',
        },
      ],
    })
    const { renderApp: renderAppFresh } = await import('@/test/renderApp')
    const { AnalyticsView: AnalyticsViewFresh } = await import('./AnalyticsView')

    renderAppFresh(<AnalyticsViewFresh />, { route: '/app/analytics', path: '/app/analytics' })

    expect(await screen.findByText('From your workspace records.')).toBeInTheDocument()

    /* Policies 100 + tasks 100 + findings 1/9 weight (11) blend to 70 —
       above the ceiling, so the open critical caps it at 69, with the
       explanation printed rather than colour alone. */
    const card = within(await screen.findByRole('region', { name: 'Compliance score' }))
    expect(await card.findByText('69', { selector: 'span' })).toBeInTheDocument()
    expect(
      card.getByText(
        'Capped at 69 while a critical finding is open — resolve or dismiss it to lift the ceiling.',
      ),
    ).toBeInTheDocument()
  })

  it('aggregates attention, headcount, case aging and leave from live rows', async () => {
    mockProductionClient({
      employees: [
        EMPLOYEE('e1', 'Ontario'),
        EMPLOYEE('e2', 'Ontario'),
        EMPLOYEE('e3', 'Quebec'),
        EMPLOYEE('e4', 'Alberta', 'terminated'),
        EMPLOYEE('e5', 'Nova Scotia', 'on_leave'),
      ],
      hr_cases: [
        {
          id: 'c1',
          title: 'Accommodation — ergonomic assessment',
          case_type: 'Accommodation',
          employee_id: null,
          jurisdiction: 'Ontario',
          status: 'open',
          due_date: '2020-01-01',
          created_at: daysAgoIso(20),
        },
        {
          id: 'c2',
          title: 'Onboarding — first hire',
          case_type: 'Onboarding',
          employee_id: null,
          jurisdiction: 'Quebec',
          status: 'resolved',
          due_date: null,
          created_at: daysAgoIso(40),
        },
      ],
      compliance_tasks: [
        {
          id: 't1',
          title: 'File the harassment training roster',
          priority: 'high',
          status: 'open',
          category: 'general',
          due_at: '2020-06-30T00:00:00Z',
        },
      ],
    })
    const { renderApp: renderAppFresh } = await import('@/test/renderApp')
    const { AnalyticsView: AnalyticsViewFresh } = await import('./AnalyticsView')

    renderAppFresh(<AnalyticsViewFresh />, { route: '/app/analytics', path: '/app/analytics' })

    expect(await screen.findByText('From your workspace records.')).toBeInTheDocument()

    /* Attention: both dated rows are overdue; the case (2020-01-01) sorts
       ahead of the task (2020-06-30). */
    const attention = within(screen.getByRole('region', { name: 'Needs attention' }))
    const rows = await attention.findAllByRole('listitem')
    expect(within(rows[0]!).getByText('Accommodation — ergonomic assessment')).toBeInTheDocument()
    expect(within(rows[0]!).getByText('Overdue')).toBeInTheDocument()
    expect(within(rows[1]!).getByText('File the harassment training roster')).toBeInTheDocument()
    expect(within(rows[1]!).getByText('Compliance task')).toBeInTheDocument()
    expect(attention.getByRole('link', { name: 'View all (2)' })).toHaveAttribute(
      'href',
      '/app/planning/tasks',
    )

    /* Headcount counts non-terminated rows (on-leave included) — the
       terminated Alberta row is out. */
    const headcount = within(screen.getByRole('region', { name: 'Headcount by jurisdiction' }))
    expect(await headcount.findByText('4 employees total')).toBeInTheDocument()
    const headTable = headcount.getByRole('table')
    expect(within(headTable).getByText('Ontario')).toBeInTheDocument()
    expect(within(headTable).getByText('2')).toBeInTheDocument()
    expect(within(headTable).getByText('Nova Scotia')).toBeInTheDocument()
    expect(within(headTable).queryByText('Alberta')).not.toBeInTheDocument()

    /* Open cases: one open row, 20 days old (created_at drives aging). */
    const casesCard = within(screen.getByRole('region', { name: 'Open cases' }))
    expect(await casesCard.findByText('Open now')).toBeInTheDocument()
    expect(casesCard.getByText('20 days')).toBeInTheDocument()
    expect(casesCard.getByRole('link')).toHaveAttribute('href', '/app/cases/c1')
    expect(casesCard.queryByText('Onboarding — first hire')).not.toBeInTheDocument()

    /* Acknowledgments have no production data source yet — said plainly. */
    expect(screen.getByText('No acknowledgment campaigns yet.')).toBeInTheDocument()

    /* Phase 2 cards without a data source say so instead of hiding. */
    expect(
      screen.getByText('Certification records aren’t tracked in this workspace yet.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Service milestone dates aren’t tracked in this workspace yet.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Employee document expiries aren’t tracked in this workspace yet.'),
    ).toBeInTheDocument()

    /* Leave overview lists the roster's real on-leave status. */
    const leave = within(screen.getByRole('region', { name: 'Leave overview' }))
    expect(await leave.findByText('Employee e5')).toBeInTheDocument()
    expect(leave.getByRole('link')).toHaveAttribute('href', '/app/employees/e5')
    expect(
      leave.getByText('Leave types and return dates aren’t tracked in this workspace yet.'),
    ).toBeInTheDocument()

    /* Headcount trend: no snapshot history yet — first data point note,
       and turnover states its missing prerequisite. */
    const trend = within(screen.getByRole('region', { name: 'Headcount & turnover' }))
    expect(
      await trend.findByText(
        'Headcount history starts here — this month is your first data point.',
      ),
    ).toBeInTheDocument()
    expect(
      trend.getByText('Turnover needs termination history, which isn’t tracked yet.'),
    ).toBeInTheDocument()

    /* No demo constants anywhere. */
    expect(screen.queryByText('82')).not.toBeInTheDocument()
    expect(screen.queryByText('82 employees total')).not.toBeInTheDocument()
  })

  it('lights up certifications, documents, probation, leave and turnover from real records', async () => {
    mockProductionClient({
      employees: [
        EMPLOYEE('e1', 'Ontario', 'active', { probation_end_date: daysFromNowDate(10) }),
        EMPLOYEE('e2', 'Quebec', 'active', { probation_end_date: daysFromNowDate(45) }),
        EMPLOYEE('e3', 'Ontario', 'terminated', { termination_date: daysFromNowDate(-100) }),
        EMPLOYEE('e4', 'British Columbia', 'on_leave'),
        EMPLOYEE('e5', 'Nova Scotia', 'active', { probation_end_date: daysFromNowDate(3) }),
      ],
      compliance_tasks: [
        {
          id: 't-review',
          title: 'Probation review — Employee e5',
          priority: 'medium',
          status: 'open',
          category: 'review',
          due_at: null,
          metadata: { employee_id: 'e5', kind: 'probation_review' },
        },
      ],
      hr_expiry_records: [
        {
          id: 'r1',
          employee_id: 'e1',
          kind: 'certification',
          name: 'Forklift certificate',
          expiry_date: daysFromNowDate(10),
          employees: { name: 'Employee e1', jurisdiction: 'Ontario' },
        },
        {
          id: 'r2',
          employee_id: 'e2',
          kind: 'certification',
          name: 'WHMIS training',
          expiry_date: daysFromNowDate(-5),
          employees: { name: 'Employee e2', jurisdiction: 'Quebec' },
        },
        {
          id: 'r3',
          employee_id: 'e4',
          kind: 'document',
          name: 'Work permit',
          expiry_date: daysFromNowDate(20),
          employees: { name: 'Employee e4', jurisdiction: 'British Columbia' },
        },
      ],
      hr_leaves: [
        {
          id: 'l1',
          employee_id: 'e4',
          leave_type: 'Parental leave',
          is_protected: true,
          start_date: daysFromNowDate(-60),
          expected_return_date: daysFromNowDate(7),
          ended_on: null,
          employees: { name: 'Employee e4' },
        },
        {
          id: 'l2',
          employee_id: 'e1',
          leave_type: 'Vacation',
          is_protected: false,
          start_date: daysFromNowDate(-40),
          expected_return_date: daysFromNowDate(-30),
          ended_on: daysFromNowDate(-30),
          employees: { name: 'Employee e1' },
        },
      ],
    })
    const { renderApp: renderAppFresh } = await import('@/test/renderApp')
    const { AnalyticsView: AnalyticsViewFresh } = await import('./AnalyticsView')
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()

    renderAppFresh(<AnalyticsViewFresh />, { route: '/app/analytics', path: '/app/analytics' })

    expect(await screen.findByText('From your workspace records.')).toBeInTheDocument()

    /* A · Certifications: 1 expired + 1 inside 30 days, list one tap away. */
    const certs = within(await screen.findByRole('region', { name: 'Certifications & training' }))
    await user.click(await certs.findByRole('button', { name: 'Show list (2)' }))
    const certRows = certs.getAllByRole('listitem')
    expect(within(certRows[0]!).getByText('WHMIS training')).toBeInTheDocument()
    expect(within(certRows[0]!).getByText('Expired')).toBeInTheDocument()
    expect(within(certRows[1]!).getByText('Forklift certificate')).toBeInTheDocument()
    expect(within(certRows[1]!).getByRole('link')).toHaveAttribute('href', '/app/employees/e1')

    /* Escalations reach Needs attention: the expired certification and the
       ≤30-day work permit. */
    const attention = within(screen.getByRole('region', { name: 'Needs attention' }))
    expect(await attention.findByText('WHMIS training — Employee e2')).toBeInTheDocument()
    expect(attention.getByText('Work permit — Employee e4')).toBeInTheDocument()

    /* C · Probation: e5 (3 days, linked review task) then e1 (10 days, no
       task — flagged); e2 is outside the 30-day window. */
    const probation = within(screen.getByRole('region', { name: 'Service milestones due' }))
    const probationRows = await probation.findAllByRole('listitem')
    expect(probationRows).toHaveLength(2)
    expect(within(probationRows[0]!).getByText('Employee e5')).toBeInTheDocument()
    expect(within(probationRows[0]!).queryByText('No review task yet')).not.toBeInTheDocument()
    expect(within(probationRows[1]!).getByText('Employee e1')).toBeInTheDocument()
    expect(within(probationRows[1]!).getByText('No review task yet')).toBeInTheDocument()

    /* E · Leave: the real record (protected parental, imminent return)
       replaces the bare fallback — and the "not tracked" note is gone. */
    const leave = within(screen.getByRole('region', { name: 'Leave overview' }))
    expect(await leave.findByText('Returning within 14 days')).toBeInTheDocument()
    expect(leave.getByText('Parental leave')).toBeInTheDocument()
    expect(leave.getByText('Protected')).toBeInTheDocument()
    expect(leave.queryByText('Vacation')).not.toBeInTheDocument()
    expect(
      leave.queryByText('Leave types and return dates aren’t tracked in this workspace yet.'),
    ).not.toBeInTheDocument()

    /* F · Turnover: 1 termination in the trailing year over 4 active →
       25.0%; the missing-prerequisite note is gone. */
    const trend = within(screen.getByRole('region', { name: 'Headcount & turnover' }))
    expect(await trend.findByText('25.0%')).toBeInTheDocument()
    expect(trend.getByText('Turnover (rolling 12 months)')).toBeInTheDocument()
    expect(
      trend.queryByText('Turnover needs termination history, which isn’t tracked yet.'),
    ).not.toBeInTheDocument()
  })

  it('shows the build-it-up empty state when the workspace has no records', async () => {
    mockProductionClient({})
    const { renderApp: renderAppFresh } = await import('@/test/renderApp')
    const { AnalyticsView: AnalyticsViewFresh } = await import('./AnalyticsView')

    renderAppFresh(<AnalyticsViewFresh />, { route: '/app/analytics', path: '/app/analytics' })

    expect(await screen.findByText('Nothing to report yet')).toBeInTheDocument()
    expect(screen.getByText(/Analytics builds itself from your real workspace/)).toBeInTheDocument()
  })
})
