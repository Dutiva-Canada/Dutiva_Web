import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, within } from '@testing-library/react'
import { renderApp } from '@/test/renderApp'
import { listChain } from '@/test/productionWorkspace'
import { AdvisorRail } from '@/features/app/rail/AdvisorRail'
import { CalendarView } from './CalendarView'

function renderCalendar() {
  return renderApp(
    <>
      <CalendarView />
      <AdvisorRail />
    </>,
    { route: '/app/calendar' },
  )
}

describe('CalendarView', () => {
  it('renders the month header, weekday labels, today cell, and event chips', () => {
    renderCalendar()

    expect(screen.getByText('July 2026')).toBeInTheDocument()
    for (const d of ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']) {
      expect(screen.getByText(d)).toBeInTheDocument()
    }

    /* July 2026 starts on a Wednesday and has 31 days. */
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('31')).toBeInTheDocument()

    /* Fixture events appear as a grid chip and again in the Upcoming list. */
    expect(screen.getAllByText('3-month service milestone — Priya Nair')).toHaveLength(2)
    expect(screen.getAllByText('Law 25 PIA due — HRIS vendor')).toHaveLength(2)

    /* Upcoming list: heading + date chips. */
    expect(screen.getByText('Upcoming')).toBeInTheDocument()
    expect(screen.getAllByText('Jul 25').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Jul 31')).toBeInTheDocument()
  })

  it('opens the Advisor rail with the event detail when an event is clicked', () => {
    renderCalendar()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    const [gridChip] = screen.getAllByRole('button', {
      name: 'Counsel response due — Termination case',
    })
    expect(gridChip).toBeDefined()
    fireEvent.click(gridChip!)

    const dialog = screen.getByRole('dialog', { name: 'Ask Advisor' })
    expect(within(dialog).getByText('Counsel response due — Termination case')).toBeInTheDocument()
  })
})

describe('CalendarView in production mode', () => {
  afterEach(() => {
    vi.doUnmock('@/lib/supabaseClient')
    vi.resetModules()
  })

  it('places real case/task due dates on the grid and navigates months', async () => {
    const todayIso = new Date().toISOString().slice(0, 10)

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
          if (table === 'hr_cases') {
            return {
              select: () => ({
                eq: () => ({
                  order: () =>
                    Promise.resolve({
                      data: [
                        {
                          id: 'c1',
                          title: 'Accommodation review',
                          case_type: 'Accommodation',
                          employee_id: null,
                          jurisdiction: 'Ontario',
                          status: 'open',
                          due_date: todayIso,
                          created_at: `${todayIso}T12:00:00Z`,
                        },
                      ],
                      error: null,
                    }),
                }),
              }),
            }
          }
          if (table === 'compliance_tasks') {
            return {
              select: () => ({
                eq: () => ({
                  order: () =>
                    listChain([
                      {
                        id: 't1',
                        title: 'File ROE',
                        priority: 'high',
                        status: 'open',
                        category: 'general',
                        due_at: `${todayIso}T00:00:00Z`,
                      },
                    ]),
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
    const { CalendarView: CalendarViewFresh } = await import('./CalendarView')

    renderAppFresh(<CalendarViewFresh />, { route: '/app/calendar', path: '/app/calendar' })

    /* Both deadlines land on today in the current month (grid chip + list row). */
    expect(await screen.findByText('Due dates from your open cases and tasks.')).toBeInTheDocument()
    expect(screen.getAllByText('Accommodation review').length).toBeGreaterThan(0)
    expect(screen.getAllByText('File ROE').length).toBeGreaterThan(0)
    /* Demo fixture events are gone. */
    expect(screen.queryByText('Counsel response due — Jordan Mensah')).not.toBeInTheDocument()

    /* Next month has no deadlines. */
    fireEvent.click(screen.getByRole('button', { name: 'Next month' }))
    expect(await screen.findByText('No deadlines this month.')).toBeInTheDocument()
    expect(screen.queryByText('Accommodation review')).not.toBeInTheDocument()

    /* Back to the current month restores the rows. */
    fireEvent.click(screen.getByRole('button', { name: 'Previous month' }))
    expect((await screen.findAllByText('File ROE')).length).toBeGreaterThan(0)
  })
})
