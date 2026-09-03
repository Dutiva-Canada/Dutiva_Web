import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import { renderApp } from '@/test/renderApp'
import { listChain } from '@/test/productionWorkspace'
import { AnalyticsView } from './AnalyticsView'

describe('AnalyticsView (demo)', () => {
  afterEach(() => {
    localStorage.removeItem('dutiva-lang')
  })

  function scoreCard() {
    return within(screen.getByRole('region', { name: 'Compliance score' }))
  }

  it('renders the compliance score hero with its delta and windowed trend data', () => {
    renderApp(<AnalyticsView />, { route: '/app/analytics' })

    expect(screen.getByText('Workforce and compliance overview.')).toBeInTheDocument()

    const card = scoreCard()
    /* Hero 82/100, up 8 from February (74 → 82 across the six fixtures).
       Selector-scoped: the chart's table twin also carries an 82 cell. */
    expect(card.getByText('82', { selector: 'span' })).toBeInTheDocument()
    expect(card.getByText('/100')).toBeInTheDocument()
    expect(card.getByText('+8 vs February')).toBeInTheDocument()

    /* The chart's table twin carries every month/value pair. */
    const table = card.getByRole('table')
    expect(within(table).getByText('February')).toBeInTheDocument()
    expect(within(table).getByText('74')).toBeInTheDocument()
    expect(within(table).getByText('July')).toBeInTheDocument()

    /* Windowed axis is summarized to AT via the chart's aria-label. */
    expect(card.getByRole('img', { name: /Compliance score by month/ })).toBeInTheDocument()
  })

  it('breaks the score down by category and flags the lowest', () => {
    renderApp(<AnalyticsView />, { route: '/app/analytics' })
    const card = scoreCard()

    expect(card.getByText('Score breakdown')).toBeInTheDocument()
    expect(card.getByText('Termination & notice')).toBeInTheDocument()
    expect(card.getByText('61')).toBeInTheDocument()
    expect(card.getByText('Language & jurisdiction')).toBeInTheDocument()
    /* Exactly one category (the 61) wears the flag. */
    expect(card.getAllByText('Lowest')).toHaveLength(1)
  })

  it('lists needs-attention items sorted overdue → soonest, with cert/document escalations', () => {
    renderApp(<AnalyticsView />, { route: '/app/analytics' })
    const card = within(screen.getByRole('region', { name: 'Needs attention' }))

    const rows = card.getAllByRole('listitem')
    expect(rows).toHaveLength(5)

    /* Most overdue first: Devon's lapsed forklift ticket (Jun 28) leads,
       escalated from the certifications card and linking to his profile. */
    expect(
      within(rows[0]!).getByText(/Forklift operator certificate — Devon Clarke/),
    ).toBeInTheDocument()
    expect(within(rows[0]!).getByText('Overdue')).toBeInTheDocument()
    expect(within(rows[0]!).getByRole('link')).toHaveAttribute('href', '/app/employees/e5')

    /* Then the CASL consent audit (was due Jun 30). */
    expect(within(rows[1]!).getByText(/Marketing consent records/)).toBeInTheDocument()
    expect(within(rows[1]!).getByText('Overdue')).toBeInTheDocument()

    /* Soonest due: the Remote Work Policy review (Jul 17 — 6 days out). */
    expect(within(rows[2]!).getByText(/Remote Work Policy/)).toBeInTheDocument()
    expect(within(rows[2]!).getByText('Due in 6 days')).toBeInTheDocument()

    /* Affected count + jurisdiction as the secondary line (AODA hires). */
    expect(card.getByText('3 employees · Ontario')).toBeInTheDocument()

    /* Chen's work permit (Jul 28, inside 30 days) is always escalated —
       an expiring work permit is a compliance event. */
    expect(within(rows[4]!).getByText(/Work permit — Chen Wei/)).toBeInTheDocument()
    expect(within(rows[4]!).getByRole('link')).toHaveAttribute('href', '/app/employees/e8')

    /* Eight qualifying items; the cap cuts the rest (francization review
       among them). */
    expect(card.getByRole('link', { name: 'View all (8)' })).toHaveAttribute(
      'href',
      '/app/compliance',
    )
    expect(card.queryByText(/French-language workplace/)).not.toBeInTheDocument()
  })

  it('flags jurisdictions sitting 10+ points under the blended score', () => {
    renderApp(<AnalyticsView />, { route: '/app/analytics' })
    const card = scoreCard()

    expect(card.getByText('Score by jurisdiction')).toBeInTheDocument()
    /* QC is 71 vs the blended 82 — flagged; Federal at 75 (−7) is not. */
    expect(card.getByText('71')).toBeInTheDocument()
    expect(card.getByText('−11 below overall')).toBeInTheDocument()
    expect(card.queryByText('−7 below overall')).not.toBeInTheDocument()
  })

  it('buckets certifications 1/2/3/1 and reveals the list in one tap', async () => {
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    renderApp(<AnalyticsView />, { route: '/app/analytics' })
    const card = within(screen.getByRole('region', { name: 'Certifications & training' }))

    /* Tile row: Expired 1 · ≤30 2 · 31–60 3 · 61–90 1. */
    expect(card.getByText('Expired')).toBeInTheDocument()
    expect(card.getByText('≤ 30 days')).toBeInTheDocument()

    await user.click(card.getByRole('button', { name: 'Show list (7)' }))
    const rows = card.getAllByRole('listitem')
    expect(rows).toHaveLength(7)
    /* Soonest first: the expired forklift ticket leads with its chip. */
    expect(within(rows[0]!).getByText('Forklift operator certificate')).toBeInTheDocument()
    expect(within(rows[0]!).getByText('Devon Clarke · Ontario')).toBeInTheDocument()
    expect(within(rows[1]!).getByText('First Aid / CPR-C')).toBeInTheDocument()
    expect(within(rows[1]!).getByText('Noah Bergeron · Manitoba')).toBeInTheDocument()
  })

  it('lists service milestones within 30 days and flags the missing review task', () => {
    renderApp(<AnalyticsView />, { route: '/app/analytics' })
    const card = within(screen.getByRole('region', { name: 'Service milestones due' }))

    const rows = card.getAllByRole('listitem')
    expect(rows).toHaveLength(2)

    /* Soonest first: Jasleen (Jul 21 — 10 days out), no review task yet. */
    expect(within(rows[0]!).getByText('Jasleen Kaur')).toBeInTheDocument()
    expect(within(rows[0]!).getByText('10 days left')).toBeInTheDocument()
    expect(within(rows[0]!).getByText('No review task yet')).toBeInTheDocument()

    /* Owen next (Jul 29 — 18 days out), review task in place. */
    expect(within(rows[1]!).getByText('Owen Tremblay')).toBeInTheDocument()
    expect(within(rows[1]!).getByText('18 days left')).toBeInTheDocument()
    expect(card.getAllByText('No review task yet')).toHaveLength(1)
  })

  it('shows the leave overview grouped by imminent returns, protected leave marked', () => {
    renderApp(<AnalyticsView />, { route: '/app/analytics' })
    const card = within(screen.getByRole('region', { name: 'Leave overview' }))

    expect(card.getByText('Returning within 14 days')).toBeInTheDocument()
    expect(card.getByText('Rosa Almeida')).toBeInTheDocument()

    expect(card.getByText('On leave now')).toBeInTheDocument()
    expect(card.getByText('Ingrid Halvorsen')).toBeInTheDocument()

    /* Parental and medical leave are statutorily protected. */
    expect(card.getAllByText('Protected')).toHaveLength(2)
  })

  it('renders the headcount trend with the improving turnover tile', () => {
    renderApp(<AnalyticsView />, { route: '/app/analytics' })
    const card = within(screen.getByRole('region', { name: 'Headcount & turnover' }))

    expect(card.getByText('9.8%')).toBeInTheDocument()
    expect(card.getByText('Turnover (rolling 12 months)')).toBeInTheDocument()
    /* Falling turnover is good — the delta reads −1.4 pts vs June. */
    expect(card.getByText('−1.4 pts vs June')).toBeInTheDocument()

    const table = card.getByRole('table')
    expect(within(table).getByText('February')).toBeInTheDocument()
    expect(within(table).getByText('76')).toBeInTheDocument()
  })

  it('renders headcount by jurisdiction with the total and the Federal footnote', () => {
    renderApp(<AnalyticsView />, { route: '/app/analytics' })
    const card = within(screen.getByRole('region', { name: 'Headcount by jurisdiction' }))

    expect(card.getByText('82 employees total')).toBeInTheDocument()
    expect(
      card.getByText('Federal = federally regulated roles under the Canada Labour Code.'),
    ).toBeInTheDocument()

    /* Table twin: every jurisdiction with its exact value. */
    const table = card.getByRole('table')
    for (const [jur, value] of [
      ['ON', '34'],
      ['BC', '21'],
      ['QC', '12'],
      ['AB', '9'],
      ['Federal', '6'],
    ]) {
      const rowCell = within(table).getByText(jur!)
      expect(within(rowCell.closest('tr')!).getByText(value!)).toBeInTheDocument()
    }
  })

  it('shows open-case aging tiles and rows that tap through to the case', () => {
    renderApp(<AnalyticsView />, { route: '/app/analytics' })
    const card = within(screen.getByRole('region', { name: 'Open cases' }))

    /* Three open (case4 resolved); ages 9/21/151 days on July 11 → avg 60. */
    expect(card.getByText('Open now')).toBeInTheDocument()
    expect(card.getByText('3')).toBeInTheDocument()
    expect(card.getByText('Avg. age (days)')).toBeInTheDocument()
    expect(card.getByText('60')).toBeInTheDocument()
    expect(card.getByText('Oldest (days)')).toBeInTheDocument()
    expect(card.getByText('151')).toBeInTheDocument()

    /* Oldest first, linking through to the case record. */
    const rows = card.getAllByRole('listitem')
    expect(within(rows[0]!).getByRole('link')).toHaveAttribute('href', '/app/cases/case3')
    expect(within(rows[0]!).getByText('151 days')).toBeInTheDocument()
    expect(within(rows[2]!).getByRole('link')).toHaveAttribute('href', '/app/cases/case1')
  })

  it('shows the acknowledgment meter with the outstanding-signature action', () => {
    renderApp(<AnalyticsView />, { route: '/app/analytics' })
    const card = within(screen.getByRole('region', { name: 'Policy acknowledgments' }))

    expect(card.getByText('Code of Conduct — annual attestation')).toBeInTheDocument()
    expect(card.getByText('74 / 82 signed')).toBeInTheDocument()
    expect(card.getByText('90%')).toBeInTheDocument()
    /* The suggested action links into the Communications program. */
    expect(
      card.getByRole('link', {
        name: 'Send a reminder to the 8 employees with outstanding signatures.',
      }),
    ).toHaveAttribute('href', '/app/communications')
  })

  it('renders the French strings when the language preference is fr', () => {
    localStorage.setItem('dutiva-lang', 'fr')
    renderApp(<AnalyticsView />, { route: '/app/analytics' })

    expect(screen.getByText('Aperçu de l’effectif et de la conformité.')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Score de conformité' })).toBeInTheDocument()
    expect(screen.getByText('+8 c. février')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Attention requise' })).toBeInTheDocument()
    /* Two overdue rows now (lapsed certification + CASL audit). */
    expect(screen.getAllByText('En retard')).toHaveLength(2)
    expect(screen.getByRole('region', { name: 'Effectif par juridiction' })).toBeInTheDocument()
    expect(screen.getByText('82 employés au total')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Dossiers ouverts' })).toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: 'Accusés de réception des politiques' }),
    ).toBeInTheDocument()
    expect(screen.getByText('74 / 82 signés')).toBeInTheDocument()

    /* Phase 2 cards, localized. */
    expect(screen.getByRole('region', { name: 'Attestations et formations' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Jalons de service à venir' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Expirations de documents' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Aperçu des congés' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Effectif et roulement' })).toBeInTheDocument()
    expect(screen.getByText('9,8 %')).toBeInTheDocument()
    expect(screen.getByText('Score par juridiction')).toBeInTheDocument()
  })
})

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
