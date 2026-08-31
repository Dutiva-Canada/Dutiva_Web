import { describe, expect, it } from 'vitest'
import { useEffect } from 'react'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useLocation } from 'react-router-dom'
import { employees } from '@/data'
import { renderApp } from '@/test/renderApp'
import { useWorkspaceContext } from './workspaceContextStore'
import { WorkspaceContextBanner } from '@/features/app/shell/WorkspaceContextBanner'

const emp = (() => {
  const found = employees.find((e) => e.id === 'e1')
  if (!found) throw new Error('fixture employee e1 missing')
  return found
})()

function LocationProbe() {
  const location = useLocation()
  return <span data-testid="pathname">{location.pathname}</span>
}

function BannerWithContext() {
  const { setContext } = useWorkspaceContext()
  useEffect(() => {
    setContext({
      subject: emp.name,
      entityType: 'employee',
      empId: emp.id,
      initials: emp.initials,
      meta: [emp.jurisdiction, emp.role],
    })
  }, [setContext])
  return (
    <>
      <WorkspaceContextBanner />
      <LocationProbe />
    </>
  )
}

describe('WorkspaceContextBanner', () => {
  it('shows the pinned entity and navigates to the employee profile', async () => {
    const user = userEvent.setup()
    renderApp(<BannerWithContext />)

    expect(screen.getByText(emp.name)).toBeInTheDocument()
    expect(screen.getByText(/Advisor is using/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Open record' }))
    expect(screen.getByTestId('pathname')).toHaveTextContent(`/app/employees/${emp.id}`)
  })

  it('clears the banner when the dismiss control is clicked', async () => {
    const user = userEvent.setup()
    renderApp(<BannerWithContext />)

    await user.click(screen.getByRole('button', { name: 'Clear context' }))
    expect(screen.queryByText(emp.name)).not.toBeInTheDocument()
  })
})
