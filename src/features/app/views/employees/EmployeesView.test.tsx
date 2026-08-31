import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, screen } from '@testing-library/react'
import { renderApp } from '@/test/renderApp'
import { listChain } from '@/test/productionWorkspace'
import { ADVISOR_STREAM_TICK_MS, ADVISOR_THINK_MS } from '@/features/app/advisor/useAdvisorEngine'
import { AdvisorRail } from '@/features/app/rail/AdvisorRail'
import { EmployeesView } from './EmployeesView'

function renderEmployees() {
  return renderApp(
    <>
      <EmployeesView />
      <AdvisorRail />
    </>,
    { route: '/app/employees', path: '/app/employees' },
  )
}

describe('EmployeesView', () => {
  it('renders the roster with fixture rows, status chips, and the sample count', () => {
    renderEmployees()

    /* Desktop table + phone cards are both in the DOM (CSS-responsive). */
    expect(screen.getAllByText('Jordan Mensah').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Senior Operations Manager').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Offboarding').length).toBeGreaterThan(0)
    expect(screen.getAllByText('On PIP').length).toBeGreaterThan(0)
    expect(screen.getByText(/Showing 12 of 82 · sample records/)).toBeInTheDocument()
  })

  it('filters by name/role/jurisdiction and clears via the empty state', () => {
    renderEmployees()
    const input = screen.getByPlaceholderText('Filter by name, role, or jurisdiction…')

    fireEvent.change(input, { target: { value: 'quebec' } })
    expect(screen.getByText(/Showing 2 of 82/)).toBeInTheDocument()
    expect(screen.getAllByText('Marc-Étienne Roy').length).toBeGreaterThan(0)
    expect(screen.queryByText('Jordan Mensah')).not.toBeInTheDocument()

    fireEvent.change(input, { target: { value: 'zzz-no-match' } })
    expect(screen.getByText('No employees match your filter.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Clear filter' }))
    expect(screen.getByText(/Showing 12 of 82/)).toBeInTheDocument()
  })

  it('switches to the org chart with stats and the reporting-line watch note', () => {
    renderEmployees()
    fireEvent.click(screen.getByRole('tab', { name: 'Org chart' }))

    expect(screen.getByText('People managers')).toBeInTheDocument()
    expect(screen.getByText('Direct reports')).toBeInTheDocument()
    /* Workspace root + the offboarding transition note (Jordan, 4 reports). */
    expect(screen.getByText('Riley Summers')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Jordan Mensah is being offboarded — their 4 direct reports in Operations will need a reporting line before the departure date.',
      ),
    ).toBeInTheDocument()
    /* Roster chrome is gone in org mode. */
    expect(
      screen.queryByPlaceholderText('Filter by name, role, or jurisdiction…'),
    ).not.toBeInTheDocument()
  })

  describe('Ask Advisor', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    it('opens the rail on the employee with their insight and risk card', () => {
      renderEmployees()
      const firstAsk = screen.getAllByRole('button', {
        name: 'Ask Advisor about this employee',
      })[0]
      if (!firstAsk) throw new Error('missing Ask Advisor button')
      act(() => {
        fireEvent.click(firstAsk)
      })

      const dialog = screen.getByRole('dialog', { name: 'Ask Advisor' })
      expect(dialog).toBeInTheDocument()

      /* Complete the streamed intro turn. */
      act(() => {
        vi.advanceTimersByTime(ADVISOR_THINK_MS + 200 * ADVISOR_STREAM_TICK_MS)
      })
      expect(screen.getByText(/Jordan's termination is in progress/)).toBeInTheDocument()
      expect(screen.getByText('Notice exposure risk')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Open full case' })).toBeInTheDocument()
    })
  })
})

describe('EmployeesView in production mode', () => {
  afterEach(() => {
    vi.doUnmock('@/lib/supabaseClient')
    vi.resetModules()
  })

  /** Admin signed in, production stored, one org, real employees table. */
  function mockProductionClient(initialRows: Record<string, unknown>[]) {
    const employeeRows = [...initialRows]
    const insert = vi.fn((row: Record<string, unknown>) => ({
      select: () => ({
        single: () => {
          const created = {
            id: `emp-${employeeRows.length + 1}`,
            name: row.name,
            title: row.title ?? null,
            email: row.email ?? null,
            jurisdiction: row.jurisdiction,
            start_date: row.start_date ?? null,
            status: 'active',
          }
          employeeRows.push(created)
          return Promise.resolve({ data: created, error: null })
        },
      }),
    }))

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
          if (table === 'employees') {
            return {
              select: () => ({
                eq: () => ({
                  order: () => listChain(employeeRows),
                }),
              }),
              insert,
            }
          }
          throw new Error(`unexpected table: ${table}`)
        }),
      },
    }))
    vi.resetModules()
    return { insert }
  }

  it('renders the real roster from the backend instead of the Northgate fixtures', async () => {
    mockProductionClient([
      {
        id: 'emp-1',
        name: 'Ana Souza',
        title: 'Coordinator',
        email: null,
        jurisdiction: 'Ontario',
        start_date: null,
        status: 'active',
      },
    ])
    const { renderApp: renderAppFresh } = await import('@/test/renderApp')
    const { EmployeesView: EmployeesViewFresh } = await import('./EmployeesView')

    renderAppFresh(<EmployeesViewFresh />, { route: '/app/employees', path: '/app/employees' })

    expect(await screen.findByText('Ana Souza')).toBeInTheDocument()
    expect(screen.getByText('1 employee')).toBeInTheDocument()
    expect(screen.queryByText('Jordan Mensah')).not.toBeInTheDocument()
    expect(screen.queryByText(/sample records/)).not.toBeInTheDocument()
  })

  it('adds an employee through the real insert path', async () => {
    const { insert } = mockProductionClient([])
    const { renderApp: renderAppFresh } = await import('@/test/renderApp')
    const { EmployeesView: EmployeesViewFresh } = await import('./EmployeesView')

    renderAppFresh(<EmployeesViewFresh />, { route: '/app/employees', path: '/app/employees' })

    expect(await screen.findByText('No employees yet')).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button', { name: 'Add employee' })[0]!)
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Ana Souza' } })
    fireEvent.change(screen.getByLabelText('Job title'), { target: { value: 'Coordinator' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save employee' }))

    expect(await screen.findByText('Ana Souza')).toBeInTheDocument()
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ organization_id: 'org-1', name: 'Ana Souza' }),
    )
    expect(screen.getByText('1 employee')).toBeInTheDocument()
  })
})

describe('EmployeeProfileView in production mode', () => {
  afterEach(() => {
    vi.doUnmock('@/lib/supabaseClient')
    vi.resetModules()
  })

  it('shows the real profile with open cases and appends a note', async () => {
    const EMPLOYEE_ROW = {
      id: 'emp-1',
      name: 'Ana Souza',
      title: 'Coordinator',
      email: 'ana@dutiva.ca',
      jurisdiction: 'Ontario',
      start_date: '2026-07-02',
      status: 'active',
    }
    const CASE_ROW = {
      id: 'case-1',
      title: 'Accommodation — ergonomic assessment',
      case_type: 'Accommodation',
      employee_id: 'emp-1',
      jurisdiction: 'Ontario',
      status: 'open',
      due_date: null,
      created_at: '2026-07-01T12:00:00Z',
    }
    const noteRows: Record<string, unknown>[] = []
    const noteInsert = vi.fn((row: Record<string, unknown>) => ({
      select: () => ({
        single: () => {
          const created = {
            id: `n${noteRows.length + 1}`,
            body: row.body,
            created_at: '2026-07-12T13:00:00Z',
          }
          noteRows.push(created)
          return Promise.resolve({ data: created, error: null })
        },
      }),
    }))

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
          if (table === 'employees') {
            return {
              select: () => ({
                eq: () => ({
                  maybeSingle: () => Promise.resolve({ data: EMPLOYEE_ROW, error: null }),
                  order: () => listChain([EMPLOYEE_ROW]),
                }),
              }),
            }
          }
          if (table === 'hr_cases') {
            return {
              select: () => ({
                eq: () => ({
                  order: () => listChain([CASE_ROW]),
                }),
              }),
            }
          }
          if (table === 'hr_employee_notes') {
            return {
              select: () => ({
                eq: () => ({
                  order: () => listChain([...noteRows]),
                }),
              }),
              insert: noteInsert,
            }
          }
          /* Records sections (expiry records, leaves) and the probation
             review-task check — empty in this scenario. */
          if (
            table === 'hr_expiry_records' ||
            table === 'hr_leaves' ||
            table === 'compliance_tasks'
          ) {
            return {
              select: () => ({
                eq: () => ({
                  order: () => listChain([]),
                }),
              }),
            }
          }
          throw new Error(`unexpected table: ${table}`)
        }),
      },
    }))
    vi.resetModules()

    const { renderApp: renderAppFresh } = await import('@/test/renderApp')
    const { EmployeeProfileView: ProfileFresh } = await import('./EmployeeProfileView')

    renderAppFresh(<ProfileFresh />, {
      route: '/app/employees/emp-1',
      path: '/app/employees/:employeeId',
    })

    /* Real facts header + the employee's open case linking to its detail. */
    expect(await screen.findByText('Ana Souza')).toBeInTheDocument()
    expect(screen.getByText('ana@dutiva.ca')).toBeInTheDocument()
    expect(screen.getByText('2026-07-02')).toBeInTheDocument()
    const caseLink = screen.getByRole('link', { name: /Accommodation — ergonomic assessment/ })
    expect(caseLink).toHaveAttribute('href', '/app/cases/case-1')
    /* Demo profile chrome is gone. */
    expect(screen.queryByText('All people')).not.toBeInTheDocument()

    /* Add a note through the real path. */
    fireEvent.change(screen.getByLabelText('Add a note to this profile…'), {
      target: { value: 'Met for onboarding check-in.' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add note' }))

    expect(await screen.findByText('Met for onboarding check-in.')).toBeInTheDocument()
    expect(noteInsert).toHaveBeenCalledWith({
      organization_id: 'org-1',
      employee_id: 'emp-1',
      body: 'Met for onboarding check-in.',
    })
  })
})

describe('EmployeeProfileProductionView for a non-admin member', () => {
  afterEach(() => {
    vi.doUnmock('@/lib/supabaseClient')
    vi.resetModules()
  })

  it('renders the record read-only: no forms, no remove/end buttons, no date inputs', async () => {
    const EMPLOYEE_ROW = {
      id: 'emp-1',
      name: 'Ana Souza',
      title: 'Coordinator',
      email: 'ana@dutiva.ca',
      jurisdiction: 'Ontario',
      start_date: '2026-07-02',
      status: 'on_leave',
      probation_end_date: '2026-09-30',
      termination_date: null,
    }
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: {
        auth: {
          getSession: () => Promise.resolve({ data: { session: null } }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
        },
        rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
        from: vi.fn((table: string) => {
          if (table === 'employees') {
            return {
              select: () => ({
                eq: () => ({
                  maybeSingle: () => Promise.resolve({ data: EMPLOYEE_ROW, error: null }),
                  order: () => listChain([EMPLOYEE_ROW]),
                }),
              }),
            }
          }
          if (table === 'hr_leaves') {
            return {
              select: () => ({
                eq: () => ({
                  order: () =>
                    Promise.resolve({
                      data: [
                        {
                          id: 'l1',
                          employee_id: 'emp-1',
                          leave_type: 'Parental leave',
                          is_protected: true,
                          start_date: '2026-06-01',
                          expected_return_date: '2026-10-01',
                          ended_on: null,
                          employees: { name: 'Ana Souza' },
                        },
                      ],
                      error: null,
                    }),
                }),
              }),
            }
          }
          /* hr_cases, hr_employee_notes, hr_expiry_records, compliance_tasks */
          return {
            select: () => ({
              eq: () => ({
                order: () => listChain([]),
              }),
            }),
          }
        }),
      },
    }))
    vi.resetModules()

    const { renderApp: renderAppFresh } = await import('@/test/renderApp')
    const { WorkspaceModeContext } =
      await import('@/features/app/workspaceMode/workspaceModeContext')
    const { EmployeeProfileProductionView: ProfileFresh } =
      await import('./EmployeeProfileProductionView')

    renderAppFresh(
      <WorkspaceModeContext.Provider
        value={{
          mode: 'production',
          isAdmin: false,
          identity: {
            companyName: 'Acme Co.',
            user: { name: 'Vic Member', initials: 'VM', role: { en: 'HR', fr: 'RH' }, email: '' },
          },
          companyName: 'Acme Co.',
          organizationId: 'org-1',
          memberRole: 'member',
          isOrgAdmin: false,
          setMode: vi.fn(),
          admissionStatus: 'idle',
          clearAdmissionStatus: vi.fn(),
        }}
      >
        <ProfileFresh />
      </WorkspaceModeContext.Provider>,
      { route: '/app/employees/emp-1', path: '/app/employees/:employeeId' },
    )

    /* The record itself is fully readable… */
    expect(await screen.findByText('Ana Souza')).toBeInTheDocument()
    expect(screen.getByText('Parental leave')).toBeInTheDocument()
    /* …probation end shows as a plain fact, not an input… */
    expect(screen.getByText('2026-09-30')).toBeInTheDocument()
    expect(document.querySelector('input[type="date"]')).toBeNull()
    /* …and every write affordance is gone: status select, add forms,
       remove/end buttons, note box. RLS would refuse them anyway — the UI
       no longer offers writes the database denies. */
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add record' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add leave' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'End leave' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Add a note to this profile…')).not.toBeInTheDocument()
  })
})
