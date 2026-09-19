import { beforeEach, describe, expect, it } from 'vitest'
import { executeAgentProposal } from '@/features/app/agent/executor'
import { createProposal } from '@/features/app/agent/propose'
import { bindModuleContext, resetModuleContextsForTest } from '@/features/app/agent/runtime'
import type { AgentToolExecution } from '@/features/app/agent/types'
/* Registers the five documents tools on import — the module under test. */
import './agentTools'
import type { DocAgentRow, DocumentsAgentContext, TemplateAgentRow } from './agentTools'

const DEMO: AgentToolExecution = { mode: 'demo', role: null, organizationId: null }

const DOCS: DocAgentRow[] = [
  {
    id: 'd-1',
    ref: 'DOC-2026-0142',
    title: 'Employment contract — Chen',
    status: 'approved',
    signatureStatus: 'not_sent',
    awaitingEmails: [],
  },
  {
    id: 'd-2',
    ref: 'DOC-2026-0151',
    title: 'Remote work policy — March update',
    status: 'sent_for_signature',
    signatureStatus: 'sent',
    awaitingEmails: ['jane@northgate.ca'],
  },
  {
    id: 'd-3',
    ref: 'DOC-2026-0138',
    title: 'Confidentiality agreement — Singh',
    status: 'draft',
    signatureStatus: 'not_sent',
    awaitingEmails: [],
  },
]

const TEMPLATES: TemplateAgentRow[] = [
  { tid: 'T01', key: 'employment_contract', title: 'Employment contract', category: 'contracts' },
  { tid: 'T02', key: 'remote_work_policy', title: 'Remote work policy', category: 'policies' },
]

function bind(overrides: Partial<DocumentsAgentContext> = {}) {
  const ctx: DocumentsAgentContext = {
    documents: () => DOCS,
    templates: () => TEMPLATES,
    approve: () => {},
    sendForSignature: () => {},
    ...overrides,
  }
  bindModuleContext('documents', ctx)
  return ctx
}

beforeEach(() => {
  resetModuleContextsForTest()
})

describe('documents agent tools — reads', () => {
  it('lists documents and flags the one out for signature', async () => {
    bind()
    const { outcome: out } = await executeAgentProposal(
      createProposal('documents.list', { en: 'x', fr: 'x' }, {}),
      DEMO,
    )
    expect(out.status).toBe('completed')
    expect(out.message.en).toContain('DOC-2026-0142')
    expect(out.message.en).toContain('Employment contract — Chen')
    expect(out.message.en).toContain('⚠')
    expect(out.message.fr).toContain('envoyé pour signature')
  })

  it('filters documents by status', async () => {
    bind()
    const { outcome: out } = await executeAgentProposal(
      createProposal('documents.list', { en: 'x', fr: 'x' }, { status: 'draft' }),
      DEMO,
    )
    expect(out.status).toBe('completed')
    expect(out.message.en).toContain('Confidentiality agreement')
    expect(out.message.en).not.toContain('Employment contract')
  })

  it('lists templates with a match filter', async () => {
    bind()
    const { outcome: out } = await executeAgentProposal(
      createProposal('documents.templates', { en: 'x', fr: 'x' }, { match: 'policy' }),
      DEMO,
    )
    expect(out.status).toBe('completed')
    expect(out.message.en).toContain('Remote work policy')
    expect(out.message.en).not.toContain('Employment contract')
  })

  it('lists the signature queue with unsigned recipients', async () => {
    bind()
    const { outcome: out } = await executeAgentProposal(
      createProposal('documents.pending_signatures', { en: 'x', fr: 'x' }, {}),
      DEMO,
    )
    expect(out.status).toBe('completed')
    expect(out.message.en).toContain('DOC-2026-0151')
    expect(out.message.en).toContain('jane@northgate.ca')
    expect(out.message.en).not.toContain('DOC-2026-0142')
  })

  it('fails honestly when no documents context is bound', async () => {
    const { outcome: out } = await executeAgentProposal(
      createProposal('documents.list', { en: 'x', fr: 'x' }, {}),
      DEMO,
    )
    expect(out.status).toBe('failed')
    expect(out.status === 'failed' && out.code).toBe('module_unavailable')
  })
})

describe('documents.approve', () => {
  it('approves a draft by title match', async () => {
    let approved: string | undefined
    bind({ approve: (id) => void (approved = id) })
    const { outcome: out } = await executeAgentProposal(
      createProposal(
        'documents.approve',
        { en: 'x', fr: 'x' },
        { title: 'confidentiality agreement' },
      ),
      DEMO,
    )
    expect(out.status).toBe('completed')
    expect(out.message.en).toContain('Approved')
    expect(out.message.en).toContain('DOC-2026-0138')
    expect(approved).toBe('d-3')
  })

  it('is idempotent on an already-approved document', async () => {
    let ran = false
    bind({ approve: () => void (ran = true) })
    const { outcome: out } = await executeAgentProposal(
      createProposal('documents.approve', { en: 'x', fr: 'x' }, { title: 'employment contract' }),
      DEMO,
    )
    expect(out.status).toBe('completed')
    expect(out.message.en).toContain('Already approved')
    expect(ran).toBe(false)
  })

  it('refuses a document already sent for signature', async () => {
    let ran = false
    bind({ approve: () => void (ran = true) })
    const { outcome: out } = await executeAgentProposal(
      createProposal('documents.approve', { en: 'x', fr: 'x' }, { title: 'remote work policy' }),
      DEMO,
    )
    expect(out.status).toBe('failed')
    expect(out.status === 'failed' && out.code).toBe('invalid_params')
    expect(ran).toBe(false)
  })

  it('matches by reference as well as title', async () => {
    let approved: string | undefined
    bind({ approve: (id) => void (approved = id) })
    const { outcome: out } = await executeAgentProposal(
      createProposal('documents.approve', { en: 'x', fr: 'x' }, { title: 'doc-2026-0138' }),
      DEMO,
    )
    expect(out.status).toBe('completed')
    expect(approved).toBe('d-3')
  })

  it('fails on an unmatched title', async () => {
    bind()
    const { outcome: out } = await executeAgentProposal(
      createProposal('documents.approve', { en: 'x', fr: 'x' }, { title: 'no such doc' }),
      DEMO,
    )
    expect(out.status).toBe('failed')
    expect(out.status === 'failed' && out.code).toBe('invalid_params')
  })

  it('fails honestly in demo when no approve mutator is bound', async () => {
    bind({ approve: undefined })
    const { outcome: out } = await executeAgentProposal(
      createProposal('documents.approve', { en: 'x', fr: 'x' }, { title: 'confidentiality' }),
      DEMO,
    )
    expect(out.status).toBe('failed')
    expect(out.status === 'failed' && out.code).toBe('module_unavailable')
  })
})

describe('documents.send_for_signature', () => {
  it('sends an approved document to one recipient', async () => {
    let sent: { docId: string; name: string; email: string } | undefined
    bind({
      sendForSignature: (docId, r) => void (sent = { docId, name: r.name, email: r.email }),
    })
    const { outcome: out } = await executeAgentProposal(
      createProposal(
        'documents.send_for_signature',
        { en: 'x', fr: 'x' },
        { title: 'employment contract', email: 'jane@northgate.ca', name: 'Jane Doe' },
      ),
      DEMO,
    )
    expect(out.status).toBe('completed')
    expect(out.message.en).toContain('Sent for signature')
    expect(out.message.en).toContain('Jane Doe <jane@northgate.ca>')
    expect(sent).toEqual({ docId: 'd-1', name: 'Jane Doe', email: 'jane@northgate.ca' })
  })

  it('defaults the recipient name to the email’s first part', async () => {
    let sent: { docId: string; name: string; email: string } | undefined
    bind({
      sendForSignature: (docId, r) => void (sent = { docId, name: r.name, email: r.email }),
    })
    const { outcome: out } = await executeAgentProposal(
      createProposal(
        'documents.send_for_signature',
        { en: 'x', fr: 'x' },
        { title: 'employment contract', email: 'jane@northgate.ca' },
      ),
      DEMO,
    )
    expect(out.status).toBe('completed')
    expect(sent?.name).toBe('jane')
  })

  it('refuses a document that isn’t approved yet', async () => {
    let ran = false
    bind({ sendForSignature: () => void (ran = true) })
    const { outcome: out } = await executeAgentProposal(
      createProposal(
        'documents.send_for_signature',
        { en: 'x', fr: 'x' },
        { title: 'confidentiality agreement', email: 'a@b.co' },
      ),
      DEMO,
    )
    expect(out.status).toBe('failed')
    expect(out.status === 'failed' && out.code).toBe('invalid_params')
    expect(out.message.en).toContain('approved')
    expect(ran).toBe(false)
  })

  it('refuses a document with an existing envelope', async () => {
    let ran = false
    bind({ sendForSignature: () => void (ran = true) })
    const { outcome: out } = await executeAgentProposal(
      createProposal(
        'documents.send_for_signature',
        { en: 'x', fr: 'x' },
        { title: 'remote work policy', email: 'a@b.co' },
      ),
      DEMO,
    )
    expect(out.status).toBe('failed')
    expect(out.status === 'failed' && out.code).toBe('invalid_params')
    expect(ran).toBe(false)
  })

  it('rejects a malformed email', async () => {
    let ran = false
    bind({ sendForSignature: () => void (ran = true) })
    const { outcome: out } = await executeAgentProposal(
      createProposal(
        'documents.send_for_signature',
        { en: 'x', fr: 'x' },
        { title: 'employment contract', email: 'not-an-email' },
      ),
      DEMO,
    )
    expect(out.status).toBe('failed')
    expect(out.status === 'failed' && out.code).toBe('invalid_params')
    expect(ran).toBe(false)
  })

  it('fails honestly when no send path is bound', async () => {
    bind({ sendForSignature: undefined })
    const { outcome: out } = await executeAgentProposal(
      createProposal(
        'documents.send_for_signature',
        { en: 'x', fr: 'x' },
        { title: 'employment contract', email: 'a@b.co' },
      ),
      DEMO,
    )
    expect(out.status).toBe('failed')
    expect(out.status === 'failed' && out.code).toBe('module_unavailable')
  })
})

describe('documents agent tools — role floor', () => {
  it('refuses a commit for a member role in production (admin floor)', async () => {
    bind()
    const { outcome: out } = await executeAgentProposal(
      createProposal(
        'documents.approve',
        { en: 'x', fr: 'x' },
        { title: 'confidentiality agreement' },
      ),
      { mode: 'production', role: 'member', organizationId: 'org-x' },
    )
    expect(out.status).toBe('failed')
    expect(out.status === 'failed' && out.code).toBe('forbidden')
  })

  it('lets an admin through the commit gate', async () => {
    let approved: string | undefined
    bind({ approve: (id) => void (approved = id) })
    const { outcome: out } = await executeAgentProposal(
      createProposal(
        'documents.approve',
        { en: 'x', fr: 'x' },
        { title: 'confidentiality agreement' },
      ),
      { mode: 'production', role: 'admin', organizationId: 'org-x' },
    )
    expect(out.status).toBe('completed')
    expect(approved).toBe('d-3')
  })
})
