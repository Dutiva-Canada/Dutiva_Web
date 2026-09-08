import { describe, expect, it, vi, beforeEach } from 'vitest'
import { buildProductionSearchEntries, pinnedProductionChats } from './searchProductionCorpus'

vi.mock('@/features/app/views/employees/productionApi', () => ({
  listEmployees: vi.fn(async () => [
    {
      id: 'e1',
      name: 'Alex Chen',
      title: 'HR Manager',
      jurisdiction: 'ON',
      email: null,
      startDate: null,
      status: 'active',
      probationEndDate: null,
      terminationDate: null,
    },
  ]),
}))

vi.mock('@/features/app/views/cases/productionApi', () => ({
  listCases: vi.fn(async () => [
    {
      id: 'c1',
      title: 'Probation review',
      caseType: 'Performance',
      employeeId: 'e1',
      jurisdiction: 'ON',
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

vi.mock('@/features/app/views/comms/data/segmentsApi', () => ({
  listSegments: vi.fn(async () => [
    {
      id: 'sg1',
      name: { en: 'Tier-1 Media', fr: 'Médias de premier plan' },
      description: { en: 'Top outlets', fr: 'Meilleurs médias' },
      createdAt: '2026-09-08T10:00:00Z',
      updatedAt: '2026-09-08T10:00:00Z',
    },
  ]),
}))

vi.mock('@/features/app/views/comms/data/stakeholdersApi', () => ({
  listContacts: vi.fn(async () => [
    {
      id: 'cc1',
      name: 'Samira Okonkwo',
      type: 'media',
      role: { en: 'Editor, Canadian HR Reporter', fr: 'Rédactrice, Canadian HR Reporter' },
      active: true,
    },
  ]),
}))

vi.mock('@/features/app/views/tasks/productionApi', () => ({
  listTasks: vi.fn(async () => [
    {
      id: 't1',
      title: 'Review policy',
      priority: 'medium',
      status: 'open',
      done: false,
      category: 'general',
      dueDate: '2026-09-15',
      linkedEmployeeId: null,
      linkedKind: null,
    },
  ]),
}))

vi.mock('@/features/app/views/compliance/productionApi', () => ({
  listFindings: vi.fn(async () => [
    {
      id: 'f1',
      title: 'Missing policy review',
      description: null,
      recommendation: null,
      severity: 'medium',
      status: 'open',
      resolved: false,
    },
  ]),
}))

vi.mock('@/features/app/views/policies/productionApi', () => ({
  listPolicies: vi.fn(async () => [
    { id: 'p1', name: 'Remote work', status: 'needs_review', lastReviewed: '2025-01-01' },
  ]),
}))

vi.mock('@/features/app/views/security/data/productionApi', () => ({
  listSecurityAssets: vi.fn(async () => [
    {
      id: 'sa1',
      organization_id: 'org-1',
      name: 'Laptop',
      asset_type: 'hardware',
      owner_id: null,
      status: 'active',
      criticality: 'high',
      renewal_date: null,
      notes: null,
      created_at: '2026-08-01',
      updated_at: '2026-08-01',
    },
  ]),
  listSecurityIncidents: vi.fn(async () => [
    {
      id: 'si1',
      organization_id: 'org-1',
      title: 'Phishing',
      severity: 'medium',
      status: 'open',
      reported_by: null,
      assigned_to: null,
      reported_at: '2026-08-01',
      resolved_at: null,
      summary: null,
      impact: null,
      remediation: null,
      created_by: null,
      created_at: '2026-08-01',
      updated_at: '2026-08-01',
    },
  ]),
  listSecurityRisks: vi.fn(async () => [
    {
      id: 'sr1',
      organization_id: 'org-1',
      title: 'Data loss',
      likelihood: 'low',
      impact: 'high',
      owner: null,
      mitigation: null,
      status: 'open',
      created_at: '2026-08-01',
      updated_at: '2026-08-01',
    },
  ]),
}))

vi.mock('@/features/app/views/operations/data/productionApi', () => ({
  listOperationsProjects: vi.fn(async () => [
    {
      id: 'op1',
      organization_id: 'org-1',
      title: 'Warehouse expansion',
      owner_id: null,
      status: 'active',
      start_date: null,
      target_date: null,
      description: null,
      created_at: '2026-08-01',
      updated_at: '2026-08-01',
    },
  ]),
  listOperationsVendors: vi.fn(async () => [
    {
      id: 'ov1',
      organization_id: 'org-1',
      finance_party_id: null,
      name: 'Acme Supply',
      vendor_type: 'supplier',
      status: 'active',
      contract_expiry: null,
      notes: null,
      created_at: '2026-08-01',
      updated_at: '2026-08-01',
    },
  ]),
  listOperationsQualityChecks: vi.fn(async () => [
    {
      id: 'oq1',
      organization_id: 'org-1',
      title: 'Inbound inspection',
      assigned_to: null,
      reviewer_id: null,
      checklist: [],
      due_date: '2026-09-01',
      completed_date: null,
      status: 'pending',
      non_conformance: null,
      created_by: null,
      created_at: '2026-08-01',
      updated_at: '2026-08-01',
    },
  ]),
  listOperationsTechnology: vi.fn(async () => [
    {
      id: 'ot1',
      organization_id: 'org-1',
      name: 'WMS platform',
      system_type: 'internal',
      owner_id: null,
      status: 'active',
      renewal_date: null,
      integration_notes: null,
      created_at: '2026-08-01',
      updated_at: '2026-08-01',
    },
  ]),
  listOperationsLogistics: vi.fn(async () => [
    {
      id: 'ol1',
      organization_id: 'org-1',
      title: 'Parts shipment',
      owner_id: null,
      assigned_to: null,
      status: 'in_transit',
      expected_date: null,
      delivered_date: null,
      notes: null,
      created_by: null,
      created_at: '2026-08-01',
      updated_at: '2026-08-01',
    },
  ]),
}))

vi.mock('@/features/app/views/governance/data/productionApi', () => ({
  listGovernanceRecords: vi.fn(async () => [
    {
      id: 'gr1',
      organization_id: 'org-1',
      title: 'Articles of incorporation',
      record_type: 'articles',
      jurisdiction: 'ON',
      effective_date: null,
      review_due_date: null,
      status: 'active',
      viewer_visible: true,
      document_id: null,
      created_by: null,
      created_at: '2026-08-01',
      updated_at: '2026-08-01',
    },
  ]),
  listGovernanceDecisions: vi.fn(async () => [
    {
      id: 'gd1',
      organization_id: 'org-1',
      title: 'Adopt remote work policy',
      decision_date: '2026-08-01',
      decided_by: null,
      rationale: null,
      status: 'adopted',
      viewer_visible: true,
      related_record_id: null,
      created_by: null,
      created_at: '2026-08-01',
      updated_at: '2026-08-01',
    },
  ]),
  listGovernanceOfficers: vi.fn(async () => [
    {
      id: 'go1',
      organization_id: 'org-1',
      name: 'Jordan Lee',
      role: 'director',
      appointed_date: null,
      resigned_date: null,
      contact_email: null,
      is_active: true,
      viewer_visible: true,
      created_at: '2026-08-01',
      updated_at: '2026-08-01',
    },
  ]),
  listGovernanceShareholders: vi.fn(async () => [
    {
      id: 'gs1',
      organization_id: 'org-1',
      name: 'Northgate Holdings',
      share_class: 'Common',
      shares_issued: 1000,
      issue_date: null,
      contact_email: null,
      viewer_visible: true,
      created_at: '2026-08-01',
      updated_at: '2026-08-01',
    },
  ]),
}))

vi.mock('@/features/app/views/revenue/data/productionApi', () => ({
  listRevenueStreams: vi.fn(async () => [
    {
      id: 'rs1',
      organization_id: 'org-1',
      name: 'Monthly retainer',
      stream_type: 'recurring',
      status: 'active',
      amount: 5000,
      currency: 'CAD',
      frequency: 'monthly',
      start_date: null,
      end_date: null,
      notes: null,
      created_at: '2026-08-01',
      updated_at: '2026-08-01',
    },
  ]),
  listRevenueInvoices: vi.fn(async () => [
    {
      id: 'ri1',
      organization_id: 'org-1',
      stream_id: null,
      customer_name: 'Northgate Logistics Inc.',
      amount: 5000,
      currency: 'CAD',
      status: 'sent',
      issue_date: '2026-08-01',
      due_date: '2026-08-31',
      paid_date: null,
      notes: null,
      created_at: '2026-08-01',
      updated_at: '2026-08-01',
    },
  ]),
}))

vi.mock('@/features/app/views/specialists/data/productionApi', () => ({
  listSpecialists: vi.fn(async () => [
    {
      id: 'sp1',
      organization_id: 'org-1',
      name: 'Jean-Marc Lefebvre',
      specialty: 'lawyer',
      company: 'Drolet & Associés',
      email: null,
      phone: null,
      crm_contact_id: null,
      finance_party_id: null,
      workspace_access: false,
      workspace_role: 'consultant',
      granted_modules: [],
      access_expires_at: null,
      organization_member_id: null,
      notes: null,
      created_at: '2026-08-01',
      updated_at: '2026-08-01',
    },
  ]),
  listSpecialistEngagements: vi.fn(async () => [
    {
      id: 'se1',
      organization_id: 'org-1',
      specialist_id: 'sp1',
      engagement_date: '2026-08-15',
      engagement_type: 'call',
      summary: 'Initial contract review.',
      follow_up_date: null,
      created_by: null,
      created_at: '2026-08-01',
      updated_at: '2026-08-01',
    },
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
    expect(byId.get('seg-sg1')?.nav).toEqual({ kind: 'view', view: 'comms/segments' })
    expect(byId.get('comm-contact-cc1')?.nav).toEqual({
      kind: 'view',
      view: 'comms/relationships',
    })
    expect(byId.get('seg-sg1')?.title.en).toBe('Tier-1 Media')
    expect(byId.get('comm-contact-cc1')?.title.en).toBe('Samira Okonkwo')
    expect(byId.get('gov-record-gr1')?.nav).toEqual({ kind: 'view', view: 'governance/records' })
    expect(byId.get('gov-decision-gd1')?.nav).toEqual({
      kind: 'view',
      view: 'governance/decisions',
    })
    expect(byId.get('gov-officer-go1')?.nav).toEqual({ kind: 'view', view: 'governance/officers' })
    expect(byId.get('gov-shareholder-gs1')?.nav).toEqual({
      kind: 'view',
      view: 'governance/shareholders',
    })
    expect(byId.get('rev-stream-rs1')?.nav).toEqual({ kind: 'view', view: 'revenue/streams' })
    expect(byId.get('rev-invoice-ri1')?.nav).toEqual({ kind: 'view', view: 'revenue/invoices' })
    expect(byId.get('mod-specialists')?.nav).toEqual({ kind: 'view', view: 'specialists/overview' })
    expect(byId.get('spec-sp1')?.nav).toEqual({ kind: 'view', view: 'specialists/directory' })
    expect(byId.get('spec-eng-se1')?.nav).toEqual({ kind: 'view', view: 'specialists/engagements' })
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
