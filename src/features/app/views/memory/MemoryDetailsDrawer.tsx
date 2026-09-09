import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Check,
  Clock,
  Eye,
  Gavel,
  Lock,
  Pencil,
  ShieldCheck,
  Trash2,
  X,
  AlertTriangle,
  FileText,
  Scale,
  UserRoundPen,
} from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { pick, pickL } from '@/i18n/core'
import type { Lang } from '@/i18n/core'
import { memoryMessages as M } from '@/i18n/messages/memory'
import type { MemoryFact } from '@/data'
import {
  CLASSIFICATION_META,
  ORIGIN_META,
  RETENTION_CATEGORY_LABELS,
  RETRIEVAL_SCOPE_META,
  SENSITIVITY_META,
  SOURCE_META,
  STATUS_META,
  effectiveAdvisorUsable,
  effectiveSensitivity,
  effectiveStatus,
  isUnderLegalHold,
} from './memoryModel'
import { formatMemoryDate } from './memoryDates'
import type { SubjectRef } from './memoryWorkspace'
import { memoryActions, type MemoryAuditEntry } from './memoryStore'

/**
 * Right-hand details drawer for a selected memory. Exposes the full record —
 * statement, subject, classification, status, source + excerpt, provenance,
 * retention, advisor-usable state, legal hold, and relevant activity — plus
 * the action set (Confirm, Edit, Review source, Mark for review, Remove,
 * Change retention, Add/remove legal hold). Accessible: role=dialog,
 * aria-modal, Escape to close, focus on open, labelled controls. Status is
 * never colour-only — every state carries a label.
 */
export interface MemoryDetailsDrawerProps {
  readonly fact: MemoryFact | null
  readonly subject: SubjectRef | null
  readonly todayISO: string
  readonly memoryEnabled: boolean
  readonly activity: readonly MemoryAuditEntry[]
  readonly onClose: () => void
  readonly onEdit: (fact: MemoryFact) => void
  readonly onRemove: (fact: MemoryFact) => void
  readonly onAddHold: (fact: MemoryFact) => void
  readonly onRemoveHold: (fact: MemoryFact) => void
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-[10px] py-[5px]">
      <dt className="w-[120px] shrink-0 text-[12px] font-semibold text-text-faint">{label}</dt>
      <dd className="m-0 min-w-0 flex-1 text-[12.5px] leading-normal text-text-2">{children}</dd>
    </div>
  )
}

function auditActionLabel(action: MemoryAuditEntry['action'], lang: Lang): string {
  const map: Record<MemoryAuditEntry['action'], keyof typeof M> = {
    created: 'memory_audit_created',
    proposed: 'memory_audit_proposed',
    confirmed: 'memory_audit_confirmed',
    rejected: 'memory_audit_rejected',
    edited: 'memory_audit_edited',
    removed: 'memory_audit_removed',
    restored: 'memory_audit_restored',
    expired: 'memory_audit_expired',
    exported: 'memory_audit_exported',
    legal_hold_added: 'memory_audit_legal_hold_added',
    legal_hold_removed: 'memory_audit_legal_hold_removed',
    review_requested: 'memory_audit_review_requested',
    memory_disabled: 'memory_audit_memory_disabled',
    memory_enabled: 'memory_audit_memory_enabled',
  }
  return pick(M[map[action]], lang)
}

export function MemoryDetailsDrawer({
  fact,
  subject,
  todayISO,
  memoryEnabled,
  activity,
  onClose,
  onEdit,
  onRemove,
  onAddHold,
  onRemoveHold,
}: MemoryDetailsDrawerProps) {
  const { x, lang } = useI18n()
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!fact) return
    const t = setTimeout(() => closeRef.current?.focus(), 0)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(t)
      window.removeEventListener('keydown', onKey)
    }
  }, [fact, onClose])

  if (!fact) return null

  const status = effectiveStatus(fact)
  const sensitivity = effectiveSensitivity(fact)
  const advisorUsable = effectiveAdvisorUsable(fact, memoryEnabled)
  const statusMeta = STATUS_META[status]
  const sensMeta = SENSITIVITY_META[sensitivity]
  const sourceMeta = SOURCE_META[fact.source.type]
  const classMeta = fact.classification != null ? CLASSIFICATION_META[fact.classification] : null
  const originMeta = fact.origin != null ? ORIGIN_META[fact.origin] : null
  const onHold = isUnderLegalHold(fact)
  const SourceIcon = sourceMeta.icon
  const StatusIcon = statusMeta.icon
  const SensIcon = sensMeta.icon

  const factActivity = activity.filter((a) => a.factId === fact.id)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={x(M.memory_details_title)}
      className="fixed inset-0 z-85 flex justify-end bg-black/40 motion-safe:animate-[fadeIn_0.1s_ease-out]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="flex h-full w-full max-w-[480px] flex-col border-l border-border bg-surface-2 shadow-xl motion-safe:animate-[slideInRight_0.16s_ease-out]">
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-[10px] border-b border-border-soft px-[18px] py-[14px]">
          <div className="min-w-0">
            <h2 className="m-0 font-display text-[16px] font-semibold text-text">{x(M.memory_details_title)}</h2>
            <div className="mt-[6px] flex flex-wrap items-center gap-[6px]">
              <span className={`inline-flex items-center gap-[5px] rounded-[100px] border px-[9px] py-[3px] text-[10.5px] font-bold ${statusMeta.badge}`}>
                <StatusIcon size={12} strokeWidth={2} aria-hidden="true" />
                {pick(statusMeta.label, lang)}
              </span>
              <span className={`inline-flex items-center gap-[5px] rounded-[100px] border px-[9px] py-[3px] text-[10.5px] font-bold ${sensMeta.badge}`}>
                <SensIcon size={12} strokeWidth={2} aria-hidden="true" />
                {pick(sensMeta.label, lang)}
              </span>
              {onHold && (
                <span className="inline-flex items-center gap-[5px] rounded-[100px] border border-risk-border bg-surface px-[9px] py-[3px] text-[10.5px] font-bold text-risk-dot">
                  <Gavel size={12} strokeWidth={2} aria-hidden="true" />
                  {x(M.memory_row_legal_hold)}
                </span>
              )}
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={x(M.memory_details_close)}
            className="flex min-h-[36px] min-w-[36px] cursor-pointer items-center justify-center rounded-[8px] border-none bg-transparent text-text-muted hover:bg-inset"
          >
            <X size={18} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-[18px] py-[16px]">
          {/* Statement */}
          <div className="mb-[16px]">
            <div className="mb-[5px] text-[11px] font-bold tracking-wider text-text-faint uppercase">
              {x(M.memory_details_statement)}
            </div>
            <p className="m-0 text-[14.5px] leading-relaxed text-text">{pickL(fact.statement, lang)}</p>
          </div>

          {/* Subject + source */}
          <dl className="mb-[14px]">
            {subject != null && (
              <Row label={x(M.memory_details_subject)}>
                {subject.href != null ? (
                  <Link to={subject.href} className="font-semibold text-accent no-underline hover:underline">
                    {subject.label}
                  </Link>
                ) : (
                  <span className="font-semibold text-text">{subject.label}</span>
                )}
              </Row>
            )}
            {classMeta != null && (
              <Row label={x(M.memory_details_classification)}>
                <span className="inline-flex items-center gap-[5px]">
                  <classMeta.icon size={13} strokeWidth={1.7} aria-hidden="true" />
                  {pick(classMeta.label, lang)}
                </span>
              </Row>
            )}
            <Row label={x(M.memory_details_status)}>
              <span className="inline-flex items-center gap-[5px]">
                <StatusIcon size={13} strokeWidth={1.7} aria-hidden="true" />
                {pick(statusMeta.label, lang)}
              </span>
            </Row>
            <Row label={x(M.memory_details_source)}>
              <span className="inline-flex items-center gap-[5px]">
                <SourceIcon size={13} strokeWidth={1.7} aria-hidden="true" />
                {pick(sourceMeta.kind, lang)} · {pick(fact.source.detail, lang)}
              </span>
            </Row>
            {fact.sourceExcerpt != null && (
              <Row label={x(M.memory_details_source_excerpt)}>
                <blockquote className="m-0 border-l-2 border-border-soft pl-[10px] text-[12.5px] italic text-text-muted">
                  {pickL(fact.sourceExcerpt, lang)}
                </blockquote>
              </Row>
            )}
            {subject?.href != null && (
              <Row label="">
                <Link to={subject.href} className="inline-flex items-center gap-[5px] text-[12px] font-semibold text-accent no-underline hover:underline">
                  <Eye size={13} strokeWidth={1.7} aria-hidden="true" />
                  {x(M.memory_details_view_source)}
                </Link>
              </Row>
            )}
          </dl>

          {/* Provenance */}
          <div className="mb-[14px] rounded-[10px] border border-border-soft bg-surface px-[12px] py-[10px]">
            <div className="mb-[6px] text-[11px] font-bold tracking-wider text-text-faint uppercase">
              {x(M.memory_rail_confidence)}
            </div>
            <dl className="m-0">
              {fact.creator != null && (
                <Row label={x(M.memory_details_creator)}>{fact.creator}</Row>
              )}
              {fact.proposedBy != null && (
                <Row label={x(M.memory_details_proposed_by)}>{fact.proposedBy}</Row>
              )}
              {fact.confidenceScore != null && (
                <Row label={x(M.memory_details_confidence)}>
                  {Math.round(fact.confidenceScore * 100)}%
                </Row>
              )}
              {originMeta != null && (
                <Row label={x(M.memory_filter_source)}>
                  <span className="inline-flex items-center gap-[5px]">
                    <originMeta.icon size={13} strokeWidth={1.7} aria-hidden="true" />
                    {pick(originMeta.label, lang)}
                  </span>
                </Row>
              )}
              <Row label={x(M.memory_details_created)}>
                {formatMemoryDate(fact.learnedAt, lang, todayISO)}
              </Row>
              {fact.confirmation != null && (
                <Row label={x(M.memory_details_confirmed)}>
                  {formatMemoryDate(fact.confirmation.at, lang, todayISO)}
                </Row>
              )}
              {fact.lastVerifiedAt != null && (
                <Row label={x(M.memory_details_last_verified)}>
                  {formatMemoryDate(fact.lastVerifiedAt, lang, todayISO)}
                </Row>
              )}
              {fact.confirmedBy != null && fact.confirmation != null && (
                <Row label={x(M.memory_details_creator)}>{fact.confirmedBy}</Row>
              )}
            </dl>
          </div>

          {/* Purpose + jurisdiction + retrieval scope */}
          {(fact.purpose != null || fact.jurisdiction != null || fact.retrievalScope != null) && (
            <dl className="mb-[14px]">
              {fact.purpose != null && <Row label={x(M.memory_details_purpose)}>{pickL(fact.purpose, lang)}</Row>}
              {fact.jurisdiction != null && <Row label={x(M.memory_details_jurisdiction)}>{fact.jurisdiction}</Row>}
              {fact.retrievalScope != null && (
                <Row label={x(M.memory_retrieval_scope)}>
                  <span className="inline-flex items-center gap-[5px]">
                    {(() => {
                      const ScopeIcon = RETRIEVAL_SCOPE_META[fact.retrievalScope!.type].icon
                      return <ScopeIcon size={13} strokeWidth={1.7} aria-hidden="true" />
                    })()}
                    {pick(RETRIEVAL_SCOPE_META[fact.retrievalScope.type].label, lang)}
                    {fact.retrievalScope.id != null && (
                      <span className="text-text-faint"> · {fact.retrievalScope.id}</span>
                    )}
                  </span>
                </Row>
              )}
            </dl>
          )}

          {/* Retention */}
          <div className="mb-[14px] rounded-[10px] border border-border-soft bg-surface px-[12px] py-[10px]">
            <div className="mb-[6px] flex items-center gap-[6px]">
              <Clock size={13} strokeWidth={1.7} className="text-text-muted" aria-hidden="true" />
              <span className="text-[11px] font-bold tracking-wider text-text-faint uppercase">
                {x(M.memory_rail_retention)}
              </span>
            </div>
            <dl className="m-0">
              {fact.retentionCategory != null && (
                <Row label={x(M.memory_details_retention)}>
                  {pick(RETENTION_CATEGORY_LABELS[fact.retentionCategory], lang)}
                </Row>
              )}
              {fact.reviewDate != null && (
                <Row label={x(M.memory_details_review_date)}>
                  {formatMemoryDate(fact.reviewDate, lang, todayISO)}
                </Row>
              )}
              {fact.expiryDate != null && (
                <Row label={x(M.memory_details_expiry_date)}>
                  {formatMemoryDate(fact.expiryDate, lang, todayISO)}
                  {onHold && (
                    <span className="ml-[6px] inline-flex items-center gap-[4px] text-risk-dot">
                      <AlertTriangle size={12} strokeWidth={2} aria-hidden="true" />
                      {x(M.memory_row_legal_hold_note)}
                    </span>
                  )}
                </Row>
              )}
              <Row label={x(M.memory_details_advisor_usable)}>
                <span className={`inline-flex items-center gap-[5px] font-semibold ${advisorUsable ? 'text-ok-fg' : 'text-text-muted'}`}>
                  {advisorUsable ? <Check size={13} strokeWidth={2.2} aria-hidden="true" /> : <Lock size={13} strokeWidth={2} aria-hidden="true" />}
                  {advisorUsable ? x(M.memory_details_yes) : x(M.memory_details_no)}
                </span>
              </Row>
            </dl>
          </div>

          {/* Legal hold */}
          {onHold && fact.legalHold != null && (
            <div className="mb-[14px] rounded-[10px] border border-risk-border bg-surface px-[12px] py-[10px]">
              <div className="mb-[6px] flex items-center gap-[6px]">
                <Gavel size={13} strokeWidth={2} className="text-risk-dot" aria-hidden="true" />
                <span className="text-[11px] font-bold tracking-wider text-risk-dot uppercase">
                  {x(M.memory_details_legal_hold)}
                </span>
              </div>
              <dl className="m-0">
                <Row label={x(M.memory_details_legal_hold_reason)}>{pickL(fact.legalHold.reason, lang)}</Row>
                <Row label={x(M.memory_details_legal_hold_by)}>{fact.legalHold.placedBy}</Row>
                <Row label={x(M.memory_details_legal_hold_at)}>
                  {formatMemoryDate(fact.legalHold.placedAt, lang, todayISO)}
                </Row>
              </dl>
            </div>
          )}

          {/* Activity for this memory */}
          <div className="mb-[14px]">
            <div className="mb-[6px] text-[11px] font-bold tracking-wider text-text-faint uppercase">
              {x(M.memory_details_activity)}
            </div>
            {factActivity.length === 0 ? (
              <div className="text-[12px] text-text-faint">{x(M.memory_details_no_activity)}</div>
            ) : (
              <ul className="m-0 list-none space-y-[5px] pl-0">
                {factActivity.map((a) => (
                  <li key={a.id} className="text-[12px] leading-normal text-text-muted">
                    <span className="font-semibold text-text-2">{a.actor}</span> {auditActionLabel(a.action, lang)}
                    {a.statement != null && (
                      <span className="text-text-faint"> — “{pickL(a.statement, lang)}”</span>
                    )}
                    <span className="text-text-faint"> · {formatMemoryDate(a.timestamp, lang, todayISO)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 flex-wrap gap-[7px] border-t border-border-soft px-[18px] py-[12px]">
          {(status === 'proposed' || status === 'needs_review') && (
            <button
              type="button"
              onClick={() => memoryActions.confirm(fact.id)}
              className="flex cursor-pointer items-center gap-[5px] rounded-[8px] border-none bg-ok-bg px-[12px] py-[7px] font-sans text-[12.5px] font-bold text-ok-fg"
            >
              <Check size={14} strokeWidth={2.2} aria-hidden="true" />
              {x(M.memory_action_confirm)}
            </button>
          )}
          <button
            type="button"
            onClick={() => onEdit(fact)}
            className="flex cursor-pointer items-center gap-[5px] rounded-[8px] border border-border bg-surface px-[11px] py-[7px] font-sans text-[12.5px] font-semibold text-text-muted"
          >
            <Pencil size={14} strokeWidth={1.7} aria-hidden="true" />
            {x(M.memory_action_edit)}
          </button>
          {status !== 'needs_review' && (
            <button
              type="button"
              onClick={() => memoryActions.markForReview(fact.id)}
              className="flex cursor-pointer items-center gap-[5px] rounded-[8px] border border-border bg-surface px-[11px] py-[7px] font-sans text-[12.5px] font-semibold text-text-muted"
            >
              <AlertTriangle size={14} strokeWidth={1.7} aria-hidden="true" />
              {x(M.memory_action_mark_review)}
            </button>
          )}
          {onHold ? (
            <button
              type="button"
              onClick={() => onRemoveHold(fact)}
              className="flex cursor-pointer items-center gap-[5px] rounded-[8px] border border-border bg-surface px-[11px] py-[7px] font-sans text-[12.5px] font-semibold text-text-muted"
            >
              <Scale size={14} strokeWidth={1.7} aria-hidden="true" />
              {x(M.memory_action_remove_hold)}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onAddHold(fact)}
              className="flex cursor-pointer items-center gap-[5px] rounded-[8px] border border-border bg-surface px-[11px] py-[7px] font-sans text-[12.5px] font-semibold text-text-muted"
            >
              <Gavel size={14} strokeWidth={1.7} aria-hidden="true" />
              {x(M.memory_action_add_hold)}
            </button>
          )}
          {status !== 'removed' && (
            <button
              type="button"
              onClick={() => onRemove(fact)}
              className="flex cursor-pointer items-center gap-[5px] rounded-[8px] border border-risk-border bg-surface px-[11px] py-[7px] font-sans text-[12.5px] font-semibold text-risk-dot"
            >
              <Trash2 size={14} strokeWidth={1.7} aria-hidden="true" />
              {x(M.memory_action_remove)}
            </button>
          )}
          {status === 'removed' && (
            <button
              type="button"
              onClick={() => memoryActions.restore(fact.id)}
              className="flex cursor-pointer items-center gap-[5px] rounded-[8px] border border-border bg-surface px-[11px] py-[7px] font-sans text-[12.5px] font-semibold text-text-muted"
            >
              <ShieldCheck size={14} strokeWidth={1.7} aria-hidden="true" />
              {x(M.memory_action_restore)}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/** Re-exported for the inline edit affordance used by the Memories list. */
export { FileText, UserRoundPen }
