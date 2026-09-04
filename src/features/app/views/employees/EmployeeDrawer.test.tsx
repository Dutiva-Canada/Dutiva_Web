import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, within } from '@testing-library/react'
import { renderApp } from '@/test/renderApp'
import { employees } from '@/data'
import type { Employee } from '@/data'
import { EmployeeDrawer } from './EmployeeDrawer'

function fixture(id: string): Employee {
  const emp = employees.find((e) => e.id === id)
  if (!emp) throw new Error(`missing fixture employee ${id}`)
  return emp
}

describe('EmployeeDrawer', () => {
  it('renders nothing without a subject', () => {
    renderApp(<EmployeeDrawer employee={null} onClose={() => {}} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows identity, insight and the risk card with its case action', () => {
    renderApp(<EmployeeDrawer employee={fixture('e1')} onClose={() => {}} />)

    const dialog = screen.getByRole('dialog', { name: 'Employee profile' })
    expect(dialog).toBeInTheDocument()
    expect(screen.getByText('Jordan Mensah')).toBeInTheDocument()
    expect(screen.getByText('Senior Operations Manager · Ontario')).toBeInTheDocument()
    expect(screen.getByText('Offboarding')).toBeInTheDocument()
    expect(screen.getByText(/Jordan's termination is in progress/)).toBeInTheDocument()
    expect(screen.getByText('Notice exposure risk')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open full case' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Ask Advisor about Jordan Mensah' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Review Advisor memory' })).toHaveAttribute(
      'href',
      '/app/settings/memory/people/e1',
    )
  })

  it('omits the risk card for employees without a flag', () => {
    renderApp(<EmployeeDrawer employee={fixture('e4')} onClose={() => {}} />)
    expect(screen.getByText('Sarah Whitcombe')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Open full case' })).not.toBeInTheDocument()
  })

  it('closes via the close button and Escape', () => {
    const onClose = vi.fn()
    renderApp(<EmployeeDrawer employee={fixture('e1')} onClose={onClose} />)

    /* The scrim and the header X are both labelled Close — use the dialog's. */
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledTimes(1)

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
