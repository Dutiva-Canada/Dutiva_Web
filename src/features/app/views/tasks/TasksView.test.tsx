import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { useLocation } from 'react-router-dom'
import { renderApp } from '@/test/renderApp'
import { listChain } from '@/test/productionWorkspace'
import type { AdvisorSearchNavState } from '@/features/app/search/searchCorpus'
import { TasksView } from './TasksView'

/** Records where a row click navigated to (route + chatId router state). */
function LocationProbe() {
  const location = useLocation()
  const state = location.state as AdvisorSearchNavState | null
  return (
    <div data-testid="location">
      {location.pathname}|{state?.chatId ?? ''}
    </div>
  )
}

function renderTasks() {
  return renderApp(
    <>
      <TasksView />
      <LocationProbe />
    </>,
    { route: '/app/tasks' },
  )
}

describe('TasksView', () => {
  it('renders the open count and the fixture checklist rows', () => {
    renderTasks()

    /* 4 of the 6 fixture tasks are open (tk2 and tk3 are done). */
    expect(screen.getByText('4 open')).toBeInTheDocument()

    /* Row content: title, meta line, linked case, evidence note. */
    expect(
      screen.getByText('Review termination notice exposure — Jordan Mensah'),
    ).toBeInTheDocument()
    expect(screen.getByText('Today · Owner: Riley Summers · Ontario')).toBeInTheDocument()
    expect(screen.getAllByText('Linked: Termination — Jordan Mensah')).toHaveLength(2)
    expect(screen.getByText('Linked: Remote work policy refresh')).toBeInTheDocument()
    expect(
      screen.getByText('Evidence: French onboarding package filed to the case'),
    ).toBeInTheDocument()

    /* Status + priority chips. */
    expect(screen.getAllByText('Done')).toHaveLength(2)
    expect(screen.getAllByText('Open')).toHaveLength(4)
    expect(screen.getAllByText('high')).toHaveLength(2)
    expect(screen.getAllByText('medium')).toHaveLength(2)
    expect(screen.getAllByText('low')).toHaveLength(2)
  })

  it('toggles a task done and updates the open count and strikethrough', () => {
    renderTasks()

    const [firstToggle] = screen.getAllByRole('button', { name: 'Toggle task done' })
    expect(firstToggle).toBeDefined()
    fireEvent.click(firstToggle!)

    expect(screen.getByText('3 open')).toBeInTheDocument()
    expect(screen.getByText('Review termination notice exposure — Jordan Mensah')).toHaveClass(
      'line-through',
    )
    expect(screen.getAllByText('Done')).toHaveLength(3)

    /* Toggle back re-opens it. */
    fireEvent.click(firstToggle!)
    expect(screen.getByText('4 open')).toBeInTheDocument()
  })

  it('opens the linked Advisor conversation when a row body is clicked', () => {
    renderTasks()

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Open linked conversation for Review termination notice exposure — Jordan Mensah',
      }),
    )

    expect(screen.getByTestId('location')).toHaveTextContent('/app/advisor|c1')
  })
})

describe('TasksView in production mode', () => {
  afterEach(() => {
    vi.doUnmock('@/lib/supabaseClient')
    vi.resetModules()
  })

  /** Admin signed in, production stored, one org, real compliance_tasks. */
  function mockProductionClient(initialTasks: Record<string, unknown>[]) {
    const taskRows = [...initialTasks]
    const insert = vi.fn((row: Record<string, unknown>) => ({
      select: () => ({
        single: () => {
          const created = {
            id: `task-${taskRows.length + 1}`,
            title: row.title,
            priority: row.priority,
            status: 'open',
            /* The table's column default — addTask doesn't send a category. */
            category: 'general',
            due_at: row.due_at ?? null,
          }
          taskRows.unshift(created)
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
          if (table === 'compliance_tasks') {
            return {
              select: () => ({
                eq: () => ({
                  order: () => listChain(taskRows),
                }),
              }),
              insert,
              update,
            }
          }
          throw new Error(`unexpected table: ${table}`)
        }),
      },
    }))
    vi.resetModules()
    return { insert, update }
  }

  it('renders real tasks instead of the Northgate fixtures', async () => {
    mockProductionClient([
      {
        id: 'task-1',
        title: 'File ROE for departing employee',
        priority: 'high',
        status: 'open',
        category: 'general',
        due_at: '2026-07-20T00:00:00+00:00',
      },
    ])
    const { renderApp: renderAppFresh } = await import('@/test/renderApp')
    const { TasksView: TasksViewFresh } = await import('./TasksView')

    renderAppFresh(<TasksViewFresh />, { route: '/app/tasks', path: '/app/tasks' })

    expect(await screen.findByText('File ROE for departing employee')).toBeInTheDocument()
    expect(screen.getByText('1 open')).toBeInTheDocument()
    expect(screen.getByText('2026-07-20')).toBeInTheDocument()
    expect(
      screen.queryByText('Review termination notice exposure — Jordan Mensah'),
    ).not.toBeInTheDocument()
  })

  it('adds a task and toggles it done through the real write paths', async () => {
    const { insert, update } = mockProductionClient([])
    const { renderApp: renderAppFresh } = await import('@/test/renderApp')
    const { TasksView: TasksViewFresh } = await import('./TasksView')

    renderAppFresh(<TasksViewFresh />, { route: '/app/tasks', path: '/app/tasks' })

    expect(await screen.findByText('No tasks yet')).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button', { name: 'Add task' })[0]!)
    fireEvent.change(screen.getByLabelText('Task'), {
      target: { value: 'Draft vacation policy' },
    })
    fireEvent.change(screen.getByLabelText('Priority'), { target: { value: 'critical' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save task' }))

    expect(await screen.findByText('Draft vacation policy')).toBeInTheDocument()
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: 'org-1',
        title: 'Draft vacation policy',
        priority: 'critical',
      }),
    )
    expect(screen.getByText('1 open')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Toggle task done' }))
    expect(await screen.findByText('0 open')).toBeInTheDocument()
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ status: 'completed' }))
    expect(screen.getByText('Draft vacation policy')).toHaveClass('line-through')
  })
})
