import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Check,
  Clock,
  FileText,
  Gavel,
  History,
  Lightbulb,
  Lock,
  Pencil,
  Power,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { pick, pickL } from '@/i18n/core'
import type { Bi } from '@/i18n/core'
import { memoryMessages as M } from '@/i18n/messages/memory'
import { Disclaimer } from '@/components/Disclaimer'
import type { ProductionEmployee } from '@/features/app/views/employees/productionApi'
import type { MemoryFact, MemoryScope } from '@/data'
import type { ProductionMemoryAuditEntry } from './productionApi'
import {
  CLASSIFICATION_META,
  RETRIEVAL_SCOPE_META,
  SOURCE_META,
  STATUS_META,
  SENSITIVITY_META,
  effectiveSensitivity,
  effectiveStatus,
} from './memoryModel'
import { formatMemoryDate } from './memoryDates'

/**
 * Production tab components for the Advisor Memory workspace. Split out of
 * `MemoryManagerProductionView` to keep the dispatch shell under the 800-line
 * architecture budget. These read from the production API (migration 0086)
 * and are honest about fields the backend does not yet persist.
 */

const selectClass =
  'rounded-[9px] border border-border bg-surface px-[10px] py-[7px] font-sans text-[12.5px] text-text outline-none'
const cardClass = 'rounded-[13px] border border-border-soft bg-surface px-[15px] py-[14px]'
const inputClass =
  'w-full rounded-[10px] border border-border bg-surface px-[12px] py-[9px] font-sans text-[13.5px] text-text'

/* --------------------------------------------------------------- Memories */

export interface ProductionMemoriesTabProps {
  readonly loading: boolean
  readonly loadFailed: boolean
  readonly rows: readonly MemoryFact[]
  readonly query: string
  readonly setQuery: (v: string) => void
  readonly subjectFilter: MemoryScope | 'all'
  readonly setSubjectFilter: (v: MemoryScope | 'all') => void
  readonly subjectLabel: (f: MemoryFact) => string
  readonly subjectHref: (f: MemoryFact) => string | null
  readonly editId: string | null
  readonly editDraft: string
  readonly setEditDraft: (v: string) => void
  readonly onStartEdit: (f: MemoryFact) => void
  readonly onCancelEdit: () => void
  readonly onSaveEdit: (id: string) => void
  readonly onConfirm: (id: string) => void
  readonly onForget: (id: string) => void
  readonly onMarkForReview: (id: string) => void
  readonly onAddLegalHold: (id: string, reasonEn: string, reasonFr: string) => void
  readonly onRemoveLegalHold: (id: string) => void
  readonly onRetry: () => void
}

export function ProductionMemoriesTab({
  loading,
  loadFailed,
  rows,
  query,
  setQuery,
  subjectFilter,
  setSubjectFilter,
  subjectLabel,
  subjectHref,
  editId,
  editDraft,
  setEditDraft,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onConfirm,
  onForget,
  onMarkForReview,
  onAddLegalHold,
  onRemoveLegalHold,
  onRetry,
}: ProductionMemoriesTabProps) {
  const { x, lang } = useI18n()
  if (loading) {
    return <div className="px-[24px] py-[40px] text-center text-[13px] text-text-faint">{x(M.memory_prod_loading)}</div>
  }
  if (loadFailed) {
    return (
      <div className="px-[24px] py-[40px] text-center">
        <p className="m-0 mb-[12px] text-[13px] text-text-muted">{x(M.memory_prod_error)}</p>
        <button type="button" onClick={onRetry} className="cursor-pointer rounded-[9px] border border-border bg-surface px-[14px] py-[8px] font-sans text-[13px] font-semibold text-text-2">
          {x(M.memory_prod_retry)}
        </button>
      </div>
    )
  }
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[1200px] px-[16px] pt-[18px] pb-[40px] md:px-[24px]">
        <div className="mb-[12px] flex flex-wrap items-center gap-[8px]">
          <div className="flex min-w-[200px] flex-1 items-center gap-[8px] rounded-[9px] border border-border bg-surface px-[11px] py-[7px]">
            <Search size={14} strokeWidth={1.7} className="text-text-faint" aria-hidden="true" />
            <label className="sr-only" htmlFor="mem-prod-search">{x(M.memory_filter_search)}</label>
            <input
              id="mem-prod-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={x(M.memory_filter_search)}
              className="min-w-0 flex-1 border-none bg-transparent font-sans text-[12.5px] text-text outline-none"
            />
          </div>
          <label className="sr-only" htmlFor="mem-prod-filter-subject">{x(M.memory_filter_subject)}</label>
          <select
            id="mem-prod-filter-subject"
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value as MemoryScope | 'all')}
            className={selectClass}
          >
            <option value="all">{x(M.memory_filter_subject)}</option>
            <option value="person">{x(M.memory_add_person)}</option>
            <option value="case">{x(M.memory_add_case)}</option>
            <option value="thread">{x(M.memory_nav_conversations)}</option>
          </select>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-[14px] border border-border-soft bg-surface px-[24px] py-[40px] text-center">
            <Lightbulb size={20} strokeWidth={1.7} className="mx-auto mb-[10px] text-gold-fg" aria-hidden="true" />
            <p className="m-0 text-[13px] text-text-muted">{x(M.memory_prod_empty)}</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[14px] border border-border-soft bg-surface">
            {rows.map((fact) => {
              const status = effectiveStatus(fact)
              const sensitivity = effectiveSensitivity(fact)
              const statusMeta = STATUS_META[status]
              const sensMeta = SENSITIVITY_META[sensitivity]
              const sourceMeta = SOURCE_META[fact.source.type]
              const StatusIcon = statusMeta.icon
              const SourceIcon = sourceMeta.icon
              const href = subjectHref(fact)
              if (editId === fact.id) {
                return (
                  <div key={fact.id} className="flex items-center gap-[8px] px-[14px] py-[10px]">
                    <input
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') onSaveEdit(fact.id)
                        if (e.key === 'Escape') onCancelEdit()
                      }}
                      className="min-w-0 flex-1 rounded-[8px] border border-gold-dot px-[10px] py-[7px] font-sans text-[13.5px] text-text outline-none"
                    />
                    <button type="button" onClick={() => onSaveEdit(fact.id)} className="cursor-pointer rounded-[7px] border-none bg-navy px-[11px] py-[7px] font-sans text-[12px] font-bold text-white">
                      {x(M.memory_action_save)}
                    </button>
                    <button type="button" onClick={onCancelEdit} className="cursor-pointer rounded-[7px] border border-border bg-surface px-[10px] py-[7px] font-sans text-[12px] font-semibold text-text-muted">
                      {x(M.memory_action_cancel)}
                    </button>
                  </div>
                )
              }
              return (
                <div key={fact.id} className="border-t border-inset px-[14px] py-[11px] first:border-t-0 hover:bg-surface-2">
                  <div className="flex flex-wrap items-center gap-x-[8px] gap-y-[3px]">
                    <span className={`inline-flex items-center gap-[4px] rounded-[100px] border px-[7px] py-[2px] text-[10px] font-bold ${statusMeta.badge}`}>
                      <StatusIcon size={11} strokeWidth={2} aria-hidden="true" />
                      {pick(statusMeta.label, lang)}
                    </span>
                    {fact.classification != null && fact.classification !== 'fact' && (
                      <span className="inline-flex items-center rounded-[100px] border border-border bg-inset px-[6px] py-[1px] text-[10px] font-semibold text-text-muted">
                        {pick(CLASSIFICATION_META[fact.classification].label, lang)}
                      </span>
                    )}
                    {fact.legalHold != null && (
                      <span className="inline-flex items-center gap-[3px] rounded-[100px] border border-risk-border bg-risk-bg px-[6px] py-[1px] text-[10px] font-bold text-risk-dot">
                        <Gavel size={10} strokeWidth={2} aria-hidden="true" />
                        {x(M.memory_row_legal_hold)}
                      </span>
                    )}
                    <span className="text-[13px] font-medium text-text">{pickL(fact.statement, lang)}</span>
                  </div>
                  <div className="mt-[5px] flex flex-wrap items-center gap-x-[12px] gap-y-[4px] text-[11.5px] text-text-faint">
                    <span className="inline-flex items-center gap-[4px]">
                      <SourceIcon size={12} strokeWidth={1.7} aria-hidden="true" />
                      {href != null ? (
                        <Link to={href} className="text-text-2 no-underline hover:underline">{subjectLabel(fact)}</Link>
                      ) : (
                        subjectLabel(fact)
                      )}
                    </span>
                    <span>· {pick(sourceMeta.kind, lang)}</span>
                    {fact.confirmation != null && (
                      <span className="inline-flex items-center gap-[4px]">
                        <Check size={12} strokeWidth={1.7} aria-hidden="true" />
                        {formatMemoryDate(fact.confirmation.at, lang, fact.learnedAt)}
                      </span>
                    )}
                    {sensitivity === 'restricted' && (
                      <span className={`inline-flex items-center gap-[4px] rounded-[100px] border px-[7px] py-[2px] text-[10px] font-bold ${sensMeta.badge}`}>
                        <Lock size={11} strokeWidth={2} aria-hidden="true" />
                        {pick(sensMeta.label, lang)}
                      </span>
                    )}
                    {fact.retrievalScope != null && fact.retrievalScope.type !== 'workspace' && (
                      <span className="inline-flex items-center gap-[3px]">
                        · {x(M.memory_retrieval_scope)}: {pick(RETRIEVAL_SCOPE_META[fact.retrievalScope.type].label, lang)}
                      </span>
                    )}
                  </div>
                  <div className="mt-[6px] flex flex-wrap gap-[6px]">
                    {status === 'proposed' && (
                      <button type="button" onClick={() => onConfirm(fact.id)} className="flex cursor-pointer items-center gap-[4px] rounded-[7px] border-none bg-ok-bg px-[10px] py-[5px] font-sans text-[11.5px] font-bold text-ok-fg">
                        <Check size={12} strokeWidth={2.2} aria-hidden="true" />
                        {x(M.memory_action_confirm)}
                      </button>
                    )}
                    {status !== 'needs_review' && status !== 'removed' && (
                      <button type="button" onClick={() => onMarkForReview(fact.id)} className="flex cursor-pointer items-center gap-[4px] rounded-[7px] border border-border bg-surface px-[9px] py-[5px] font-sans text-[11.5px] font-semibold text-text-muted">
                        <Clock size={12} strokeWidth={1.7} aria-hidden="true" />
                        {x(M.memory_action_mark_review)}
                      </button>
                    )}
                    <button type="button" onClick={() => onStartEdit(fact)} className="flex cursor-pointer items-center gap-[4px] rounded-[7px] border border-border bg-surface px-[9px] py-[5px] font-sans text-[11.5px] font-semibold text-text-muted">
                      <Pencil size={12} strokeWidth={1.7} aria-hidden="true" />
                      {x(M.memory_action_edit)}
                    </button>
                    {fact.legalHold != null ? (
                      <button type="button" onClick={() => onRemoveLegalHold(fact.id)} className="flex cursor-pointer items-center gap-[4px] rounded-[7px] border border-border bg-surface px-[9px] py-[5px] font-sans text-[11.5px] font-semibold text-text-muted">
                        <Gavel size={12} strokeWidth={1.7} aria-hidden="true" />
                        {x(M.memory_action_remove_hold)}
                      </button>
                    ) : (
                      <button type="button" onClick={() => onAddLegalHold(fact.id, pickL(fact.statement, 'en'), pickL(fact.statement, 'fr'))} className="flex cursor-pointer items-center gap-[4px] rounded-[7px] border border-border bg-surface px-[9px] py-[5px] font-sans text-[11.5px] font-semibold text-text-muted">
                        <Gavel size={12} strokeWidth={1.7} aria-hidden="true" />
                        {x(M.memory_action_add_hold)}
                      </button>
                    )}
                    <button type="button" onClick={() => onForget(fact.id)} className="flex cursor-pointer items-center gap-[4px] rounded-[7px] border border-risk-border bg-surface px-[9px] py-[5px] font-sans text-[11.5px] font-semibold text-risk-dot">
                      <Trash2 size={12} strokeWidth={1.7} aria-hidden="true" />
                      {x(M.memory_action_remove)}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/* --------------------------------------------------------------- Review */

export function ProductionReviewTab({
  rows,
  subjectLabel,
  onConfirm,
  onReject,
}: {
  readonly rows: readonly MemoryFact[]
  readonly subjectLabel: (f: MemoryFact) => string
  readonly onConfirm: (id: string) => void
  readonly onReject: (id: string) => void
}) {
  const { x, lang } = useI18n()
  if (rows.length === 0) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[920px] px-[24px] py-[40px] text-center">
          <Check size={22} strokeWidth={1.8} className="mx-auto mb-[10px] text-ok-fg" aria-hidden="true" />
          <p className="m-0 text-[13px] text-text-muted">{x(M.memory_review_empty)}</p>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[920px] px-[16px] pt-[18px] pb-[40px] md:px-[24px]">
        <ul className="m-0 list-none space-y-[10px] p-0">
          {rows.map((fact) => {
            const sourceMeta = SOURCE_META[fact.source.type]
            const SourceIcon = sourceMeta.icon
            return (
              <li key={fact.id} className="overflow-hidden rounded-[13px] border border-gold-border bg-surface px-[15px] py-[13px]">
                <div className="mb-[8px] text-[14px] font-medium leading-normal text-text">{pickL(fact.statement, lang)}</div>
                <div className="mb-[8px] flex flex-wrap items-center gap-x-[12px] gap-y-[4px] text-[11.5px] text-text-faint">
                  <span className="inline-flex items-center gap-[4px]">
                    <SourceIcon size={12} strokeWidth={1.7} aria-hidden="true" />
                    {subjectLabel(fact)} · {pick(sourceMeta.kind, lang)}
                  </span>
                  <span>{x(M.memory_review_proposed_at)} {formatMemoryDate(fact.learnedAt, lang, fact.learnedAt)}</span>
                </div>
                <div className="flex flex-wrap gap-[7px]">
                  <button type="button" onClick={() => onConfirm(fact.id)} className="flex cursor-pointer items-center gap-[5px] rounded-[8px] border-none bg-ok-bg px-[12px] py-[7px] font-sans text-[12.5px] font-bold text-ok-fg">
                    <Check size={14} strokeWidth={2.2} aria-hidden="true" />
                    {x(M.memory_action_confirm)}
                  </button>
                  <button type="button" onClick={() => onReject(fact.id)} className="flex cursor-pointer items-center gap-[5px] rounded-[8px] border border-risk-border bg-surface px-[11px] py-[7px] font-sans text-[12.5px] font-semibold text-risk-dot">
                    <X size={14} strokeWidth={2} aria-hidden="true" />
                    {x(M.memory_action_reject)}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

/* --------------------------------------------------------------- Activity */

const AUDIT_ACTION_LABEL: Record<ProductionMemoryAuditEntry['action'], Bi> = {
  create: M.memory_audit_created,
  proposed: M.memory_audit_proposed,
  confirm: M.memory_audit_confirmed,
  rejected: M.memory_audit_rejected,
  correct: M.memory_audit_edited,
  edited: M.memory_audit_edited,
  forget: M.memory_audit_removed,
  restored: M.memory_audit_restored,
  expired: M.memory_audit_expired,
  exported: M.memory_audit_exported,
  legal_hold_added: M.memory_audit_legal_hold_added,
  legal_hold_removed: M.memory_audit_legal_hold_removed,
  review_requested: M.memory_audit_review_requested,
  memory_disabled: M.memory_audit_memory_disabled,
  memory_enabled: M.memory_audit_memory_enabled,
}

export function ProductionActivityTab({ audit }: { readonly audit: readonly ProductionMemoryAuditEntry[] }) {
  const { x, lang } = useI18n()
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[1000px] px-[16px] pt-[18px] pb-[40px] md:px-[24px]">
        <div className="mb-[10px] flex items-center gap-[8px] text-[12px] text-text-faint">
          <History size={14} strokeWidth={1.7} aria-hidden="true" />
          {x(M.memory_activity_note)}
        </div>
        {audit.length === 0 ? (
          <div className="rounded-[14px] border border-border-soft bg-surface px-[24px] py-[40px] text-center text-[13px] text-text-faint">
            {x(M.memory_activity_empty)}
          </div>
        ) : (
          <div className="overflow-hidden rounded-[14px] border border-border-soft bg-surface">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border-soft text-[11px] font-bold tracking-wider text-text-faint uppercase">
                  <th scope="col" className="px-[14px] py-[9px]">{x(M.memory_activity_event)}</th>
                  <th scope="col" className="px-[14px] py-[9px]">{x(M.memory_activity_actor)}</th>
                  <th scope="col" className="px-[14px] py-[9px] hidden md:table-cell">{x(M.memory_activity_when)}</th>
                </tr>
              </thead>
              <tbody>
                {audit.map((entry) => (
                  <tr key={entry.id} className="border-t border-inset align-top">
                    <td className="px-[14px] py-[10px] text-[12.5px] text-text-2">
                      <span className="font-semibold">{pick(AUDIT_ACTION_LABEL[entry.action], lang)}</span>
                      {entry.statement != null && (
                        <div className="mt-[2px] text-[12px] text-text-faint">“{pickL(entry.statement, lang)}”</div>
                      )}
                    </td>
                    <td className="px-[14px] py-[10px] text-[12.5px] text-text-muted">{entry.actorUserId ?? '—'}</td>
                    <td className="px-[14px] py-[10px] text-[12.5px] text-text-faint hidden md:table-cell">
                      {formatMemoryDate(entry.createdAt, lang, entry.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

/* --------------------------------------------------------------- Governance */

export interface ProductionGovernanceTabProps {
  readonly memoryEnabled: boolean
  readonly setMemoryEnabled: (v: boolean) => void
  readonly onExport: () => void
  readonly peopleWithFacts: readonly ProductionEmployee[]
  readonly forgetPersonId: string
  readonly setForgetPersonId: (v: string) => void
  readonly onBulkForgetPerson: () => void
  readonly forgetting: boolean
}

export function ProductionGovernanceTab({
  memoryEnabled,
  setMemoryEnabled,
  onExport,
  peopleWithFacts,
  forgetPersonId,
  setForgetPersonId,
  onBulkForgetPerson,
  forgetting,
}: ProductionGovernanceTabProps) {
  const { x } = useI18n()
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[920px] px-[16px] pt-[18px] pb-[40px] md:px-[24px]">
        <div className="flex flex-col gap-[14px]">
          <section className={cardClass}>
            <div className="mb-[8px] flex items-center gap-[7px] text-[13px] font-bold text-text">
              <Power size={15} strokeWidth={1.8} className="text-text-muted" aria-hidden="true" />
              {x(M.memory_gov_status_title)}
            </div>
            <p className="m-0 mb-[12px] text-[12.5px] leading-normal text-text-muted">{x(M.memory_gov_status_note)}</p>
            <button
              type="button"
              onClick={() => setMemoryEnabled(!memoryEnabled)}
              className={`cursor-pointer rounded-[9px] border px-[14px] py-[9px] font-sans text-[13px] font-bold ${
                memoryEnabled ? 'border-risk-border bg-surface text-risk-dot' : 'border-navy bg-navy text-white'
              }`}
            >
              {memoryEnabled ? x(M.memory_gov_status_disable) : x(M.memory_gov_status_enable)}
            </button>
            <p className="mt-[8px] flex items-start gap-[6px] text-[11.5px] leading-normal text-text-faint">
              <AlertTriangle size={13} strokeWidth={1.7} className="mt-[1px] shrink-0" aria-hidden="true" />
              {x(M.memory_prod_gov_toggle_session_only)}
            </p>
          </section>

          <section className={cardClass}>
            <div className="mb-[8px] flex items-center gap-[7px] text-[13px] font-bold text-text">
              <ShieldCheck size={15} strokeWidth={1.8} className="text-text-muted" aria-hidden="true" />
              {x(M.memory_gov_privacy_title)}
            </div>
            <p className="m-0 mb-[10px] text-[12.5px] leading-normal text-text-muted">{x(M.memory_gov_privacy_note)}</p>
            <p className="m-0 text-[12px] leading-normal text-text-faint">{x(M.memory_gov_privacy_rights)}</p>
          </section>

          <section className={cardClass}>
            <div className="mb-[8px] flex items-center gap-[7px] text-[13px] font-bold text-text">
              <Clock size={15} strokeWidth={1.8} className="text-text-muted" aria-hidden="true" />
              {x(M.memory_gov_retention_title)}
            </div>
            <p className="m-0 text-[12.5px] leading-normal text-text-muted">{x(M.memory_prod_retention_note)}</p>
          </section>

          <section className={cardClass}>
            <div className="mb-[8px] flex items-center gap-[7px] text-[13px] font-bold text-text">
              <Lock size={15} strokeWidth={1.8} className="text-text-muted" aria-hidden="true" />
              {x(M.memory_gov_access_title)}
            </div>
            <p className="m-0 text-[12.5px] leading-normal text-text-muted">{x(M.memory_gov_access_note)}</p>
          </section>

          <section className={cardClass}>
            <div className="mb-[8px] flex items-center gap-[7px] text-[13px] font-bold text-text">
              <FileText size={15} strokeWidth={1.8} className="text-text-muted" aria-hidden="true" />
              {x(M.memory_gov_data_title)}
            </div>
            <p className="m-0 mb-[12px] text-[12.5px] leading-normal text-text-muted">{x(M.memory_gov_data_export_note)}</p>
            <button
              type="button"
              onClick={onExport}
              className="mb-[16px] flex cursor-pointer items-center gap-[7px] rounded-[10px] border border-border bg-surface px-[14px] py-[9px] font-sans text-[13px] font-bold text-text-2"
            >
              <FileText size={15} strokeWidth={1.8} aria-hidden="true" />
              {x(M.memory_gov_data_export)}
            </button>
            <div className="rounded-[10px] border border-border-soft bg-surface-2 px-[12px] py-[11px]">
              <div className="mb-[6px] flex items-center gap-[6px]">
                <Trash2 size={14} strokeWidth={1.8} className="text-risk-dot" aria-hidden="true" />
                <span className="text-[12.5px] font-bold text-risk-dot">{x(M.memory_gov_data_remove_person)}</span>
              </div>
              <p className="m-0 mb-[10px] text-[12px] leading-normal text-text-muted">{x(M.memory_gov_data_remove_person_note)}</p>
              {peopleWithFacts.length === 0 ? (
                <div className="text-[12px] text-text-faint">{x(M.memory_gov_data_remove_person_none)}</div>
              ) : (
                <div className="flex flex-col gap-[8px] sm:flex-row">
                  <label className="sr-only" htmlFor="mem-prod-forget">{x(M.memory_gov_data_remove_person)}</label>
                  <select
                    id="mem-prod-forget"
                    value={forgetPersonId}
                    onChange={(e) => setForgetPersonId(e.target.value)}
                    className={`${inputClass} sm:flex-1`}
                  >
                    <option value="">{x(M.memory_gov_data_remove_person_select)}</option>
                    {peopleWithFacts.map((e) => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!forgetPersonId || forgetting}
                    onClick={onBulkForgetPerson}
                    className="flex cursor-pointer items-center justify-center gap-[7px] rounded-[10px] border border-risk-border bg-surface px-[14px] py-[9px] font-sans text-[13px] font-bold text-risk-dot disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 size={14} strokeWidth={1.8} aria-hidden="true" />
                    {x(M.memory_gov_data_remove_person)}
                  </button>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[13px] border border-risk-border bg-surface px-[15px] py-[14px]">
            <div className="mb-[8px] flex items-center gap-[7px] text-[13px] font-bold text-risk-dot">
              <AlertTriangle size={15} strokeWidth={1.8} aria-hidden="true" />
              {x(M.memory_gov_danger_title)}
            </div>
            <p className="m-0 mb-[10px] text-[12.5px] leading-normal text-text-muted">{x(M.memory_gov_danger_delete_note)}</p>
            <button
              type="button"
              disabled
              className="flex cursor-not-allowed items-center gap-[7px] rounded-[10px] border border-risk-border bg-surface px-[14px] py-[9px] font-sans text-[13px] font-bold text-risk-dot opacity-60"
              title={x(M.memory_gov_danger_delete_todo)}
            >
              <Trash2 size={15} strokeWidth={1.8} aria-hidden="true" />
              {x(M.memory_gov_danger_delete)}
            </button>
            <p className="mt-[8px] flex items-start gap-[6px] text-[11.5px] leading-normal text-text-faint">
              <Gavel size={13} strokeWidth={1.7} className="mt-[1px] shrink-0" aria-hidden="true" />
              {x(M.memory_gov_danger_delete_todo)}
            </p>
          </section>
        </div>
        <Disclaimer className="mt-[16px]" />
      </div>
    </div>
  )
}

export { type Bi }
