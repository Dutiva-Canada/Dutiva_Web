import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { renderApp } from '@/test/renderApp'
import { listChain } from '@/test/productionWorkspace'
import { CasesView } from './CasesView'
import { CaseDetailView } from './CaseDetailView'
import { resetCreatedCases } from './caseModel'

/** List + detail mounted together so row clicks / case creation can navigate. */
const casesRoutes = (
  <Routes>
    <Route path="/app/cases" element={<CasesView />} />
    <Route path="/app/cases/:caseId" element={<CaseDetailView />} />
  </Routes>
)

describe('CasesView', () => {
  beforeEach(() => {
    resetCreatedCases()
  })

  it('renders the fixture case files with the open count and progress', () => {
    renderApp(casesRoutes, { route: '/app/cases' })

    expect(screen.getByText('3 open of 4 cases')).toBeInTheDocument()
    expect(screen.getByText('Termination — Jordan Mensah')).toBeInTheDocument()
    expect(screen.getByText('Performance — Devon Clarke')).toBeInTheDocument()
    expect(screen.getByText('Accommodation — Amara Okafor')).toBeInTheDocument()
    expect(screen.getByText('Onboarding — Marc-Étienne Roy')).toBeInTheDocument()

    /* Status chips + step progress from the fixtures. */
    expect(screen.getByText('Legal review recommended')).toBeInTheDocument()
    expect(screen.getByText('4/6')).toBeInTheDocument()
    expect(screen.getByText('Resolved')).toBeInTheDocument()
  })

  it('navigates to the case detail when a row is opened', () => {
    renderApp(casesRoutes, { route: '/app/cases' })

    fireEvent.click(screen.getByRole('button', { name: 'Open case Termination — Jordan Mensah' }))

    /* Case detail header + overview content. */
    expect(screen.getByText('Advisor recommendation')).toBeInTheDocument()
    expect(screen.getByText(/Without-cause termination during a restructuring/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ask Advisor' })).toBeInTheDocument()
  })

  it('creates an Intake case through the New case modal and opens it', () => {
    renderApp(casesRoutes, { route: '/app/cases' })

    fireEvent.click(screen.getByRole('button', { name: 'New case' }))
    const dialog = screen.getByRole('dialog', { name: 'New case' })
    expect(dialog).toBeInTheDocument()

    /* Default type (Termination) is a restricted case type → lock note. */
    expect(
      screen.getByText(
        'Restricted case type — access is limited to the case owner, HR lead, and counsel.',
      ),
    ).toBeInTheDocument()

    /* A non-restricted type clears the note and takes the Pending risk path. */
    fireEvent.change(screen.getByLabelText('Case type'), {
      target: { value: 'Workplace conflict' },
    })
    expect(
      screen.queryByText(
        'Restricted case type — access is limited to the case owner, HR lead, and counsel.',
      ),
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Create case' }))

    /* Lands on the created case's detail in the Intake stage. */
    expect(screen.getByText('Workplace conflict — Workplace-wide')).toBeInTheDocument()
    expect(screen.getByText('Intake')).toBeInTheDocument()
    expect(
      screen.getByText(/Intake started — record the key facts and Advisor will assess risk/),
    ).toBeInTheDocument()
    /* Pending risk fallback (non-assessed case type). */
    expect(screen.getByText('Pending')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Not yet assessed — Advisor will assess risk once intake facts are recorded.',
      ),
    ).toBeInTheDocument()
  })
})

describe('CasesView in production mode', () => {
  afterEach(() => {
    vi.doUnmock('@/lib/supabaseClient')
    vi.resetModules()
  })

  /** Admin signed in, production stored, one org, real hr_cases + employees. */
  function mockProductionClient(initialCases: Record<string, unknown>[]) {
    const caseRows = [...initialCases]
    const employeeRows = [
      {
        id: 'emp-1',
        name: 'Ana Souza',
        title: 'Coordinator',
        email: null,
        jurisdiction: 'Ontario',
        start_date: null,
        status: 'active',
      },
    ]
    const insert = vi.fn((row: Record<string, unknown>) => ({
      select: () => ({
        single: () => {
          const created = {
            id: `case-${caseRows.length + 1}`,
            title: row.title,
            case_type: row.case_type,
            employee_id: row.employee_id ?? null,
            jurisdiction: row.jurisdiction,
            status: 'open',
            due_date: row.due_date ?? null,
            created_at: '2026-07-01T12:00:00Z',
          }
          caseRows.unshift(created)
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
          if (table === 'hr_cases') {
            return {
              select: () => ({
                eq: () => ({
                  order: () => listChain(caseRows),
                }),
              }),
              insert,
              update,
            }
          }
          if (table === 'employees') {
            return {
              select: () => ({
                eq: () => ({
                  order: () => listChain(employeeRows),
                }),
              }),
            }
          }
          throw new Error(`unexpected table: ${table}`)
        }),
      },
    }))
    vi.resetModules()
    return { insert, update }
  }

  it('renders real cases with the linked employee name, not the Northgate fixtures', async () => {
    mockProductionClient([
      {
        id: 'case-1',
        title: 'Accommodation — ergonomic assessment',
        case_type: 'Accommodation',
        employee_id: 'emp-1',
        jurisdiction: 'Ontario',
        status: 'open',
        due_date: '2026-08-01',
        created_at: '2026-07-01T12:00:00Z',
      },
    ])
    const { renderApp: renderAppFresh } = await import('@/test/renderApp')
    const { CasesView: CasesViewFresh } = await import('./CasesView')

    renderAppFresh(<CasesViewFresh />, { route: '/app/cases', path: '/app/cases' })

    expect(await screen.findByText('Accommodation — ergonomic assessment')).toBeInTheDocument()
    expect(screen.getByText('1 case')).toBeInTheDocument()
    expect(screen.getByText(/Ana Souza/)).toBeInTheDocument()
    expect(screen.queryByText('Termination — Jordan Mensah')).not.toBeInTheDocument()
  })

  it('creates a case through the real insert path', async () => {
    const { insert } = mockProductionClient([])
    const { renderApp: renderAppFresh } = await import('@/test/renderApp')
    const { CasesView: CasesViewFresh } = await import('./CasesView')

    renderAppFresh(<CasesViewFresh />, { route: '/app/cases', path: '/app/cases' })

    expect(await screen.findByText('No cases yet')).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button', { name: 'New case' })[0]!)
    fireEvent.change(screen.getByLabelText('Case title'), {
      target: { value: 'Onboarding — first hire' },
    })
    fireEvent.change(screen.getByLabelText('Case type'), { target: { value: 'Onboarding' } })
    fireEvent.change(screen.getByLabelText('Employee (optional)'), {
      target: { value: 'emp-1' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create case' }))

    expect(await screen.findByText('Onboarding — first hire')).toBeInTheDocument()
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: 'org-1',
        title: 'Onboarding — first hire',
        case_type: 'Onboarding',
        employee_id: 'emp-1',
      }),
    )
    expect(screen.getByText('1 case')).toBeInTheDocument()
  })

  it('updates a case status through the real update path', async () => {
    const { update } = mockProductionClient([
      {
        id: 'case-1',
        title: 'Accommodation — ergonomic assessment',
        case_type: 'Accommodation',
        employee_id: null,
        jurisdiction: 'Ontario',
        status: 'open',
        due_date: null,
        created_at: '2026-07-01T12:00:00Z',
      },
    ])
    const { renderApp: renderAppFresh } = await import('@/test/renderApp')
    const { CasesView: CasesViewFresh } = await import('./CasesView')

    renderAppFresh(<CasesViewFresh />, { route: '/app/cases', path: '/app/cases' })

    const statusSelect = await screen.findByLabelText(
      'Case status — Accommodation — ergonomic assessment',
    )
    fireEvent.change(statusSelect, { target: { value: 'resolved' } })

    expect(await screen.findByText('Resolved')).toBeInTheDocument()
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ status: 'resolved' }))
  })
})

describe('CaseDetailView in production mode', () => {
  afterEach(() => {
    vi.doUnmock('@/lib/supabaseClient')
    vi.resetModules()
  })

  it('shows the real case record and appends a note through the real insert path', async () => {
    const CASE_ROW = {
      id: 'case-1',
      title: 'Accommodation — ergonomic assessment',
      case_type: 'Accommodation',
      employee_id: null,
      jurisdiction: 'Ontario',
      status: 'open',
      due_date: '2026-08-01',
      created_at: '2026-07-01T12:00:00Z',
    }
    const noteRows: Record<string, unknown>[] = [
      { id: 'n1', body: 'Assessment scheduled with provider.', created_at: '2026-07-10T10:00:00Z' },
    ]
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
          if (table === 'hr_cases') {
            return {
              select: () => ({
                eq: () => ({
                  maybeSingle: () => Promise.resolve({ data: CASE_ROW, error: null }),
                  order: () => listChain([CASE_ROW]),
                }),
              }),
            }
          }
          if (table === 'hr_case_notes') {
            return {
              select: () => ({
                eq: () => ({
                  order: () => listChain([...noteRows]),
                }),
              }),
              insert: noteInsert,
            }
          }
          throw new Error(`unexpected table: ${table}`)
        }),
      },
    }))
    vi.resetModules()

    const { renderApp: renderAppFresh } = await import('@/test/renderApp')
    const { CaseDetailView: CaseDetailViewFresh } = await import('./CaseDetailView')

    renderAppFresh(<CaseDetailViewFresh />, {
      route: '/app/cases/case-1',
      path: '/app/cases/:caseId',
    })

    /* Real facts header + existing note. */
    expect(await screen.findByText('Accommodation — ergonomic assessment')).toBeInTheDocument()
    expect(screen.getByText('2026-08-01')).toBeInTheDocument()
    expect(screen.getByText('Assessment scheduled with provider.')).toBeInTheDocument()
    /* Demo fixture detail is gone. */
    expect(screen.queryByText('Advisor recommendation')).not.toBeInTheDocument()

    /* Add a note through the real path. */
    fireEvent.change(screen.getByLabelText('Add a note to the case record…'), {
      target: { value: 'Provider confirmed for next week.' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add note' }))

    expect(await screen.findByText('Provider confirmed for next week.')).toBeInTheDocument()
    expect(noteInsert).toHaveBeenCalledWith({
      organization_id: 'org-1',
      case_id: 'case-1',
      body: 'Provider confirmed for next week.',
    })
  })
})
