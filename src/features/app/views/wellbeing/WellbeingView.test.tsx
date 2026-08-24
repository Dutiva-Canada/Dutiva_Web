import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { useLocation } from 'react-router-dom'
import { renderApp } from '@/test/renderApp'
import { ADVISOR_STREAM_TICK_MS, ADVISOR_THINK_MS } from '@/features/app/advisor/useAdvisorEngine'
import { AdvisorRail } from '@/features/app/rail/AdvisorRail'
import { mockProductionWorkspace } from '@/test/productionWorkspace'
import { WellbeingView } from './WellbeingView'

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname}</div>
}

function renderView() {
  return renderApp(
    <>
      <WellbeingView />
      <AdvisorRail />
      <LocationProbe />
    </>,
    { route: '/app/wellbeing' },
  )
}

describe('WellbeingView', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the non-diagnostic banner, stats, and support signals', () => {
    renderView()

    /* Explicit usage-limits framing. */
    expect(
      screen.getByText(/Support signals are for supportive follow-up and workload review only/),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Access to support signals is recorded in the audit log.'),
    ).toBeInTheDocument()

    /* Stat tiles: 5 active signals, 2 follow-ups. */
    expect(screen.getByText('Active support signals')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('Follow-ups this week')).toBeInTheDocument()

    /* Signal cards (supportSignals fixtures). */
    expect(screen.getByText('Repeated overtime pattern')).toBeInTheDocument()
    expect(screen.getByText('Return-to-work follow-up')).toBeInTheDocument()
    expect(screen.getByText('Medium — workload data only')).toBeInTheDocument()
    expect(screen.getByText('High — do not link to discipline')).toBeInTheDocument()
    expect(screen.getAllByText('Recommended supportive action')).toHaveLength(5)

    /* Team-level signal has no "Open profile" button: 4 of 5 signals do. */
    expect(screen.getAllByRole('button', { name: 'Open profile' })).toHaveLength(4)
    expect(screen.getAllByRole('button', { name: 'Draft support check-in' })).toHaveLength(5)
  })

  it('opens the check-in rail with the "Handle with care" card for a personal signal', () => {
    vi.useFakeTimers()
    renderView()

    /* First signal (ws1) belongs to Grace Osei. */
    act(() => {
      const draft = screen.getAllByRole('button', { name: 'Draft support check-in' })[0]
      expect(draft).toBeDefined()
      fireEvent.click(draft as HTMLElement)
    })

    expect(screen.getByRole('dialog', { name: 'Ask Advisor' })).toBeInTheDocument()
    expect(screen.getByText('Grace Osei — wellbeing')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(ADVISOR_THINK_MS + 120 * ADVISOR_STREAM_TICK_MS)
    })
    expect(
      screen.getByText(
        'Here’s what I’m seeing in Grace’s recent check-ins. I’ll keep this non-diagnostic.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Handle with care')).toBeInTheDocument()
    expect(screen.getByText('Human rights — duty to accommodate')).toBeInTheDocument()

    /* The primary action routes to Communications and closes the rail. */
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Draft a check-in message' }))
    })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/app/communications')
  })

  it('routes team-level signals straight to Communications', () => {
    renderView()

    /* Last signal (ws5) is the team-level workload imbalance. */
    const buttons = screen.getAllByRole('button', { name: 'Draft support check-in' })
    const teamDraft = buttons[buttons.length - 1]
    expect(teamDraft).toBeDefined()
    fireEvent.click(teamDraft as HTMLElement)

    expect(screen.getByTestId('location')).toHaveTextContent('/app/communications')
  })
})

describe('WellbeingView in production mode', () => {
  afterEach(() => {
    vi.doUnmock('@/lib/supabaseClient')
    vi.resetModules()
  })

  const ROW = {
    id: 'init-1',
    name: 'Employee assistance programme',
    kind: 'eap',
    status: 'active',
    owner: 'HR lead',
    review_date: '2020-01-01',
    note: null,
  }

  function mockWellbeing(initial: Record<string, unknown>[]) {
    const rows = [...initial]
    const insert = vi.fn((row: Record<string, unknown>) => ({
      select: () => ({
        single: () => {
          const created = {
            id: `init-${rows.length + 1}`,
            name: row.name,
            kind: row.kind,
            status: row.status,
            owner: row.owner ?? null,
            review_date: row.review_date ?? null,
            note: row.note ?? null,
          }
          rows.push(created)
          return Promise.resolve({ data: created, error: null })
        },
      }),
    }))
    const update = vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) }))
    mockProductionWorkspace({
      tables: {
        hr_wellbeing_initiatives: () => ({
          select: () => ({
            eq: () => ({ order: () => Promise.resolve({ data: rows, error: null }) }),
          }),
          insert,
          update,
        }),
      },
    })
    vi.resetModules()
    return { insert, update }
  }

  it('renders the register of supports the employer offers', async () => {
    mockWellbeing([ROW])
    const { renderApp: renderFresh } = await import('@/test/renderApp')
    const { WellbeingView: View } = await import('./WellbeingView')

    renderFresh(<View />, { route: '/app/wellbeing', path: '/app/wellbeing' })

    expect(await screen.findByText('Employee assistance programme')).toBeInTheDocument()
    expect(screen.getByText('1 initiative')).toBeInTheDocument()
    /* A review date in the past is the one thing this module flags. */
    expect(screen.getByText('Review overdue')).toBeInTheDocument()
  })

  /**
   * The load-bearing test for this module, and the reason it was rewritten
   * rather than ported. The demo listed named people with a source, a
   * confidence level and a sensitivity rating — inferred health information
   * about identifiable employees. None of it survives into production.
   */
  it('names no individuals and shows no inferred signals', async () => {
    mockWellbeing([ROW])
    const { renderApp: renderFresh } = await import('@/test/renderApp')
    const { WellbeingView: View } = await import('./WellbeingView')

    renderFresh(<View />, { route: '/app/wellbeing', path: '/app/wellbeing' })
    await screen.findByText('Employee assistance programme')

    /* Fixture people and the signal vocabulary are both gone. */
    expect(screen.queryByText(/Sarah Chen/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Confidence/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Source:/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Handle with care/i)).not.toBeInTheDocument()
    expect(
      screen.getByText(
        /Dutiva records no health information about individuals and detects no signals about anyone\./,
      ),
    ).toBeInTheDocument()
  })

  it('adds an initiative and changes its status', async () => {
    const { insert, update } = mockWellbeing([])
    const { renderApp: renderFresh } = await import('@/test/renderApp')
    const { WellbeingView: View } = await import('./WellbeingView')

    renderFresh(<View />, { route: '/app/wellbeing', path: '/app/wellbeing' })

    expect(await screen.findByText('No initiatives recorded yet')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Add initiative' }))
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Manager mental-health training' },
    })
    fireEvent.change(screen.getByLabelText('Type'), { target: { value: 'training' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(insert).toHaveBeenCalled())
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: 'org-1',
        name: 'Manager mental-health training',
        kind: 'training',
      }),
    )
    await waitFor(() =>
      expect(screen.getByText('Manager mental-health training')).toBeInTheDocument(),
    )

    fireEvent.change(screen.getByLabelText('Initiative status — Manager mental-health training'), {
      target: { value: 'paused' },
    })
    await waitFor(() =>
      expect(update).toHaveBeenCalledWith(expect.objectContaining({ status: 'paused' })),
    )
  })

  it('shows the support signals section with an honest empty state', async () => {
    mockWellbeing([ROW])
    const { renderApp: renderFresh } = await import('@/test/renderApp')
    const { WellbeingView: View } = await import('./WellbeingView')

    renderFresh(<View />, { route: '/app/wellbeing', path: '/app/wellbeing' })
    await screen.findByText('Employee assistance programme')

    expect(screen.getByText('Support signals')).toBeInTheDocument()
    expect(
      screen.getByText(/Dutiva detects no signals about individuals\./),
    ).toBeInTheDocument()
  })
})
