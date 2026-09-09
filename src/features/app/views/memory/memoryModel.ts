import {
  AlertTriangle,
  Briefcase,
  Database,
  FileText,
  Gavel,
  Lightbulb,
  Lock,
  MessageCircle,
  Scale,
  ShieldCheck,
  UserRoundPen,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Bi } from '@/i18n/core'
import { memoryMessages as M } from '@/i18n/messages/memory'
import type {
  MemoryCategory,
  MemoryClassification,
  MemoryConfidence,
  MemoryFact,
  MemoryOrigin,
  MemoryRetentionCategory,
  MemorySensitivity,
  MemorySourceType,
  MemoryStatus,
  MemoryVisibility,
} from '@/data'

/**
 * Advisor Memory view maps — the prototype's `CONF` / `SRC` / `VIS` plus the
 * new domain model (status, classification, sensitivity, retention, origin),
 * bound to the design-system tokens. Status is never communicated through
 * colour alone: every entry carries a label and, where useful, an icon.
 */

export const CONFIDENCE_META: Record<MemoryConfidence, { label: Bi; dot: string; badge: string }> =
  {
    confirmed: {
      label: M.memory_confirmed,
      dot: 'bg-ok-fg',
      badge: 'border-ok-border bg-ok-bg text-ok-fg',
    },
    inferred: {
      label: M.memory_inferred,
      dot: 'bg-gold-dot',
      badge: 'border-gold-border bg-gold-bg text-gold-fg',
    },
  }

export const SOURCE_META: Record<MemorySourceType, { icon: LucideIcon; kind: Bi }> = {
  hris: { icon: Database, kind: M.memory_src_hris },
  document: { icon: FileText, kind: M.memory_src_document },
  chat: { icon: MessageCircle, kind: M.memory_src_chat },
  manual: { icon: UserRoundPen, kind: M.memory_src_manual },
  inference: { icon: Lightbulb, kind: M.memory_src_inference },
  case: { icon: Briefcase, kind: M.memory_src_case },
}

export const VISIBILITY_META: Record<
  MemoryVisibility,
  { icon: LucideIcon; label: Bi; className: string }
> = {
  hr: { icon: Users, label: M.memory_vis_hr, className: 'text-text-muted' },
  case: { icon: Scale, label: M.memory_vis_case, className: 'text-gold-fg' },
  restricted: { icon: Scale, label: M.memory_vis_restricted, className: 'text-risk-dot' },
}

export const CATEGORY_LABELS: Record<MemoryCategory, Bi> = {
  employment: M.memory_cat_employment,
  compensation: M.memory_cat_compensation,
  matter: M.memory_cat_matter,
  record: M.memory_cat_record,
  note: M.memory_cat_note,
  case: M.memory_cat_case,
  conversation: M.memory_cat_conversation,
}

/** Person-view grouping order (prototype `order`). */
export const PERSON_CATEGORY_ORDER: MemoryCategory[] = [
  'employment',
  'compensation',
  'matter',
  'record',
  'note',
]

/* ---------------------------------------------------- new domain metadata */

export const STATUS_META: Record<
  MemoryStatus,
  { label: Bi; dot: string; badge: string; icon: LucideIcon }
> = {
  proposed: {
    label: M.memory_status_proposed,
    dot: 'bg-gold-dot',
    badge: 'border-gold-border bg-gold-bg text-gold-fg',
    icon: Lightbulb,
  },
  needs_review: {
    label: M.memory_status_needs_review,
    dot: 'bg-gold-dot',
    badge: 'border-gold-border bg-gold-bg text-gold-fg',
    icon: AlertTriangle,
  },
  confirmed: {
    label: M.memory_status_confirmed,
    dot: 'bg-ok-fg',
    badge: 'border-ok-border bg-ok-bg text-ok-fg',
    icon: ShieldCheck,
  },
  expired: {
    label: M.memory_status_expired,
    dot: 'bg-text-faint',
    badge: 'border-border bg-inset text-text-muted',
    icon: AlertTriangle,
  },
  removed: {
    label: M.memory_status_removed,
    dot: 'bg-text-faint',
    badge: 'border-border bg-inset text-text-muted',
    icon: AlertTriangle,
  },
}

export const CLASSIFICATION_META: Record<MemoryClassification, { label: Bi; icon: LucideIcon }> = {
  fact: { label: M.memory_class_fact, icon: ShieldCheck },
  preference: { label: M.memory_class_preference, icon: Lightbulb },
  allegation: { label: M.memory_class_allegation, icon: AlertTriangle },
  opinion: { label: M.memory_class_opinion, icon: Lightbulb },
  evidence: { label: M.memory_class_evidence, icon: FileText },
  finding: { label: M.memory_class_finding, icon: Gavel },
  decision: { label: M.memory_class_decision, icon: Gavel },
  contextual: { label: M.memory_class_contextual, icon: MessageCircle },
}

export const SENSITIVITY_META: Record<
  MemorySensitivity,
  { label: Bi; icon: LucideIcon; badge: string }
> = {
  standard: {
    label: M.memory_sensitivity_standard,
    icon: Users,
    badge: 'border-border bg-inset text-text-muted',
  },
  restricted: {
    label: M.memory_sensitivity_restricted,
    icon: Lock,
    badge: 'border-risk-border bg-surface text-risk-dot',
  },
}

export const ORIGIN_META: Record<MemoryOrigin, { label: Bi; icon: LucideIcon }> = {
  explicit: { label: M.memory_origin_explicit, icon: Database },
  inferred: { label: M.memory_origin_inferred, icon: Lightbulb },
  manual: { label: M.memory_origin_manual, icon: UserRoundPen },
}

export const RETENTION_CATEGORY_LABELS: Record<MemoryRetentionCategory, Bi> = {
  advisor_conversation: M.memory_retention_advisor_conversation,
  employee_preference: M.memory_retention_employee_preference,
  employment_record: M.memory_retention_employment_record,
  payroll_tax: M.memory_retention_payroll_tax,
  investigation: M.memory_retention_investigation,
  wellbeing_personal: M.memory_retention_wellbeing_personal,
  custom: M.memory_retention_custom,
}

export const RETENTION_CATEGORY_ORDER: MemoryRetentionCategory[] = [
  'advisor_conversation',
  'employee_preference',
  'employment_record',
  'payroll_tax',
  'investigation',
  'wellbeing_personal',
  'custom',
]

export const CLASSIFICATION_ORDER: MemoryClassification[] = [
  'fact',
  'preference',
  'allegation',
  'opinion',
  'evidence',
  'finding',
  'decision',
  'contextual',
]

/* ----------------------------------------------- effective-value resolvers */

/**
 * Resolve the effective lifecycle status. New fixtures set `status` directly;
 * legacy rows (and production rows that only have `confidence`) derive it:
 * confirmed → confirmed, inferred → proposed. Removed rows are filtered out
 * of the active list but keep `removed` where the store has set it.
 */
export function effectiveStatus(fact: MemoryFact): MemoryStatus {
  if (fact.status != null) return fact.status
  return fact.confidence === 'confirmed' ? 'confirmed' : 'proposed'
}

/** Resolve the effective sensitivity tier from the new field or legacy fields. */
export function effectiveSensitivity(fact: MemoryFact): MemorySensitivity {
  if (fact.sensitivity != null) return fact.sensitivity
  if (fact.visibility === 'restricted' || fact.sensitive) return 'restricted'
  return 'standard'
}

/**
 * Resolve whether Advisor may retrieve this memory. A record may be stored
 * without being Advisor-usable (restricted, legal hold, memory disabled).
 */
export function effectiveAdvisorUsable(
  fact: MemoryFact,
  memoryEnabled: boolean,
): boolean {
  if (!memoryEnabled) return false
  if (fact.advisorUsable != null) return fact.advisorUsable
  /* Legacy default: restricted/compensation/health items are not auto-usable. */
  return effectiveSensitivity(fact) !== 'restricted'
}

/** Whether a memory is under legal hold (scheduled expiration paused). */
export function isUnderLegalHold(fact: MemoryFact): boolean {
  return fact.legalHold != null
}

/** Whether a memory is expiring soon (within the given horizon days of today). */
export function isExpiringSoon(fact: MemoryFact, todayISO: string, horizonDays = 14): boolean {
  if (isUnderLegalHold(fact)) return false
  const target = fact.expiryDate ?? fact.reviewDate
  if (target == null) return false
  const today = new Date(`${todayISO}T00:00:00`)
  const due = new Date(`${target}T00:00:00`)
  const diff = (due.getTime() - today.getTime()) / 86_400_000
  return diff >= 0 && diff <= horizonDays
}
