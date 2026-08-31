import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { useLocation } from 'react-router-dom'
import { renderApp } from '@/test/renderApp'
import { ADVISOR_STREAM_TICK_MS, ADVISOR_THINK_MS } from '@/features/app/advisor/useAdvisorEngine'
import { AdvisorRail } from '@/features/app/rail/AdvisorRail'
import { mockProductionWorkspace, listChain } from '@/test/productionWorkspace'
import { CompensationView } from './CompensationView'

function LocationProbe() {
  const location = useLocation()
  const state = location.state as { tab?: string } | null
  return (
    <div data-testid="location">
      {location.pathname}
      {state?.tab ? `#${state.tab}` : ''}
    </div>
  )
}

function renderView() {
  return renderApp(
    <>
      <CompensationView />
      <AdvisorRail />
      <LocationProbe />
    </>,
    { route: '/app/compensation' },
  )
}

describe('CompensationView', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the banner, payroll stats, changes pipeline, and the overview table', () => {
    renderView()

    expect(screen.getByText(/Restricted module — visible to Owner\/Admin/)).toBeInTheDocument()

    /* Stat tiles: $411K total base payroll · 2 below midpoint · 12 people. */
    expect(screen.getByText('$411K')).toBeInTheDocument()
    expect(screen.getByText('Annual base payroll')).toBeInTheDocument()
    expect(screen.getByText('Below market midpoint')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()

    /* Changes & approvals pipeline (compChanges fixtures). */
    expect(screen.getByText('Merit increase — Devon Clarke')).toBeInTheDocument()
    expect(screen.getByText('Market adjustment — Théo Lavoie')).toBeInTheDocument()
    expect(screen.getByText('Awaiting HR + Finance approval')).toBeInTheDocument()

    /* Pay-band equity advisory card. */
    expect(
      screen.getByText('Potential compensation positioning issue — review recommended'),
    ).toBeInTheDocument()

    /* Overview rows (rendered for both the mobile list and the table). */
    expect(screen.getAllByText('Jordan Mensah').length).toBeGreaterThan(0)
    expect(screen.getAllByText('$118,000').length).toBeGreaterThan(0)
    /* Théo Lavoie sits 10% below the market midpoint. */
    expect(screen.getAllByText('-10%').length).toBeGreaterThan(0)
  })

  it('opens the change-review rail with status, note, and market-review citation', () => {
    vi.useFakeTimers()
    renderView()

    act(() => {
      const review = screen.getAllByRole('button', { name: 'Review with Advisor' })[0]
      expect(review).toBeDefined()
      fireEvent.click(review as HTMLElement)
    })

    expect(screen.getByRole('dialog', { name: 'Ask Advisor' })).toBeInTheDocument()
    expect(screen.getAllByText('Merit increase — Devon Clarke')).toHaveLength(2)

    act(() => {
      vi.advanceTimersByTime(ADVISOR_THINK_MS + 120 * ADVISOR_STREAM_TICK_MS)
    })
    expect(
      screen.getByText(
        /Requires HR\/Finance approval before the Aug 25 payroll cut-off\. HR\/Finance review is recommended before any change is approved\./,
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Internal compensation band framework')).toBeInTheDocument()
  })

  it('navigates to the employee compensation tab when a row is opened', () => {
    renderView()

    const row = screen.getAllByRole('button', { name: 'Open compensation for Jordan Mensah' })[0]
    expect(row).toBeDefined()
    fireEvent.click(row as HTMLElement)

    expect(screen.getByTestId('location')).toHaveTextContent('/app/employees/e1#compensation')
  })
})

describe('CompensationView in production mode', () => {
  afterEach(() => {
    vi.doUnmock('@/lib/supabaseClient')
    vi.resetModules()
  })

  const RECORD = {
    id: 'rec-1',
    employee_id: 'emp-1',
    base_salary: '82000.00',
    band: 'B3',
    band_midpoint: '90000.00',
    effective_date: '2026-01-01',
    note: null,
    employees: { name: 'Dana Okonjo' },
  }

  function mockComp(records: Record<string, unknown>[], roster: Record<string, unknown>[]) {
    const rows = [...records]
    const insert = vi.fn((row: Record<string, unknown>) => ({
      select: () => ({
        single: () => {
          const created = {
            id: `rec-${rows.length + 1}`,
            employee_id: row.employee_id,
            base_salary: String(row.base_salary),
            band: row.band ?? null,
            band_midpoint: row.band_midpoint === null ? null : String(row.band_midpoint),
            effective_date: row.effective_date ?? null,
            note: row.note ?? null,
            employees: { name: 'Ravi Prasad' },
          }
          rows.push(created)
          return Promise.resolve({ data: created, error: null })
        },
      }),
    }))
    mockProductionWorkspace({
      tables: {
        hr_compensation_records: () => ({
          select: () => ({
            eq: () => ({ order: () => listChain(rows) }),
          }),
          insert,
        }),
        employees: () => ({
          select: () => ({
            eq: () => ({ order: () => listChain(roster) }),
          }),
        }),
      },
    })
    vi.resetModules()
    return { insert }
  }

  const ROSTER = [
    {
      id: 'emp-1',
      name: 'Dana Okonjo',
      title: null,
      email: null,
      province: 'Ontario',
      start_date: null,
      status: 'active',
    },
    {
      id: 'emp-2',
      name: 'Ravi Prasad',
      title: null,
      email: null,
      province: 'Quebec',
      start_date: null,
      status: 'active',
    },
  ]

  it('renders real records instead of the Northgate fixtures', async () => {
    mockComp([RECORD], ROSTER)
    const { renderApp: renderFresh } = await import('@/test/renderApp')
    const { CompensationView: View } = await import('./CompensationView')

    renderFresh(<View />, { route: '/app/compensation', path: '/app/compensation' })

    expect(await screen.findByText('Dana Okonjo')).toBeInTheDocument()
    expect(screen.getByText('1 record')).toBeInTheDocument()
    /* Against the employer's own midpoint, not a market figure. */
    expect(screen.getByText('-9% vs band midpoint')).toBeInTheDocument()
    /* The demo fixtures are gone. */
    expect(screen.queryByText('Sarah Chen')).not.toBeInTheDocument()
  })

  /* The reason this module was rewritten rather than ported: Dutiva has no
     salary-survey source, so a record without an employer-supplied midpoint
     shows no comparison at all. Rendering 0% would read as "at midpoint". */
  it('shows no comparison for a record with no midpoint', async () => {
    mockComp([{ ...RECORD, band_midpoint: null }], ROSTER)
    const { renderApp: renderFresh } = await import('@/test/renderApp')
    const { CompensationView: View } = await import('./CompensationView')

    renderFresh(<View />, { route: '/app/compensation', path: '/app/compensation' })

    expect(await screen.findByText('No midpoint set')).toBeInTheDocument()
    expect(screen.queryByText(/% vs band midpoint/)).not.toBeInTheDocument()
    /* And it is not counted as below midpoint either. */
    expect(screen.getByText('Below their band midpoint').previousSibling).toHaveTextContent('0')
  })

  it('never claims a market benchmark', async () => {
    mockComp([RECORD], ROSTER)
    const { renderApp: renderFresh } = await import('@/test/renderApp')
    const { CompensationView: View } = await import('./CompensationView')

    renderFresh(<View />, { route: '/app/compensation', path: '/app/compensation' })
    await screen.findByText('Dana Okonjo')

    expect(screen.queryByText('Below market midpoint')).not.toBeInTheDocument()
    expect(
      screen.getByText(
        'Comparisons use the band midpoint you enter. Dutiva does not supply market salary data.',
      ),
    ).toBeInTheDocument()
  })

  it('adds a record for someone on the roster', async () => {
    const { insert } = mockComp([], ROSTER)
    const { renderApp: renderFresh } = await import('@/test/renderApp')
    const { CompensationView: View } = await import('./CompensationView')

    renderFresh(<View />, { route: '/app/compensation', path: '/app/compensation' })

    expect(await screen.findByText('No compensation records yet')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Add record' }))
    fireEvent.change(screen.getByLabelText('Employee'), { target: { value: 'emp-2' } })
    fireEvent.change(screen.getByLabelText('Base salary'), { target: { value: '95000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(insert).toHaveBeenCalled())
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: 'org-1',
        employee_id: 'emp-2',
        base_salary: 95000,
      }),
    )
    await waitFor(() => expect(screen.getByText('Ravi Prasad')).toBeInTheDocument())
  })

  it('shows the market comparison column as unavailable', async () => {
    mockComp([RECORD], ROSTER)
    const { renderApp: renderFresh } = await import('@/test/renderApp')
    const { CompensationView: View } = await import('./CompensationView')

    renderFresh(<View />, { route: '/app/compensation', path: '/app/compensation' })
    await screen.findByText('Dana Okonjo')

    expect(screen.getByText('Market comparison')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Dana Okonjo' })).toHaveAttribute(
      'href',
      '/app/employees/emp-1',
    )
  })
})
