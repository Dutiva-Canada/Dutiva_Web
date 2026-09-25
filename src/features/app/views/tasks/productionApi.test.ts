import { afterEach, describe, expect, it, vi } from 'vitest'
import { listChain } from '@/test/productionWorkspace'

/** Same per-test client mock + fresh import pattern as the other productionApi tests. */
describe('tasks productionApi', () => {
  afterEach(() => {
    vi.doUnmock('@/lib/supabaseClient')
    vi.resetModules()
  })

  const ROW = {
    id: 'task-1',
    title: 'File ROE for departing employee',
    priority: 'high',
    status: 'open',
    category: 'general',
    due_at: '2026-07-20T00:00:00+00:00',
  }

  it('listTasks parses rows, derives done and a date-only due date', async () => {
    const order = vi
      .fn()
      .mockReturnValue(
        listChain([ROW, { ...ROW, id: 'task-2', status: 'completed', due_at: null }]),
      )
    const eq = vi.fn().mockReturnValue({ order })
    const select = vi.fn().mockReturnValue({ eq })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ select }) },
    }))
    vi.resetModules()
    const api = await import('./productionApi')

    const rows = await api.listTasks('org-1')
    expect(eq).toHaveBeenCalledWith('organization_id', 'org-1')
    expect(rows[0]).toEqual({
      id: 'task-1',
      title: 'File ROE for departing employee',
      priority: 'high',
      status: 'open',
      category: 'general',
      done: false,
      dueDate: '2026-07-20',
      description: null,
      jurisdiction: null,
      assignedTo: null,
      notes: [],
      linkedEmployeeId: null,
      linkedKind: null,
    })
    expect(rows[1]).toMatchObject({ done: true, dueDate: null })
  })

  it('tolerates backend statuses beyond the checklist vocabulary (in_progress → not done)', async () => {
    const order = vi.fn().mockReturnValue(listChain([{ ...ROW, status: 'in_progress' }]))
    const eq = vi.fn().mockReturnValue({ order })
    const select = vi.fn().mockReturnValue({ eq })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ select }) },
    }))
    vi.resetModules()
    const api = await import('./productionApi')

    const rows = await api.listTasks('org-1')
    expect(rows[0]).toMatchObject({ status: 'in_progress', done: false })
  })

  it('addTask inserts with the org id and nulls an empty due date', async () => {
    const single = vi.fn().mockResolvedValue({ data: { ...ROW, due_at: null }, error: null })
    const select = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ insert }) },
    }))
    vi.resetModules()
    const api = await import('./productionApi')

    await api.addTask('org-1', {
      title: 'File ROE for departing employee',
      priority: 'high',
      dueDate: '',
    })
    expect(insert).toHaveBeenCalledWith({
      organization_id: 'org-1',
      title: 'File ROE for departing employee',
      priority: 'high',
      due_at: null,
      description: null,
    })
  })

  it('setTaskDone completes and reopens with completed_at stamped/cleared', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn().mockReturnValue({ eq })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ update }) },
    }))
    vi.resetModules()
    const api = await import('./productionApi')

    await api.setTaskDone('task-1', true)
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'completed', completed_at: expect.any(String) }),
    )

    await api.setTaskDone('task-1', false)
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'open', completed_at: null }),
    )
  })

  it('countOpenTasks issues a head count excluding completed', async () => {
    const neq = vi.fn().mockResolvedValue({ count: 2, error: null })
    const eq = vi.fn().mockReturnValue({ neq })
    const select = vi.fn().mockReturnValue({ eq })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ select }) },
    }))
    vi.resetModules()
    const api = await import('./productionApi')

    expect(await api.countOpenTasks('org-1')).toBe(2)
    expect(neq).toHaveBeenCalledWith('status', 'completed')
  })

  it('addTask writes details into the description column', async () => {
    const single = vi.fn().mockResolvedValue({ data: ROW, error: null })
    const select = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ insert }) },
    }))
    vi.resetModules()
    const api = await import('./productionApi')

    await api.addTask('org-1', {
      title: 'File ROE for departing employee',
      priority: 'high',
      dueDate: '2026-07-20',
      details: 'Check the ROE deadline, then file.',
    })
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ description: 'Check the ROE deadline, then file.' }),
    )
  })

  it('addTaskNote appends to metadata.notes without dropping sibling keys', async () => {
    const single = vi.fn().mockResolvedValue({
      data: { metadata: { employee_id: 'emp-1', kind: 'probation_review' } },
      error: null,
    })
    const selectEq = vi.fn().mockReturnValue({ single })
    const select = vi.fn().mockReturnValue({ eq: selectEq })
    const updateEq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn().mockReturnValue({ eq: updateEq })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ select, update }) },
    }))
    vi.resetModules()
    const api = await import('./productionApi')

    const note = await api.addTaskNote('task-1', 'Called the employee — review Friday.')
    expect(note.text).toBe('Called the employee — review Friday.')
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          employee_id: 'emp-1',
          kind: 'probation_review',
          notes: [expect.objectContaining({ text: 'Called the employee — review Friday.' })],
        }),
      }),
    )
  })
})
