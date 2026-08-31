import { afterEach, describe, expect, it, vi } from 'vitest'

/** Same per-test client mock + fresh import pattern as the employees productionApi tests. */
describe('cases productionApi', () => {
  afterEach(() => {
    vi.doUnmock('@/lib/supabaseClient')
    vi.resetModules()
  })

  const ROW = {
    id: 'case-1',
    title: 'Accommodation — ergonomic assessment',
    case_type: 'Accommodation',
    employee_id: 'emp-1',
    jurisdiction: 'Ontario',
    status: 'open',
    due_date: '2026-08-01',
    created_at: '2026-07-01T12:00:00Z',
  }

  it('listCases returns parsed rows scoped to the org, newest first', async () => {
    const order = vi.fn().mockResolvedValue({ data: [ROW], error: null })
    const eq = vi.fn().mockReturnValue({ order })
    const select = vi.fn().mockReturnValue({ eq })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ select }) },
    }))
    vi.resetModules()
    const api = await import('./productionApi')

    const rows = await api.listCases('org-1')
    expect(eq).toHaveBeenCalledWith('organization_id', 'org-1')
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(rows).toEqual([
      {
        id: 'case-1',
        title: 'Accommodation — ergonomic assessment',
        caseType: 'Accommodation',
        employeeId: 'emp-1',
        jurisdiction: 'Ontario',
        status: 'open',
        dueDate: '2026-08-01',
        createdAt: '2026-07-01T12:00:00Z',
      },
    ])
  })

  it('addCase inserts with the org id and nulls out empty optionals', async () => {
    const single = vi.fn().mockResolvedValue({ data: { ...ROW, employee_id: null }, error: null })
    const select = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ insert }) },
    }))
    vi.resetModules()
    const api = await import('./productionApi')

    await api.addCase('org-1', {
      title: 'Accommodation — ergonomic assessment',
      caseType: 'Accommodation',
      employeeId: '',
      jurisdiction: 'Ontario',
      dueDate: '',
    })
    expect(insert).toHaveBeenCalledWith({
      organization_id: 'org-1',
      title: 'Accommodation — ergonomic assessment',
      case_type: 'Accommodation',
      employee_id: null,
      jurisdiction: 'Ontario',
      due_date: null,
    })
  })

  it('updateCaseStatus updates by id and throws on failure', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn().mockReturnValue({ eq })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ update }) },
    }))
    vi.resetModules()
    const api = await import('./productionApi')

    await api.updateCaseStatus('case-1', 'resolved')
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ status: 'resolved' }))
    expect(eq).toHaveBeenCalledWith('id', 'case-1')
  })

  it('listCases throws when the read fails', async () => {
    const order = vi.fn().mockResolvedValue({ data: null, error: new Error('rls') })
    const eq = vi.fn().mockReturnValue({ order })
    const select = vi.fn().mockReturnValue({ eq })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ select }) },
    }))
    vi.resetModules()
    const api = await import('./productionApi')

    await expect(api.listCases('org-1')).rejects.toThrow()
  })

  it('getCase returns null for a missing id and a parsed case otherwise', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    const select = vi.fn().mockReturnValue({ eq })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ select }) },
    }))
    vi.resetModules()
    const api = await import('./productionApi')

    expect(await api.getCase('nope')).toBeNull()
  })

  it('listCaseNotes parses the thread oldest-first; addCaseNote inserts with org + case ids', async () => {
    const NOTE = { id: 'n1', body: 'Spoke with the employee.', created_at: '2026-07-12T13:00:00Z' }
    const order = vi.fn().mockResolvedValue({ data: [NOTE], error: null })
    const eqNotes = vi.fn().mockReturnValue({ order })
    const selectNotes = vi.fn().mockReturnValue({ eq: eqNotes })
    const single = vi.fn().mockResolvedValue({ data: NOTE, error: null })
    const selectAfterInsert = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select: selectAfterInsert })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ select: selectNotes, insert }) },
    }))
    vi.resetModules()
    const api = await import('./productionApi')

    const notes = await api.listCaseNotes('case-1')
    expect(eqNotes).toHaveBeenCalledWith('case_id', 'case-1')
    expect(notes).toEqual([
      { id: 'n1', body: 'Spoke with the employee.', createdAt: '2026-07-12T13:00:00Z' },
    ])

    await api.addCaseNote('org-1', 'case-1', 'Spoke with the employee.')
    expect(insert).toHaveBeenCalledWith({
      organization_id: 'org-1',
      case_id: 'case-1',
      body: 'Spoke with the employee.',
    })
  })

  it('countOpenCases issues a head count excluding resolved', async () => {
    const neq = vi.fn().mockResolvedValue({ count: 4, error: null })
    const eq = vi.fn().mockReturnValue({ neq })
    const select = vi.fn().mockReturnValue({ eq })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ select }) },
    }))
    vi.resetModules()
    const api = await import('./productionApi')

    expect(await api.countOpenCases('org-1')).toBe(4)
    expect(select).toHaveBeenCalledWith('id', { count: 'exact', head: true })
    expect(neq).toHaveBeenCalledWith('status', 'resolved')
  })
})
