import type { Bi } from '@/i18n/core'

/**
 * Domain model for the HR Documents Library (Document Studio + Repository),
 * mirroring the handoff's Supabase spec (`doclib` schema — see DATA_MODEL.md).
 * The T01–T16 fixture modules in this folder were generated from the handoff's
 * `dutiva-data.js` and should be left alone. Templates added since are authored
 * in-repo against this model (docs/FOUR_RING_FRAMEWORK.md).
 */

export type Jurisdiction = 'ON' | 'QC' | 'FED'
export type DocRiskLevel = 'low' | 'medium' | 'high'

export type DocStatus =
  | 'draft'
  | 'in_review'
  | 'needs_revision'
  | 'approved'
  | 'sent_for_signature'
  | 'partially_signed'
  | 'signed'
  | 'exported'
  | 'archived'
  | 'voided'
  | 'deleted'

export type ReviewStatus =
  'not_reviewed' | 'hr_review_required' | 'lawyer_review_recommended' | 'approved_for_use'

export type SignatureStatus =
  | 'not_sent'
  | 'sent'
  | 'viewed'
  | 'pending'
  | 'partially_signed'
  | 'signed'
  | 'declined'
  | 'expired'
  | 'voided'

export type WorkspaceRole = 'owner' | 'hr' | 'manager' | 'viewer' | 'external'

export type DocCapability =
  | 'view_repository'
  | 'view_studio'
  | 'generate'
  | 'edit'
  | 'request_review'
  | 'approve_review'
  | 'send_for_signature'
  | 'export'
  | 'archive'
  | 'restore'
  | 'void'
  | 'manage_permissions'
  | 'view_audit'

export type TemplateCategoryId =
  | 'hiring'
  | 'changes'
  | 'agreements'
  | 'policies'
  | 'discipline'
  | 'termination'
  | 'accommodation'
  | 'wellbeing'
  | 'compensation'
  | 'communications'

/** Who the document is about — drives the wizard's context step. */
export type TemplateSubject = 'candidate' | 'employee' | 'org' | 'external'

export type QuestionType = 'text' | 'textarea' | 'date' | 'number' | 'select' | 'radio'

/**
 * `fill` is a prompt the *reader* answers by hand — a heading, the guidance
 * under it, and ruled space. Added for T44, which is issued blank because the
 * wizard is employer-side and the plan is the employee's to write: rendering
 * its prompts as `clause` produced explanatory prose with nowhere to put an
 * answer, so the form could not actually be completed.
 */
export type PreviewBlockType =
  'title' | 'meta' | 'para' | 'clause' | 'sig' | 'ack' | 'note' | 'fill'

/** Chip tones used by the doclib status maps (superset of the app ramp). */
export type DocChipTone = 'ok' | 'warn' | 'risk' | 'info' | 'neutral' | 'gold'

export type AuditEventType =
  | 'template_opened'
  | 'generation_started'
  | 'draft_saved'
  | 'document_created'
  | 'document_updated'
  | 'version_created'
  | 'review_requested'
  | 'review_approved'
  | 'review_rejected'
  | 'sent_for_signature'
  | 'signature_viewed'
  | 'signature_completed'
  | 'document_exported'
  | 'document_archived'
  | 'document_restored'
  /* Used by the handoff's sample data though absent from its written
     17-event catalogue — the data is authoritative. */
  | 'document_voided'
  | 'permission_changed'
  | 'comment_added'

/** Conditional-clause gate: block renders only when every present test passes. */
export interface ClauseGate {
  juris?: Jurisdiction
  min_headcount?: number
  union?: boolean
  /**
   * Render only when the wizard answer `id` is one of `equals`.
   *
   * Added in review on #128 for the one thing the org-profile gates cannot
   * express: a document that asks a question and then has to honour the
   * answer. T40 asks whether a fresh acknowledgement is required and had no
   * way to omit the signature block when it is not, so it shipped a signature
   * page to people it had just told they did not need to sign.
   *
   * **Where no answers are supplied — the template detail preview — an
   * answer-gated block renders.** That surface is showing what the template
   * can produce rather than one filled-in document, and hiding conditional
   * clauses there would understate it.
   */
  answer?: { id: string; equals: string[] }
}

export interface TemplateQuestionOption {
  value: string
  label: Bi
}

export interface TemplateQuestion {
  id: string
  section: Bi
  label: Bi
  type: QuestionType
  required: boolean
  placeholder?: Bi
  hint?: Bi
  options?: TemplateQuestionOption[]
}

/**
 * One ordered block of a rendered document. `{{snake_case}}` tokens in `text`
 * are merge fields resolved from wizard answers plus the computed tokens
 * `org`, `today`, `jurisdiction`, `statute`.
 */
export interface PreviewBlock {
  type: PreviewBlockType
  /** Block copy — present on every type except 'sig'. */
  text?: Bi
  /** Clause number (type 'clause' only). */
  n?: number
  heading?: Bi
  /** Signature-line roles (type 'sig' only). */
  roles?: Bi[]
  /** Callout severity (type 'note' only). */
  tone?: 'info' | 'risk'
  /** Ruled lines to leave for a handwritten answer (type 'fill' only). */
  lines?: number
  when?: ClauseGate
}

export interface DocTemplate {
  id: string
  /** Display id, `T` + zero-padded ordinal (T01…). */
  tid: string
  key: string
  kind: string
  category: TemplateCategoryId
  core: boolean
  name: Bi
  desc: Bi
  jurisdictions: Jurisdiction[]
  risk: DocRiskLevel
  review: ReviewStatus
  requiresLawyerReview: boolean
  version: string
  versionNumber: number
  effectiveDate: string
  updatedAt: string
  estMinutes: number
  usageCount: number
  statutory: Bi[]
  jurisdictionNotes: Partial<Record<Jurisdiction, Bi>>
  includes: Bi[]
  questions: TemplateQuestion[]
  preview: PreviewBlock[]
  subject: TemplateSubject
  /**
   * When `bilingual`, the generated document stacks English and French body
   * copy in one deliverable (T01). Wizard answers are shared; merge fields are
   * localized per language at render time.
   */
  delivery?: 'bilingual'
  /**
   * Full-length formatted body ({{token}} merge convention). EN-only in the
   * handoff sample content; the bilingual `preview` blocks are the localized
   * rendering path.
   */
  bodyHtmlEn?: string
}

export interface TemplateCategory {
  id: TemplateCategoryId
  order: number
  /** lucide icon name from the handoff (mapped to a component at the UI layer). */
  icon: string
  name: Bi
  desc: Bi
}

export type RecipientType = 'employer' | 'employee' | 'manager' | 'hr' | 'external'

export interface DocRecipient {
  name: string
  type: RecipientType
  email: string
  order: number
  status: string
  signedAt?: string
  viewedAt?: string
  declinedAt?: string
  /** Base64 PNG of a drawn signature, or rendered typed-signature image. */
  signatureImage?: string
  /** Plain-text name used as a typed signature, stored for audit. */
  signatureText?: string
  /** The name the signer entered when signing. */
  signedName?: string
}

export interface DocVersionEntry {
  n: number
  changeSummary: Bi
  createdBy: string
  createdAt: string
}

export interface DocSignature {
  provider: string
  envelopeId: string
  status: SignatureStatus
  sentAt?: string
  viewedAt?: string
  signedAt?: string
  declinedAt?: string
  expiresAt?: string
}

export interface DocAuditEvent {
  event: AuditEventType
  actor: string
  at: string
  meta?: string
}

export interface GeneratedDoc {
  id: string
  /** Human reference number (DOC-2026-0142). */
  ref: string
  templateTid: string
  templateKey: string
  title: Bi
  employeeId?: string
  caseId?: string
  jurisdiction: Jurisdiction
  language: 'en' | 'fr'
  status: DocStatus
  reviewStatus: ReviewStatus
  signatureStatus: SignatureStatus
  risk: DocRiskLevel
  currentVersion: number
  createdBy: string
  updatedBy: string
  createdAt: string
  updatedAt: string
  archived: boolean
  answers: Record<string, string>
  versions: DocVersionEntry[]
  recipients: DocRecipient[]
  signature?: DocSignature
  audit: DocAuditEvent[]
}

export interface DocEmployee {
  id: string
  name: string
  jurisdiction: Jurisdiction
}

export interface DocCase {
  id: string
  title: Bi
  employeeId: string
  jurisdiction: Jurisdiction
  risk: DocRiskLevel
}

export type SizeTierKey = 'micro' | 'small' | 'mid' | 'large'

export interface SizeTier {
  key: SizeTierKey
  min: number
  max: number | null
  label: Bi
}

export interface SizeThreshold {
  at: number
  text: Bi
}

export interface Sector {
  key: string
  federallyRegulated: boolean
  name: Bi
}

/** The org compliance profile (an `organizations` row in production). */
export interface OrgProfile {
  name: string
  headcount: number
  unionized: boolean
  sector: string
  primaryJurisdiction: Jurisdiction
}

export interface RoleInfo {
  key: WorkspaceRole
  label: Bi
  initials: string
  desc: Bi
}

export interface RiskLevelInfo {
  key: DocRiskLevel
  tone: DocChipTone
  order: number
  label: Bi
  desc: Bi
}

export interface StatusInfo {
  tone: DocChipTone
  label: Bi
}

export type CapabilityMatrix = Record<DocCapability, WorkspaceRole[]>

export interface JurisdictionInfo {
  code: Jurisdiction
  name: Bi
  /** Primary employment-standards statute ({{statute}} merge token source). */
  statute: Bi
  /** Additional statutes commonly engaged in this jurisdiction. */
  also: Bi[]
}
