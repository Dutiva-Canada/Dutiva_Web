import { z } from 'zod'
import { supabase } from '@/lib/supabaseClient'
import type { Json } from '@/lib/supabase/types'
import type { Bi } from '@/i18n/core'
import { bi } from '@/i18n/core'
import type {
  DocRiskLevel,
  Jurisdiction,
  PreviewBlock,
  ReviewStatus,
  SignatureStatus,
} from './data'
import { loadSignatureBundle } from './signatureQueries'
import type { ProductionDocumentRecipient, ProductionDocumentSignature } from './signatureQueries'

/**
 * Real persistence for the HR Documents repository (production mode) —
 * public.hr_generated_documents (+ versions + audit), org-scoped by RLS
 * (migration 0076). Same boundary contract as the other productionApis:
 * zod-validated rows, throws on failure.
 *
 * **Dutiva Signature (0077–0078):** proprietary in-app envelopes with consent,
 * signing order, content fingerprint, audit trail, and completion records.
 * review_status is copied from the template's declared requirement at create;
 * it is not an assertion that a review completed.
 *
 * content_json freezes resolved PreviewBlock[] + merge values so later
 * catalogue edits do not rewrite saved drafts. template_tid is a string
 * (catalogue in repo), not a FK.
 */

export type ProductionDocumentStatus =
  | 'draft'
  | 'approved'
  | 'archived'
  | 'sent_for_signature'
  | 'partially_signed'
  | 'signed'
  | 'voided'
  | 'exported'

export const PRODUCTION_DOCUMENT_STATUSES: readonly ProductionDocumentStatus[] = [
  'draft',
  'approved',
  'archived',
  'sent_for_signature',
  'partially_signed',
  'signed',
  'voided',
  'exported',
]

/** Snapshot stored on hr_document_versions.content_json. */
export interface DocumentContentSnapshot {
  blocks: PreviewBlock[]
  values: Record<string, string>
}

export interface ProductionDocumentVersion {
  id: string
  versionNumber: number
  changeSummary: Bi
  content: DocumentContentSnapshot
  answers: Record<string, string>
  createdAt: string
}

export interface ProductionDocumentAuditEvent {
  id: string
  eventType: string
  actorLabel: string
  meta: string | null
  createdAt: string
}

export interface ProductionDocument {
  id: string
  ref: string
  title: Bi
  templateTid: string
  templateKey: string
  templateVersion: string
  employeeId: string | null
  caseId: string | null
  jurisdiction: Jurisdiction
  language: 'en' | 'fr'
  status: ProductionDocumentStatus
  signatureStatus: SignatureStatus
  reviewStatus: ReviewStatus
  risk: DocRiskLevel
  answers: Record<string, string>
  currentVersion: number
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ProductionDocumentDetail extends ProductionDocument {
  versions: ProductionDocumentVersion[]
  audit: ProductionDocumentAuditEvent[]
  signature: ProductionDocumentSignature | null
  recipients: ProductionDocumentRecipient[]
}

export interface NewGeneratedDocument {
  title: Bi
  templateTid: string
  templateKey: string
  templateVersion: string
  employeeId?: string
  caseId?: string
  jurisdiction: Jurisdiction
  language: 'en' | 'fr'
  reviewStatus: ReviewStatus
  risk: DocRiskLevel
  answers: Record<string, string>
  content: DocumentContentSnapshot
  actorLabel: string
}

const answersSchema = z.record(z.string(), z.string())

const contentSchema = z.object({
  blocks: z.array(z.unknown()),
  values: z.record(z.string(), z.string()),
})

const docRowSchema = z.object({
  id: z.string(),
  ref: z.string(),
  title_en: z.string(),
  title_fr: z.string(),
  template_tid: z.string(),
  template_key: z.string(),
  template_version: z.string(),
  employee_id: z.string().nullable(),
  case_id: z.string().nullable(),
  jurisdiction: z.enum(['ON', 'QC', 'FED']),
  language: z.enum(['en', 'fr']),
  status: z.enum([
    'draft',
    'approved',
    'archived',
    'sent_for_signature',
    'partially_signed',
    'signed',
    'voided',
    'exported',
  ]),
  signature_status: z.enum([
    'not_sent',
    'sent',
    'viewed',
    'pending',
    'partially_signed',
    'signed',
    'declined',
    'expired',
    'voided',
  ]),
  review_status: z.enum([
    'not_reviewed',
    'hr_review_required',
    'lawyer_review_recommended',
    'approved_for_use',
  ]),
  risk: z.enum(['low', 'medium', 'high']),
  answers_json: answersSchema,
  current_version: z.number(),
  archived_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

const versionRowSchema = z.object({
  id: z.string(),
  version_number: z.number(),
  change_summary_en: z.string(),
  change_summary_fr: z.string(),
  content_json: contentSchema,
  answers_json: answersSchema,
  created_at: z.string(),
})

const auditRowSchema = z.object({
  id: z.string(),
  event_type: z.string(),
  actor_label: z.string(),
  meta: z.string().nullable(),
  created_at: z.string(),
})

const DOC_SELECT =
  'id, ref, title_en, title_fr, template_tid, template_key, template_version, employee_id, case_id, jurisdiction, language, status, signature_status, review_status, risk, answers_json, current_version, archived_at, created_at, updated_at'

const VERSION_SELECT =
  'id, version_number, change_summary_en, change_summary_fr, content_json, answers_json, created_at'

const AUDIT_SELECT = 'id, event_type, actor_label, meta, created_at'

function toDocument(row: z.infer<typeof docRowSchema>): ProductionDocument {
  return {
    id: row.id,
    ref: row.ref,
    title: bi(row.title_en, row.title_fr),
    templateTid: row.template_tid,
    templateKey: row.template_key,
    templateVersion: row.template_version,
    employeeId: row.employee_id,
    caseId: row.case_id,
    jurisdiction: row.jurisdiction,
    language: row.language,
    status: row.status,
    signatureStatus: row.signature_status,
    reviewStatus: row.review_status,
    risk: row.risk,
    answers: row.answers_json,
    currentVersion: row.current_version,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toVersion(row: z.infer<typeof versionRowSchema>): ProductionDocumentVersion {
  return {
    id: row.id,
    versionNumber: row.version_number,
    changeSummary: bi(row.change_summary_en, row.change_summary_fr),
    content: {
      blocks: row.content_json.blocks as PreviewBlock[],
      values: row.content_json.values,
    },
    answers: row.answers_json,
    createdAt: row.created_at,
  }
}

function toAudit(row: z.infer<typeof auditRowSchema>): ProductionDocumentAuditEvent {
  return {
    id: row.id,
    eventType: row.event_type,
    actorLabel: row.actor_label,
    meta: row.meta,
    createdAt: row.created_at,
  }
}

/** Human reference like DOC-2026-0831-142533 — year + MMDD + HHMMSS. */
export function allocateDocumentRef(now = new Date()): string {
  const y = now.getFullYear()
  const pad = (n: number) => String(n).padStart(2, '0')
  const stamp = `${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  return `DOC-${y}-${stamp}`
}

export async function listDocuments(organizationId: string): Promise<ProductionDocument[]> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('hr_generated_documents')
    .select(DOC_SELECT)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return z.array(docRowSchema).parse(data).map(toDocument)
}

export async function getDocument(
  organizationId: string,
  id: string,
): Promise<ProductionDocumentDetail | null> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('hr_generated_documents')
    .select(DOC_SELECT)
    .eq('organization_id', organizationId)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null

  const doc = toDocument(docRowSchema.parse(data))

  const [versionsRes, auditRes] = await Promise.all([
    supabase
      .from('hr_document_versions')
      .select(VERSION_SELECT)
      .eq('document_id', id)
      .eq('organization_id', organizationId)
      .order('version_number', { ascending: false }),
    supabase
      .from('hr_document_audit_events')
      .select(AUDIT_SELECT)
      .eq('document_id', id)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false }),
  ])
  if (versionsRes.error) throw versionsRes.error
  if (auditRes.error) throw auditRes.error

  const bundle = await loadSignatureBundle(organizationId, id)

  return {
    ...doc,
    versions: z.array(versionRowSchema).parse(versionsRes.data).map(toVersion),
    audit: z.array(auditRowSchema).parse(auditRes.data).map(toAudit),
    signature: bundle.signature,
    recipients: bundle.recipients,
  }
}

export async function createDocument(
  organizationId: string,
  fields: NewGeneratedDocument,
): Promise<ProductionDocument> {
  if (!supabase) throw new Error('Supabase is not configured')
  const ref = allocateDocumentRef()
  const contentJson = {
    blocks: fields.content.blocks,
    values: fields.content.values,
  }

  const { data, error } = await supabase
    .from('hr_generated_documents')
    .insert({
      organization_id: organizationId,
      ref,
      title_en: fields.title.en,
      title_fr: fields.title.fr,
      template_tid: fields.templateTid,
      template_key: fields.templateKey,
      template_version: fields.templateVersion,
      employee_id: fields.employeeId || null,
      case_id: fields.caseId || null,
      jurisdiction: fields.jurisdiction,
      language: fields.language,
      status: 'draft',
      signature_status: 'not_sent',
      review_status: fields.reviewStatus,
      risk: fields.risk,
      answers_json: fields.answers,
      current_version: 1,
    })
    .select(DOC_SELECT)
    .single()
  if (error) throw error
  const doc = toDocument(docRowSchema.parse(data))

  const { error: versionError } = await supabase.from('hr_document_versions').insert({
    organization_id: organizationId,
    document_id: doc.id,
    version_number: 1,
    change_summary_en: 'Initial version',
    change_summary_fr: 'Version initiale',
    content_json: contentJson as unknown as Json,
    answers_json: fields.answers as Json,
  })
  if (versionError) throw versionError

  const { error: auditError } = await supabase.from('hr_document_audit_events').insert({
    organization_id: organizationId,
    document_id: doc.id,
    event_type: 'document_created',
    actor_label: fields.actorLabel,
    meta: fields.templateTid,
  })
  if (auditError) throw auditError

  return doc
}

export async function archiveDocument(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const now = new Date().toISOString()
  const { error } = await supabase
    .from('hr_generated_documents')
    .update({
      status: 'archived',
      archived_at: now,
      updated_at: now,
    })
    .eq('id', id)
  if (error) throw error
}

export async function approveDocument(
  organizationId: string,
  id: string,
  actorLabel: string,
): Promise<ProductionDocument> {
  if (!supabase) throw new Error('Supabase is not configured')
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('hr_generated_documents')
    .update({
      status: 'approved',
      updated_at: now,
    })
    .eq('id', id)
    .eq('organization_id', organizationId)
    .select(DOC_SELECT)
    .single()
  if (error) throw error

  const doc = toDocument(docRowSchema.parse(data))

  const { error: auditError } = await supabase.from('hr_document_audit_events').insert({
    organization_id: organizationId,
    document_id: id,
    event_type: 'review_approved',
    actor_label: actorLabel,
    meta: null,
  })
  if (auditError) throw auditError

  return doc
}
