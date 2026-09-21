import { beforeEach, describe, expect, it } from 'vitest'
import { executeAgentProposal } from '@/features/app/agent/executor'
import { createProposal } from '@/features/app/agent/propose'
import { bindModuleContext, resetModuleContextsForTest } from '@/features/app/agent/runtime'
import type { AgentToolExecution } from '@/features/app/agent/types'
/* Registers the seven security tools on import — the module under test. */
import './agentTools'
import type { SecurityAgentContext } from './agentTools'
import type {
  SecurityAccessReview,
  SecurityIncident,
  SecurityRisk,
  SecurityVendorReview,
} from './data/types'

const DEMO: AgentToolExecution = { mode: 'demo', role: null, organizationId: null }
const PROD_ADMIN: AgentToolExecution = {
  mode: 'production',
  role: 'admin',
  organizationId: 'org-x',
}

const INCIDENT: SecurityIncident = {
  id: 'si-1',
  organization_id: 'org-demo',
  title: 'Suspicious login from unrecognized IP',
  severity: 'medium',
  status: 'contained',
  reported_by: null,
  assigned_to: null,
  reported_at: '2025-08-02T09:00:00Z',
  resolved_at: null,
  summary: null,
  impact: null,
  remediation: null,
  created_by: null,
  created_at: '2025-08-02T09:00:00Z',
  updated_at: '2025-08-02T09:00:00Z',
}

const CLOSED_INCIDENT: SecurityIncident = {
  ...INCIDENT,
  id: 'si-2',
  title: 'Old phishing report',
  status: 'closed',
}

const REVIEW: SecurityAccessReview = {
  id: 'sar-1',
  organization_id: 'org-demo',
  title: 'Q3 admin access review',
  assigned_to: null,
  reviewer_id: null,
  review_due_date: '2099-10-15',
  completed_date: null,
  status: 'pending',
  findings: null,
  created_by: null,
  created_at: '2025-08-02T09:00:00Z',
  updated_at: '2025-08-02T09:00:00Z',
}

const DONE_REVIEW: SecurityAccessReview = {
  ...REVIEW,
  id: 'sar-2',
  title: 'Q2 admin access review',
  status: 'completed',
  completed_date: '2025-06-30',
}

const RISK: SecurityRisk = {
  id: 'sr-1',
  organization_id: 'org-demo',
  title: 'Key vendor has no signed privacy agreement',
  likelihood: 'high',
  impact: 'medium',
  owner: null,
  mitigation: null,
  status: 'open',
  created_at: '2025-08-02T09:00:00Z',
  updated_at: '2025-08-02T09:00:00Z',
}

const VENDOR: SecurityVendorReview = {
  id: 'svr-1',
  organization_id: 'org-demo',
  vendor_name: 'IT Guardians Inc.',
  vendor_type: 'it_security',
  privacy_agreement: false,
  security_review_date: '2024-11-20',
  next_review_date: '2020-11-20',
  notes: null,
  created_at: '2025-08-02T09:00:00Z',
  updated_at: '2025-08-02T09:00:00Z',
}

function bind(overrides: Partial<SecurityAgentContext> = {}) {
  const ctx: SecurityAgentContext = {
    incidents: () => [INCIDENT, CLOSED_INCIDENT],
    risks: () => [RISK],
    vendorReviews: () => [VENDOR],
    accessReviews: () => [REVIEW, DONE_REVIEW],
    addIncident: () => {},
    updateIncident: () => {},
    updateAccessReview: () => {},
    ...overrides,
  }
  bindModuleContext('security', ctx)
  return ctx
}

beforeEach(() => {
  resetModuleContextsForTest()
})

describe('security agent tools — reads', () => {
  it('lists non-closed incidents by default', async () => {
    bind()
    const { outcome: out } = await executeAgentProposal(
      createProposal('security.incidents', { en: 'x', fr: 'x' }, {}),
      DEMO,
    )
    expect(out.status).toBe('completed')
    expect(out.message.en).toContain('Suspicious login')
    expect(out.message.en).not.toContain('Old phishing report')
    expect(out.message.fr).toContain('contenu')
  })

  it('filters incidents by status', async () => {
    bind()
    const { outcome: out } = await executeAgentProposal(
      createProposal('security.incidents', { en: 'x', fr: 'x' }, { status: 'closed' }),
      DEMO,
    )
    expect(out.status).toBe('completed')
    expect(out.message.en).toContain('Old phishing report')
    expect(out.message.en).not.toContain('Suspicious login')
  })

  it('lists open risks with likelihood/impact', async () => {
    bind()
    const { outcome: out } = await executeAgentProposal(
      createProposal('security.risks', { en: 'x', fr: 'x' }, {}),
      DEMO,
    )
    expect(out.status).toBe('completed')
    expect(out.message.en).toContain('privacy agreement')
    expect(out.message.en).toContain('high/medium')
  })

  it('lists vendor reviews and flags overdue + missing agreement', async () => {
    bind()
    const { outcome: out } = await executeAgentProposal(
      createProposal('security.vendor_reviews', { en: 'x', fr: 'x' }, {}),
      DEMO,
    )
    expect(out.status).toBe('completed')
    expect(out.message.en).toContain('IT Guardians Inc.')
    expect(out.message.en).toContain('no privacy agreement')
    expect(out.message.en).toContain('⚠')
    expect(out.message.fr).toContain('aucune entente')
  })

  it('lists only open access reviews', async () => {
    bind()
    const { outcome: out } = await executeAgentProposal(
      createProposal('security.access_reviews', { en: 'x', fr: 'x' }, {}),
      DEMO,
    )
    expect(out.status).toBe('completed')
    expect(out.message.en).toContain('Q3 admin access review')
    expect(out.message.en).not.toContain('Q2 admin access review')
  })

  it('fails honestly when no security context is bound', async () => {
    const { outcome: out } = await executeAgentProposal(
      createProposal('security.incidents', { en: 'x', fr: 'x' }, {}),
      DEMO,
    )
    expect(out.status).toBe('failed')
    expect(out.status === 'failed' && out.code).toBe('module_unavailable')
  })
})

describe('security.report_incident', () => {
  it('logs an open incident with a default medium severity', async () => {
    let added: SecurityIncident | undefined
    bind({ addIncident: (i) => void (added = i) })
    const { outcome: out } = await executeAgentProposal(
      createProposal(
        'security.report_incident',
        { en: 'x', fr: 'x' },
        { title: 'Stolen laptop reported' },
      ),
      DEMO,
    )
    expect(out.status).toBe('completed')
    expect(out.message.en).toContain('Incident logged')
    expect(out.message.en).toContain('Stolen laptop reported')
    expect(added?.status).toBe('open')
    expect(added?.severity).toBe('medium')
  })

  it('carries an explicit severity and localizes it in FR', async () => {
    let added: SecurityIncident | undefined
    bind({ addIncident: (i) => void (added = i) })
    const { outcome: out } = await executeAgentProposal(
      createProposal(
        'security.report_incident',
        { en: 'x', fr: 'x' },
        { title: 'Ransomware attempt', severity: 'critical', summary: 'Endpoint flagged it.' },
      ),
      DEMO,
    )
    expect(out.status).toBe('completed')
    expect(added?.severity).toBe('critical')
    expect(added?.summary).toBe('Endpoint flagged it.')
    expect(out.message.fr).toContain('critique')
  })
})

describe('security.resolve_incident', () => {
  it('resolves a contained incident by title match', async () => {
    let updated: SecurityIncident | undefined
    bind({ updateIncident: (i) => void (updated = i) })
    const { outcome: out } = await executeAgentProposal(
      createProposal(
        'security.resolve_incident',
        { en: 'x', fr: 'x' },
        { title: 'suspicious login' },
      ),
      DEMO,
    )
    expect(out.status).toBe('completed')
    expect(out.message.en).toContain('Resolved')
    expect(updated?.status).toBe('resolved')
    expect(updated?.resolved_at).not.toBeNull()
  })

  it('is idempotent on an already-resolved incident', async () => {
    let ran = false
    bind({
      incidents: () => [{ ...INCIDENT, status: 'resolved' }],
      updateIncident: () => void (ran = true),
    })
    const { outcome: out } = await executeAgentProposal(
      createProposal(
        'security.resolve_incident',
        { en: 'x', fr: 'x' },
        { title: 'suspicious login' },
      ),
      DEMO,
    )
    expect(out.status).toBe('completed')
    expect(out.message.en).toContain('Already resolved')
    expect(ran).toBe(false)
  })

  it('refuses a closed incident', async () => {
    let ran = false
    bind({ updateIncident: () => void (ran = true) })
    const { outcome: out } = await executeAgentProposal(
      createProposal('security.resolve_incident', { en: 'x', fr: 'x' }, { title: 'old phishing' }),
      DEMO,
    )
    expect(out.status).toBe('failed')
    expect(out.status === 'failed' && out.code).toBe('invalid_params')
    expect(ran).toBe(false)
  })

  it('fails on an unmatched title', async () => {
    bind()
    const { outcome: out } = await executeAgentProposal(
      createProposal(
        'security.resolve_incident',
        { en: 'x', fr: 'x' },
        { title: 'no such incident' },
      ),
      DEMO,
    )
    expect(out.status).toBe('failed')
    expect(out.status === 'failed' && out.code).toBe('invalid_params')
  })
})

describe('security.complete_access_review', () => {
  it('completes a pending access review by title match', async () => {
    let updated: SecurityAccessReview | undefined
    bind({ updateAccessReview: (r) => void (updated = r) })
    const { outcome: out } = await executeAgentProposal(
      createProposal(
        'security.complete_access_review',
        { en: 'x', fr: 'x' },
        { title: 'q3 admin' },
      ),
      DEMO,
    )
    expect(out.status).toBe('completed')
    expect(out.message.en).toContain('Access review completed')
    expect(updated?.status).toBe('completed')
    expect(updated?.completed_date).not.toBeNull()
  })

  it('is idempotent on an already-completed review', async () => {
    let ran = false
    bind({ updateAccessReview: () => void (ran = true) })
    const { outcome: out } = await executeAgentProposal(
      createProposal(
        'security.complete_access_review',
        { en: 'x', fr: 'x' },
        { title: 'q2 admin' },
      ),
      DEMO,
    )
    expect(out.status).toBe('completed')
    expect(out.message.en).toContain('Already completed')
    expect(ran).toBe(false)
  })

  it('fails on an unmatched title', async () => {
    bind()
    const { outcome: out } = await executeAgentProposal(
      createProposal(
        'security.complete_access_review',
        { en: 'x', fr: 'x' },
        { title: 'no such review' },
      ),
      DEMO,
    )
    expect(out.status).toBe('failed')
    expect(out.status === 'failed' && out.code).toBe('invalid_params')
  })
})

describe('security agent tools — role floor', () => {
  it('refuses a commit for a member role in production (admin floor)', async () => {
    bind()
    const { outcome: out } = await executeAgentProposal(
      createProposal(
        'security.report_incident',
        { en: 'x', fr: 'x' },
        { title: 'Ransomware attempt' },
      ),
      { mode: 'production', role: 'member', organizationId: 'org-x' },
    )
    expect(out.status).toBe('failed')
    expect(out.status === 'failed' && out.code).toBe('forbidden')
  })

  it('lets an admin through the commit gate', async () => {
    let added: SecurityIncident | undefined
    bind({ addIncident: (i) => void (added = i) })
    const { outcome: out } = await executeAgentProposal(
      createProposal(
        'security.report_incident',
        { en: 'x', fr: 'x' },
        { title: 'Ransomware attempt' },
      ),
      PROD_ADMIN,
    )
    expect(out.status).toBe('completed')
    expect(added?.title).toBe('Ransomware attempt')
  })
})
