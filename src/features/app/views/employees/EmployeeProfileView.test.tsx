import { describe, expect, it } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderApp } from '@/test/renderApp'
import { DocStudioOverlay } from '@/features/app/docstudio/DocStudioOverlay'
import { EmployeeProfileView } from './EmployeeProfileView'

function renderProfile(employeeId = 'e1') {
  return renderApp(
    <>
      <EmployeeProfileView />
      <DocStudioOverlay />
    </>,
    { route: `/app/employees/${employeeId}`, path: '/app/employees/:employeeId' },
  )
}

describe('EmployeeProfileView', () => {
  it('renders the identity header and the overview tab from fixtures', () => {
    renderProfile()

    expect(screen.getByText('Jordan Mensah')).toBeInTheDocument()
    expect(screen.getByText('Senior Operations Manager · Operations · Ontario')).toBeInTheDocument()
    expect(screen.getByText('Offboarding')).toBeInTheDocument()
    expect(screen.getByText(/8 yrs · Manager: Riley Summers · Since Mar 2018/)).toBeInTheDocument()

    /* Overview: insight, record rows (jurisdiction + statute), risk card, tiles. */
    expect(screen.getByText(/Jordan's termination is in progress/)).toBeInTheDocument()
    expect(screen.getByText('Ontario · Employment Standards Act, 2000')).toBeInTheDocument()
    expect(screen.getByText('Notice exposure risk')).toBeInTheDocument()
    expect(screen.getByText('$118,000')).toBeInTheDocument()

    /* Audit footnote. */
    expect(screen.getByText(/recorded in the audit log/)).toBeInTheDocument()
  })

  it('renders nothing for an unknown employee id', () => {
    renderProfile('nope')
    expect(screen.queryByText('All people')).not.toBeInTheDocument()
  })

  it('switches to the leave tab: restricted banner and leave records', () => {
    renderProfile()
    fireEvent.click(screen.getByRole('tab', { name: 'Leave & accommodation' }))

    expect(
      screen.getByText(/medical and accommodation records hold functional information only/),
    ).toBeInTheDocument()
    expect(screen.getByText('Vacation')).toBeInTheDocument()
    expect(screen.getByText('Aug 4–8, 2025 · 5 days')).toBeInTheDocument()
    expect(screen.getByText('Taken')).toBeInTheDocument()
  })

  it('switches to the compensation tab: salary, market delta and compensation note', () => {
    renderProfile()
    fireEvent.click(screen.getByRole('tab', { name: 'Compensation' }))

    expect(screen.getByText('$118,000')).toBeInTheDocument()
    expect(screen.getByText('$121,000')).toBeInTheDocument()
    expect(screen.getByText('-2% vs market')).toBeInTheDocument()
    expect(screen.getByText(/Market midpoint comparisons are one input/)).toBeInTheDocument()
  })

  it('renders unknown compensation fields safely for Priya (default detail values)', () => {
    renderProfile('e2')
    fireEvent.click(screen.getByRole('tab', { name: 'Compensation' }))

    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2)
    expect(screen.queryByText(/% vs market/)).not.toBeInTheDocument()
    expect(screen.getByText(/Market midpoint comparisons are one input/)).toBeInTheDocument()
  })

  it('shows linked cases with the restricted badge', () => {
    renderProfile()
    fireEvent.click(screen.getByRole('tab', { name: 'Cases' }))

    expect(screen.getByText('Termination — Jordan Mensah')).toBeInTheDocument()
    expect(screen.getByText('Restricted')).toBeInTheDocument()
    expect(screen.getByText('Legal review recommended')).toBeInTheDocument()
  })

  it('opens Document Studio from a timeline document event', () => {
    renderProfile()
    fireEvent.click(screen.getByRole('tab', { name: 'Timeline' }))

    expect(screen.getByText(/Advisor composes this timeline automatically/)).toBeInTheDocument()
    fireEvent.click(screen.getByText('Termination Letter generated'))

    expect(screen.getByRole('dialog', { name: 'Document Studio' })).toBeInTheDocument()
  })
})
