import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, within } from '@testing-library/react'
import { renderApp } from '@/test/renderApp'
import { AdvisorRail } from '@/features/app/rail/AdvisorRail'
import { CaseDetailView } from './CaseDetailView'

const CASE1 = { route: '/app/cases/case1', path: '/app/cases/:caseId' }

describe('CaseDetailView', () => {
  it('renders the case1 overview: header, recommendation, risk, workflow, linked records', () => {
    renderApp(<CaseDetailView />, CASE1)

    expect(screen.getByText('Termination — Jordan Mensah')).toBeInTheDocument()
    expect(screen.getByText('Legal review recommended')).toBeInTheDocument()

    /* Advisor recommendation + risk assessment (fixture strings). */
    expect(screen.getByText('Advisor recommendation')).toBeInTheDocument()
    expect(screen.getByText(/Do not send an offer until counsel confirms/)).toBeInTheDocument()
    expect(screen.getByText('No enforceable termination clause on file')).toBeInTheDocument()

    /* Workflow steps, people, linked tasks, documents, compliance flags. */
    expect(screen.getByText('Case opened')).toBeInTheDocument()
    expect(screen.getByText('Counsel response')).toBeInTheDocument()
    expect(screen.getByText('Case owner')).toBeInTheDocument()
    expect(screen.getByText('Partner counsel')).toBeInTheDocument()
    expect(
      screen.getByText('Review termination notice exposure — Jordan Mensah'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Termination letter (without cause)' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Jordan Mensah — notice exposure; no termination clause on file'),
    ).toBeInTheDocument()

    /* Termination cases cannot self-serve approval (routed to counsel). */
    expect(
      screen.getByText('Legal review requested — awaiting counsel (1 business day)'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Request approval' })).not.toBeInTheDocument()
  })

  it('switches tabs: risk review axes and the notes composer', () => {
    renderApp(<CaseDetailView />, CASE1)

    fireEvent.click(screen.getByRole('tab', { name: 'Risk review' }))
    expect(screen.getByText('Legal / compliance')).toBeInTheDocument()
    expect(
      screen.getByText(/Hold the offer until counsel confirms the notice range./),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Notes' }))
    /* Seeded fixture note. */
    expect(
      screen.getByText(/Confirmed with Finance that the ESA severance payroll threshold is met/),
    ).toBeInTheDocument()

    /* Adding a note appends it locally. */
    fireEvent.change(screen.getByPlaceholderText('Add a private case note… (⌘↵ to save)'), {
      target: { value: 'Called the manager to schedule the meeting.' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    expect(screen.getByText('Called the manager to schedule the meeting.')).toBeInTheDocument()
    expect(screen.getByText('Riley Summers · Just now')).toBeInTheDocument()
  })

  it('shows a gentle empty state for an unknown case id', () => {
    renderApp(<CaseDetailView />, { route: '/app/cases/unknown', path: '/app/cases/:caseId' })

    expect(screen.getByText('Case not found')).toBeInTheDocument()
    const links = screen.getAllByRole('link', { name: 'All cases' })
    expect(links.length).toBeGreaterThan(0)
    expect(links[0]).toHaveAttribute('href', '/app/cases')
  })

  describe('Ask Advisor rail', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    it('opens the rail on the case subject with their context chips', () => {
      renderApp(
        <>
          <CaseDetailView />
          <AdvisorRail />
        </>,
        CASE1,
      )

      fireEvent.click(screen.getByRole('button', { name: 'Ask Advisor' }))

      const dialog = screen.getByRole('dialog', { name: 'Ask Advisor' })
      expect(dialog).toBeInTheDocument()
      expect(within(dialog).getByText('Jordan Mensah')).toBeInTheDocument()
      /* Context chips: province · role · case type. */
      expect(within(dialog).getByText('Ontario')).toBeInTheDocument()
      expect(within(dialog).getByText('Senior Operations Manager')).toBeInTheDocument()
      expect(within(dialog).getByText('Termination')).toBeInTheDocument()
    })
  })
})
