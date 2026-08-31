import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { useLocation } from 'react-router-dom'
import { renderApp } from '@/test/renderApp'
import { listChain } from '@/test/productionWorkspace'
import { AdvisorRail } from '@/features/app/rail/AdvisorRail'
import { HomeView } from './HomeView'
import { HomeCompliancePanel } from './HomeCompliancePanel'
import { homePriorities } from './homeData'

/** Echoes the current pathname so navigations triggered by the view are observable. */
function LocationProbe() {
  const location = useLocation()
  return <div data-testid="pathname">{location.pathname}</div>
}

describe('HomeView', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the daily brief, fixture-derived metric chips and the priority queue', () => {
    renderApp(<HomeView />, { route: '/app/home' })

    /* Header + Advisor's daily brief hero. */
    expect(screen.getByText('Good to see you, Riley.')).toBeInTheDocument()
    expect(screen.getByText('Advisor’s daily brief')).toBeInTheDocument()
    expect(screen.getByText(/Jordan Mensah’s termination is your top exposure/)).toBeInTheDocument()

    /* Metric chips — counts derive from the @/data fixtures (3 open cases, 5 open tasks). */
    const casesChip = screen.getByRole('button', { name: /Open cases/ })
    expect(casesChip).toHaveTextContent('3')
    expect(casesChip).toHaveTextContent('1 legal review required')
    expect(screen.getByText('of 5 open')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Support signals/ })).toHaveTextContent('1')

    /* Priority queue — Act now / This week / Watching, in severity order. */
    expect(screen.getByText('Jordan Mensah — counsel response outstanding')).toBeInTheDocument()
    expect(screen.getByText('Remote Work Policy overdue by 14 months')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Amara Okafor — accommodation review due Jul 14' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Grace Osei — wellbeing trending down' }),
    ).toBeInTheDocument()

    /* Compliance prediction card + workflows. */
    expect(screen.getByText('in 90 days')).toBeInTheDocument()
    expect(screen.getByText('Top lever')).toBeInTheDocument()
    expect(screen.getAllByText('Workflows in flight').length).toBeGreaterThan(0)
  })

  it('navigates to the case detail when an Act now priority action is clicked', () => {
    renderApp(
      <>
        <HomeView />
        <LocationProbe />
      </>,
      { route: '/app/home' },
    )

    /* pr1 — "Open case" → /app/cases/case1 (prototype openCase('case1')). */
    fireEvent.click(screen.getByRole('button', { name: 'Open case' }))
    expect(screen.getByTestId('pathname')).toHaveTextContent('/app/cases/case1')
  })

  it('opens the supportive wellbeing rail from the Watching row', () => {
    vi.useFakeTimers()
    const view = renderApp(
      <>
        <HomeView />
        <AdvisorRail />
      </>,
      { route: '/app/home' },
    )

    fireEvent.click(screen.getByRole('button', { name: 'Grace Osei — wellbeing trending down' }))

    /* Rail opens on the employee subject (prototype askAboutWellbeing). */
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Grace Osei — wellbeing')).toBeInTheDocument()
    expect(screen.getByText('Alberta')).toBeInTheDocument()

    view.unmount()
  })
})

describe('HomeCompliancePanel', () => {
  it('drafts the same canonical Remote Work Policy template as the Act now lever (T10)', () => {
    const onAction = vi.fn()
    renderApp(<HomeCompliancePanel onAction={onAction} />)

    fireEvent.click(screen.getByRole('button', { name: 'Draft refresh' }))

    /* The compliance "Top lever" and the Act now "Draft refresh" (pr2) are the
       same action, so they must open the same doclib template — not the legacy
       'Remote Work Policy' flat fixture, which resolves to a different doc. */
    const leverAction = homePriorities.find((p) => p.id === 'pr2')?.action
    const leverKey = leverAction && leverAction.kind === 'doc' ? leverAction.templateKey : null
    expect(leverKey).toBe('T10')
    expect(onAction).toHaveBeenCalledWith({ kind: 'doc', templateKey: leverKey })
  })
})

describe('HomeView in production mode', () => {
  afterEach(() => {
    vi.doUnmock('@/lib/supabaseClient')
    vi.resetModules()
  })

  it('renders the real empty state instead of the Northgate fixtures', async () => {
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
          if (fn === 'create_organization')
            return Promise.resolve({ data: { id: 'org-1' }, error: null })
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
        }),
      },
    }))
    vi.resetModules()

    const { renderApp: renderAppFresh } = await import('@/test/renderApp')
    const { HomeView: HomeViewFresh } = await import('./HomeView')

    renderAppFresh(<HomeViewFresh />, { route: '/app/home' })

    expect(await screen.findByText('Your workspace is ready.')).toBeInTheDocument()
    expect(screen.getByText(/Dutiva Canada Inc\./)).toBeInTheDocument()
    expect(screen.getByText('Three useful first steps')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Add a person/ })).toHaveAttribute(
      'href',
      '/app/employees?new=1',
    )
    expect(screen.queryByText('Good to see you, Riley.')).not.toBeInTheDocument()
    expect(screen.queryByText(/Switch back to Demo/)).not.toBeInTheDocument()
  })
})

describe('HomeView production command centre', () => {
  afterEach(() => {
    vi.doUnmock('@/lib/supabaseClient')
    vi.resetModules()
  })

  it('renders live stats, due-soon items and the policy attention row from real data', async () => {
    const tables: Record<string, Record<string, unknown>[]> = {
      employees: [
        {
          id: 'e1',
          name: 'Ana Souza',
          title: null,
          email: null,
          province: 'Ontario',
          start_date: null,
          status: 'active',
        },
      ],
      hr_cases: [
        {
          id: 'c1',
          title: 'Accommodation — ergonomic assessment',
          case_type: 'Accommodation',
          employee_id: 'e1',
          province: 'Ontario',
          status: 'open',
          due_date: '2020-01-01',
          created_at: '2020-01-01T12:00:00Z',
        },
      ],
      compliance_tasks: [
        {
          id: 't1',
          title: 'File ROE',
          priority: 'high',
          status: 'open',
          category: 'general',
          due_at: '2099-01-01T00:00:00Z',
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
      hr_policies: [
        { id: 'p1', name: 'Vacation Policy', status: 'needs_review', last_reviewed: null },
      ],
    }

    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: {
        auth: {
          getSession: () =>
            Promise.resolve({
              data: { session: { user: { id: 'u1', email: 'martin.constantineau@dutiva.ca' } } },
            }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
        },
        rpc: vi.fn((fn: string) =>
          Promise.resolve(
            fn === 'is_admin_user' ? { data: true, error: null } : { data: null, error: null },
          ),
        ),
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
                    limit: () => ({
                      maybeSingle: () =>
                        Promise.resolve({ data: { organization_id: 'org-1' }, error: null }),
                    }),
                  }),
                }),
              }),
            }
          }
          return {
            select: () => ({
              eq: () => ({
                order: () => listChain(tables[table] ?? []),
              }),
            }),
          }
        }),
      },
    }))
    vi.resetModules()

    const { renderApp: renderAppFresh } = await import('@/test/renderApp')
    const { HomeView: HomeViewFresh } = await import('./HomeView')

    renderAppFresh(<HomeViewFresh />, { route: '/app/home' })

    expect(await screen.findByText('Welcome back.')).toBeInTheDocument()
    expect(screen.getByText('Dutiva Canada Inc.')).toBeInTheDocument()

    /* Stat tiles deep-link to their modules. */
    expect(screen.getByRole('link', { name: /1 Employees/ })).toHaveAttribute(
      'href',
      '/app/employees',
    )
    expect(screen.getByRole('link', { name: /1 Open cases/ })).toHaveAttribute('href', '/app/cases')

    /* Due soon: the 2020 case is overdue, the 2099 task is not. */
    expect(screen.getByText('Due soon')).toBeInTheDocument()
    expect(screen.getByText('Overdue')).toBeInTheDocument()
    expect(screen.getByText('Accommodation — ergonomic assessment')).toBeInTheDocument()
    expect(screen.getByText('File ROE')).toBeInTheDocument()
    expect(screen.getByText('Task')).toBeInTheDocument()

    /* Policy attention row. */
    expect(screen.getByText(/policy needs attention/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Open policies/ })).toHaveAttribute(
      'href',
      '/app/policies',
    )

    /* No welcome state, no Northgate fixtures. */
    expect(screen.queryByText('Your workspace is ready.')).not.toBeInTheDocument()
    expect(screen.queryByText('Good to see you, Riley.')).not.toBeInTheDocument()
  })
})
