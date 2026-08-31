import { afterEach, describe, expect, it, vi } from 'vitest'
import { listChain } from '@/test/productionWorkspace'

/** Same per-test client mock + fresh import pattern as workspaceMode/api.test.ts. */
describe('employees productionApi', () => {
  afterEach(() => {
    vi.doUnmock('@/lib/supabaseClient')
    vi.resetModules()
  })

  const ROW = {
    id: 'emp-1',
    name: 'Ana Souza',
    title: 'Coordinator',
    email: 'ana@dutiva.ca',
    jurisdiction: 'Ontario',
    start_date: '2026-07-02',
    status: 'active',
    manager_id: 'emp-2',
    manager: { name: 'Jordan Mensah' },
  }

  it('listEmployees returns parsed, camel-cased rows scoped to the org', async () => {
    const order = vi.fn().mockReturnValue(listChain([ROW]))
    const eq = vi.fn().mockReturnValue({ order })
    const select = vi.fn().mockReturnValue({ eq })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ select }) },
    }))
    vi.resetModules()
    const api = await import('./productionApi')

    const rows = await api.listEmployees('org-1')
    expect(eq).toHaveBeenCalledWith('organization_id', 'org-1')
    expect(rows).toEqual([
      {
        id: 'emp-1',
        name: 'Ana Souza',
        title: 'Coordinator',
        email: 'ana@dutiva.ca',
        jurisdiction: 'Ontario',
        startDate: '2026-07-02',
        status: 'active',
        probationEndDate: null,
        terminationDate: null,
        managerId: 'emp-2',
        managerName: 'Jordan Mensah',
      },
    ])
  })

  it('productionLineManagerLabel returns unknown when manager is unset', async () => {
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn() },
    }))
    vi.resetModules()
    const api = await import('./productionApi')
    expect(api.productionLineManagerLabel({ managerName: null })).toBe('—')
    expect(api.productionLineManagerLabel({ managerName: 'Jordan Mensah' })).toBe('Jordan Mensah')
  })

  it('listEmployees throws (not silently empties) when the read fails', async () => {
    const order = vi.fn().mockReturnValue(listChain([], new Error('rls')))
    const eq = vi.fn().mockReturnValue({ order })
    const select = vi.fn().mockReturnValue({ eq })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ select }) },
    }))
    vi.resetModules()
    const api = await import('./productionApi')

    await expect(api.listEmployees('org-1')).rejects.toThrow()
  })

  it('addEmployee inserts with the org id and nulls out empty optionals', async () => {
    const single = vi.fn().mockResolvedValue({ data: ROW, error: null })
    const select = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ insert }) },
    }))
    vi.resetModules()
    const api = await import('./productionApi')

    const added = await api.addEmployee('org-1', {
      name: 'Ana Souza',
      title: 'Coordinator',
      email: '',
      jurisdiction: 'Ontario',
      startDate: '',
    })
    expect(insert).toHaveBeenCalledWith({
      organization_id: 'org-1',
      name: 'Ana Souza',
      title: 'Coordinator',
      email: null,
      jurisdiction: 'Ontario',
      start_date: null,
    })
    expect(added.name).toBe('Ana Souza')
  })

  it('removeEmployee deletes by id and throws on failure', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const del = vi.fn().mockReturnValue({ eq })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ delete: del }) },
    }))
    vi.resetModules()
    const api = await import('./productionApi')

    await api.removeEmployee('emp-1')
    expect(eq).toHaveBeenCalledWith('id', 'emp-1')
  })

  it('getEmployee returns null for a missing id', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    const select = vi.fn().mockReturnValue({ eq })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ select }) },
    }))
    vi.resetModules()
    const api = await import('./productionApi')

    expect(await api.getEmployee('nope')).toBeNull()
  })

  it('updateEmployeeStatus updates by id; notes list/insert use the org + employee ids', async () => {
    const NOTE = {
      id: 'n1',
      body: 'Met for onboarding check-in.',
      created_at: '2026-07-12T13:00:00Z',
    }
    const eqUpdate = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn().mockReturnValue({ eq: eqUpdate })
    const order = vi.fn().mockResolvedValue({ data: [NOTE], error: null })
    const eqNotes = vi.fn().mockReturnValue({ order })
    const selectNotes = vi.fn().mockReturnValue({ eq: eqNotes })
    const single = vi.fn().mockResolvedValue({ data: NOTE, error: null })
    const insert = vi.fn().mockReturnValue({ select: () => ({ single }) })
    vi.doMock('@/lib/supabaseClient', () => ({
      supabase: { from: vi.fn().mockReturnValue({ update, select: selectNotes, insert }) },
    }))
    vi.resetModules()
    const api = await import('./productionApi')

    await api.updateEmployeeStatus('emp-1', 'on_leave')
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ status: 'on_leave' }))
    expect(eqUpdate).toHaveBeenCalledWith('id', 'emp-1')

    const notes = await api.listEmployeeNotes('emp-1')
    expect(eqNotes).toHaveBeenCalledWith('employee_id', 'emp-1')
    expect(notes[0]).toEqual({
      id: 'n1',
      body: 'Met for onboarding check-in.',
      createdAt: '2026-07-12T13:00:00Z',
    })

    await api.addEmployeeNote('org-1', 'emp-1', 'Met for onboarding check-in.')
    expect(insert).toHaveBeenCalledWith({
      organization_id: 'org-1',
      employee_id: 'emp-1',
      body: 'Met for onboarding check-in.',
    })
  })
})
