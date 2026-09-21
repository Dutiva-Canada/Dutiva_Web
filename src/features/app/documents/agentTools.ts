import { agentMessages as M } from '@/i18n/messages/agent'
import { defineTool } from '@/features/app/agent/registry'
import { findByName, ok, str } from '@/features/app/agent/match'
import type { AgentToolOutcome } from '@/features/app/agent/types'

/**
 * Documents agent tools — the repository slice of the doclib seam
 * (docs/AGENT_LAYER.md).
 *
 * The module is the product's core surface: template catalogue → generated
 * HR documents → review → signing envelopes. The agent surface is the
 * repository metadata plus two guarded transitions — approve, and send a
 * single-recipient signature request.
 *
 * Two seams, one normalized row shape:
 * - Demo binds `DoclibProvider` state — reads plus the provider's simulated
 *   `sendForSignature` (the same envelope flip the demo Send button does).
 *   There is no demo approve mutator, so `documents.approve` fails with the
 *   capability message rather than writing nothing.
 * - Production binds `RepositoryProductionView` — reads off the loaded
 *   `hr_generated_documents` rows, commits through `productionApi` /
 *   `signatureApi` (real envelopes: external signing invites go out).
 *
 * What is NOT a tool, and why:
 * - `create` / generate — a generated document needs a full template answer
 *   set; params can't express that honestly, so the wizard owns creation.
 * - Multi-recipient envelopes — the single-signer case covers the weekly
 *   ask; ordering several signers stays in the signature modal.
 * - `archive`, `void`, reminders, decline — destructive or signer-owned
 *   transitions; humans run them.
 * - Content reads / exports — document text and signed files stay out of
 *   the transcript; the agent reports metadata, not contents.
 * - `applySignature` — the signer applies their own signature; an agent
 *   signing on someone's behalf would defeat the audit trail.
 * Absence is the enforcement.
 *
 * Both commits are `minRole: 'admin'` — they change a legal document's
 * posture and (in production) send external email.
 */

const MODULE = 'documents'
const moduleLabel = M.agent_docs_module

/** DocStatus ∪ ProductionDocumentStatus — the full lifecycle vocabulary. */
const DOC_STATUSES = [
  'draft',
  'in_review',
  'needs_revision',
  'approved',
  'sent_for_signature',
  'partially_signed',
  'signed',
  'exported',
  'archived',
  'voided',
  'deleted',
] as const
type DocStatusName = (typeof DOC_STATUSES)[number]

const SIGNING_PENDING: readonly string[] = ['sent', 'viewed', 'pending', 'partially_signed']
const NON_APPROVABLE: readonly string[] = [
  'approved',
  'sent_for_signature',
  'partially_signed',
  'signed',
  'exported',
  'archived',
  'voided',
  'deleted',
]

const STATUS_LABEL_FR: Record<DocStatusName, string> = {
  draft: 'brouillon',
  in_review: 'en révision',
  needs_revision: 'à réviser',
  approved: 'approuvé',
  sent_for_signature: 'envoyé pour signature',
  partially_signed: 'partiellement signé',
  signed: 'signé',
  exported: 'exporté',
  archived: 'archivé',
  voided: 'annulé',
  deleted: 'supprimé',
}
const statusLabel = (s: string) => ({
  en: s.replace(/_/g, ' '),
  fr: STATUS_LABEL_FR[s as DocStatusName] ?? s.replace(/_/g, ' '),
})

/** Normalized repository row — the seam both bindings serve. */
export interface DocAgentRow {
  id: string
  ref: string
  /** English title — the deterministic match key (fixture titles are EN). */
  title: string
  status: string
  signatureStatus: string
  /** Emails of recipients who haven't signed (demo seam only). */
  awaitingEmails: readonly string[]
}

export interface TemplateAgentRow {
  tid: string
  key: string
  title: string
  category: string
}

export interface DocumentsAgentContext {
  documents(): readonly DocAgentRow[]
  templates(): readonly TemplateAgentRow[]
  /** Undefined where the mounted seam can't approve (demo has no mutator). */
  approve?(docId: string): unknown
  /** Undefined where no send path exists. Single-recipient envelope. */
  sendForSignature?(docId: string, recipient: { name: string; email: string }): unknown
}

function unavailable(): AgentToolOutcome {
  return { status: 'failed', code: 'module_unavailable', message: M.agent_err_capability_demo }
}

function matchDoc(
  docs: DocumentsAgentContext,
  needle: string | undefined,
): DocAgentRow | undefined {
  const found =
    findByName(docs.documents(), needle, (d) => d.title) ??
    findByName(docs.documents(), needle, (d) => d.ref)
  if (found || !needle) return found
  /* "document DOC-2026-0138" / "contract remote work" — a leading doc noun
     is phrasing, not part of the title. */
  const bare = needle.replace(/^(?:document|doc|letter|contract|agreement|offer|policy)\s+/i, '')
  return bare === needle
    ? undefined
    : (findByName(docs.documents(), bare, (d) => d.title) ??
        findByName(docs.documents(), bare, (d) => d.ref))
}

/**
 * Shared row mapping — demo `GeneratedDoc` and production rows expose the
 * same fields, so both bindings normalize identically.
 */
export function docToAgentRow(d: {
  id: string
  ref: string
  title: { en: string }
  status: string
  signatureStatus: string
  recipients?: readonly { status: string; email: string }[]
}): DocAgentRow {
  return {
    id: d.id,
    ref: d.ref,
    title: d.title.en,
    status: d.status,
    signatureStatus: d.signatureStatus,
    awaitingEmails: (d.recipients ?? []).filter((r) => r.status !== 'signed').map((r) => r.email),
  }
}

/* ── Reads ────────────────────────────────────────────────────────────────── */

defineTool<DocumentsAgentContext>({
  id: 'documents.list',
  module: MODULE,
  moduleLabel,
  tier: 'read',
  label: M.agent_docs_list_label,
  description: M.agent_docs_list_desc,
  params: [
    {
      name: 'status',
      type: 'enum',
      enum: DOC_STATUSES,
      description: M.agent_docs_p_status,
    },
  ],
  run: (docs, params) => {
    const status = str(params, 'status')
    const items = docs.documents().filter((d) => !status || d.status === status)
    if (items.length === 0) {
      return { status: 'completed', message: M.agent_docs_list_none }
    }
    const titles = items.slice(0, 5).map((d) => {
      const flag = SIGNING_PENDING.includes(d.signatureStatus) ? ' ⚠' : ''
      return `${d.ref} — ${d.title} (${statusLabel(d.status).en})${flag}`
    })
    const extra = items.length - titles.length
    return ok({
      en: `${items.length} document${items.length === 1 ? '' : 's'}: ${titles.join(', ')}${extra > 0 ? ` +${extra} more` : ''}.`,
      fr: `${items.length} document${items.length === 1 ? '' : 's'} : ${items
        .slice(0, 5)
        .map(
          (d) =>
            `${d.ref} — ${d.title} (${statusLabel(d.status).fr})${SIGNING_PENDING.includes(d.signatureStatus) ? ' ⚠' : ''}`,
        )
        .join(', ')}${extra > 0 ? ` +${extra} autre${extra === 1 ? '' : 's'}` : ''}.`,
    })
  },
})

defineTool<DocumentsAgentContext>({
  id: 'documents.templates',
  module: MODULE,
  moduleLabel,
  tier: 'read',
  label: M.agent_docs_templates_label,
  description: M.agent_docs_templates_desc,
  params: [
    {
      name: 'match',
      type: 'string',
      description: M.agent_docs_p_match_template,
      maxLength: 160,
    },
  ],
  run: (docs, params) => {
    const needle = (str(params, 'match') ?? '').toLowerCase()
    const items = docs
      .templates()
      .filter(
        (t) =>
          !needle ||
          t.title.toLowerCase().includes(needle) ||
          t.key.toLowerCase().includes(needle) ||
          t.category.toLowerCase().includes(needle),
      )
    if (items.length === 0) {
      return { status: 'completed', message: M.agent_docs_templates_none }
    }
    const titles = items.slice(0, 5).map((t) => `${t.title} (${t.category})`)
    const extra = items.length - titles.length
    return ok({
      en: `${items.length} template${items.length === 1 ? '' : 's'}: ${titles.join(', ')}${extra > 0 ? ` +${extra} more` : ''}.`,
      fr: `${items.length} modèle${items.length === 1 ? '' : 's'} : ${titles.join(', ')}${extra > 0 ? ` +${extra} autre${extra === 1 ? '' : 's'}` : ''}.`,
    })
  },
})

defineTool<DocumentsAgentContext>({
  id: 'documents.pending_signatures',
  module: MODULE,
  moduleLabel,
  tier: 'read',
  label: M.agent_docs_signing_label,
  description: M.agent_docs_signing_desc,
  params: [],
  run: (docs) => {
    const items = docs.documents().filter((d) => SIGNING_PENDING.includes(d.signatureStatus))
    if (items.length === 0) {
      return { status: 'completed', message: M.agent_docs_signing_none }
    }
    const titles = items.slice(0, 5).map((d) => {
      const waiting = d.awaitingEmails.length > 0 ? ` — ${d.awaitingEmails.join(', ')}` : ''
      return `${d.ref} — ${d.title}${waiting}`
    })
    const extra = items.length - titles.length
    return ok({
      en: `${items.length} awaiting signature: ${titles.join(', ')}${extra > 0 ? ` +${extra} more` : ''}.`,
      fr: `${items.length} en attente de signature : ${titles.join(', ')}${extra > 0 ? ` +${extra} autre${extra === 1 ? '' : 's'}` : ''}.`,
    })
  },
})

/* ── Commits ──────────────────────────────────────────────────────────────── */

defineTool<DocumentsAgentContext>({
  id: 'documents.approve',
  module: MODULE,
  moduleLabel,
  tier: 'commit',
  minRole: 'admin',
  label: M.agent_docs_approve_label,
  description: M.agent_docs_approve_desc,
  params: [
    {
      name: 'title',
      type: 'string',
      required: true,
      description: M.agent_docs_p_match_doc,
      maxLength: 200,
    },
  ],
  run: async (docs, params) => {
    if (!docs.approve) return unavailable()
    const doc = matchDoc(docs, str(params, 'title'))
    if (!doc) {
      return { status: 'failed', code: 'invalid_params', message: M.agent_docs_doc_not_found }
    }
    if (doc.status === 'approved') {
      return ok(
        {
          en: `Already approved — ${doc.ref} — ${doc.title}.`,
          fr: `Déjà approuvé — ${doc.ref} — ${doc.title}.`,
        },
        doc.id,
      )
    }
    if (NON_APPROVABLE.includes(doc.status)) {
      return { status: 'failed', code: 'invalid_params', message: M.agent_docs_approve_not_allowed }
    }
    await docs.approve(doc.id)
    return ok(
      {
        en: `Approved — ${doc.ref} — ${doc.title}.`,
        fr: `Approuvé — ${doc.ref} — ${doc.title}.`,
      },
      doc.id,
    )
  },
})

defineTool<DocumentsAgentContext>({
  id: 'documents.send_for_signature',
  module: MODULE,
  moduleLabel,
  tier: 'commit',
  minRole: 'admin',
  label: M.agent_docs_send_label,
  description: M.agent_docs_send_desc,
  params: [
    {
      name: 'title',
      type: 'string',
      required: true,
      description: M.agent_docs_p_match_doc,
      maxLength: 200,
    },
    {
      name: 'email',
      type: 'string',
      required: true,
      description: M.agent_docs_p_email,
      maxLength: 200,
    },
    {
      name: 'name',
      type: 'string',
      description: M.agent_docs_p_name,
      maxLength: 160,
    },
  ],
  run: async (docs, params) => {
    if (!docs.sendForSignature) return unavailable()
    const doc = matchDoc(docs, str(params, 'title'))
    if (!doc) {
      return { status: 'failed', code: 'invalid_params', message: M.agent_docs_doc_not_found }
    }
    const email = str(params, 'email') ?? ''
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { status: 'failed', code: 'invalid_params', message: M.agent_docs_bad_email }
    }
    if (doc.signatureStatus !== 'not_sent') {
      return { status: 'failed', code: 'invalid_params', message: M.agent_docs_send_already_sent }
    }
    if (doc.status !== 'approved') {
      return { status: 'failed', code: 'invalid_params', message: M.agent_docs_send_needs_approved }
    }
    const name = str(params, 'name') ?? email.split('@')[0] ?? email
    await docs.sendForSignature(doc.id, { name, email })
    return ok(
      {
        en: `Sent for signature — ${doc.ref} — ${name} <${email}>.`,
        fr: `Envoyé pour signature — ${doc.ref} — ${name} <${email}>.`,
      },
      doc.id,
    )
  },
})
