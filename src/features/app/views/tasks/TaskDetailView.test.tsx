import { describe, expect, it } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderApp } from '@/test/renderApp'
import { TaskDetailView } from './TaskDetailView'

function renderDetail(taskId = 'tk1') {
  return renderApp(<TaskDetailView />, {
    route: `/app/planning/tasks/${taskId}`,
    path: '/app/planning/tasks/:taskId',
  })
}

describe('TaskDetailView (demo)', () => {
  it('renders the fixture task header, Advisor plan and linked record', () => {
    renderDetail('tk1')

    expect(
      screen.getByRole('heading', {
        name: 'Review termination notice exposure — Jordan Mensah',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('Today · Owner: Riley Summers · Ontario')).toBeInTheDocument()
    expect(screen.getByText('Linked: Termination — Jordan Mensah')).toBeInTheDocument()
    expect(screen.getByText('high')).toBeInTheDocument()
    expect(screen.getByText('Open')).toBeInTheDocument()

    /* Advisor plan section carries the fixture detail + the standing disclaimer. */
    expect(screen.getByText('Advisor plan')).toBeInTheDocument()
    expect(
      screen.getByText(/notice period on file is shorter than what Jordan’s tenure/),
    ).toBeInTheDocument()
    expect(screen.getByText(/not legal advice/i)).toBeInTheDocument()
  })

  it('shows a not-found state for an unknown task id', () => {
    renderDetail('nope')
    expect(screen.getByText('This task isn’t in the list anymore.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Tasks' })).toHaveAttribute(
      'href',
      '/app/planning/tasks',
    )
  })

  it('lets the user append a note to the task', () => {
    renderDetail('tk4')

    expect(screen.getByText(/No notes yet/)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Notes'), {
      target: { value: 'Spoke with Devon — milestone review Friday.' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add note' }))

    expect(
      screen.getByText('Spoke with Devon — milestone review Friday.'),
    ).toBeInTheDocument()
    expect(screen.queryByText(/No notes yet/)).not.toBeInTheDocument()
  })
})
