import { describe, expect, it, vi, beforeEach } from 'vitest'
import { buildProductionSearchEntries, pinnedProductionChats } from './searchProductionCorpus'

vi.mock('@/features/app/views/employees/productionApi', () => ({
  listEmployees: vi.fn(async () => [
    { id: 'e1', name: 'Alex Chen', title: 'HR Manager', province: 'ON', email: null, startDate: null, status: 'active', probationEndDate: null, terminationDate: null },
  ]),
}))

vi.mock('@/features/app/views/cases/productionApi', () => ({
  listCases: vi.fn(async () => [
    {
      id: 'c1',
      title: 'Probation review',
      caseType: 'Performance',
      employeeId: 'e1',
      province: 'ON',
      status: 'open',
      dueDate: '2026-09-01',
      createdAt: '2026-08-01T00:00:00Z',
    },
  ]),
}))

vi.mock('@/features/app/views/memory/conversationsApi', () => ({
  listOwnConversations: vi.fn(async () => [
    {
      id: 'chat-1',
      messages: [{ role: 'user', content: 'What is the notice period?' }],
      createdAt: '2026-08-01',
    },
  ]),
}))

vi.mock('@/features/app/documents/productionApi', () => ({
  listDocuments: vi.fn(async () => [
    {
      id: 'doc-1',
      ref: 'DOC-001',
      title: { en: 'Termination letter', fr: 'Lettre de cessation' },
      templateTid: 'T03',
      templateKey: 'termination',
      templateVersion: '1',
      employeeId: 'e1',
      caseId: null,
      jurisdiction: 'ON',
      language: 'en',
      status: 'draft',
      signatureStatus: 'none',
      reviewStatus: 'not_reviewed',
      risk: 'high',
      answers: {},
      currentVersion: 1,
      archivedAt: null,
      createdAt: '2026-08-01',
      updatedAt: '2026-08-01',
    },
  ]),
}))

vi.mock('@/features/app/views/communications/productionApi', () => ({
  listCommunications: vi.fn(async () => [
    { id: 'cm1', title: 'All-hands update', audience: 'All staff', status: 'draft' },
  ]),
}))

vi.mock('@/features/app/views/tasks/productionApi', () => ({
  listTasks: vi.fn(async () => [
    { id: 't1', title: 'Review policy', priority: 'medium', status: 'open', done: false, category: 'general', dueDate: '2026-09-15', linkedEmployeeId: null, linkedKind: null },
  ]),
}))

vi.mock('@/features/app/views/compliance/productionApi', () => ({
  listFindings: vi.fn(async () => [
    { id: 'f1', title: 'Missing policy review', description: null, recommendation: null, severity: 'medium', status: 'open', resolved: false },
  ]),
}))

vi.mock('@/features/app/views/policies/productionApi', () => ({
  listPolicies: vi.fn(async () => [
    { id: 'p1', name: 'Remote work', status: 'needs_review', lastReviewed: '2025-01-01' },
  ]),
}))

describe('buildProductionSearchEntries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('maps live org rows into searchable entries with correct nav targets', async () => {
    const entries = await buildProductionSearchEntries('org-1')
    const byId = new Map(entries.map((e) => [e.id, e]))

    expect(byId.get('emp-e1')?.nav).toEqual({ kind: 'employee', employeeId: 'e1' })
    expect(byId.get('case-c1')?.nav).toEqual({ kind: 'case', caseId: 'c1' })
    expect(byId.get('chat-1')?.nav).toEqual({ kind: 'chat', chatId: 'chat-1' })
    expect(byId.get('gen-doc-1')?.nav).toEqual({ kind: 'generatedDocument', docId: 'doc-1' })
    expect(byId.get('doc-T03')?.nav).toEqual({ kind: 'document', docKey: 'T03' })
  })

  it('includes knowledge and template catalogue entries', async () => {
    const entries = await buildProductionSearchEntries('org-1')
    expect(entries.some((e) => e.kind === 'knowledge')).toBe(true)
    expect(entries.some((e) => e.id.startsWith('doc-T'))).toBe(true)
  })
})

describe('pinnedProductionChats', () => {
  it('returns up to three chat entries labelled as pinned', async () => {
    const entries = await buildProductionSearchEntries('org-1')
    const pinned = pinnedProductionChats(entries)
    expect(pinned.length).toBeGreaterThan(0)
    expect(pinned.every((e) => e.kind === 'chat')).toBe(true)
  })
})
