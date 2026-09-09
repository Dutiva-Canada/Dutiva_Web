import { Check, Clock, Gavel, Lock, MoreHorizontal, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { pick, pickL } from '@/i18n/core'
import type { Lang } from '@/i18n/core'
import { memoryMessages as M } from '@/i18n/messages/memory'
import type { MemoryFact } from '@/data'
import {
  SOURCE_META,
  STATUS_META,
  SENSITIVITY_META,
  effectiveAdvisorUsable,
  effectiveSensitivity,
  effectiveStatus,
  isExpiringSoon,
  isUnderLegalHold,
} from './memoryModel'
import { formatMemoryDate } from './memoryDates'
import type { SubjectRef } from './memoryWorkspace'
import { memoryActions } from './memoryStore'

/**
 * One high-density memory row for the Memories list. Shows memory text,
 * subject, status, source, last verified, review/expiry, sensitivity and an
 * action menu. Status is never colour-only — a label + icon accompany every
 * state. Selecting the row (click or Enter) opens the details drawer.
 */
export interface MemoryListRowProps {
  readonly fact: MemoryFact
  readonly subject: SubjectRef
  readonly todayISO: string
  readonly memoryEnabled: boolean
  readonly menuOpen: boolean
  readonly onToggleMenu: () => void
  readonly onOpen: () => void
  readonly onEdit: () => void
  readonly onRemove: () => void
}

export function MemoryListRow({
  fact,
  subject,
  todayISO,
  memoryEnabled,
  menuOpen,
  onToggleMenu,
  onOpen,
  onEdit,
  onRemove,
}: MemoryListRowProps) {
  const { x, lang } = useI18n()
  const status = effectiveStatus(fact)
  const sensitivity = effectiveSensitivity(fact)
  const advisorUsable = effectiveAdvisorUsable(fact, memoryEnabled)
  const statusMeta = STATUS_META[status]
  const sensMeta = SENSITIVITY_META[sensitivity]
  const sourceMeta = SOURCE_META[fact.source.type]
  const onHold = isUnderLegalHold(fact)
  const expiring = isExpiringSoon(fact, todayISO)
  const StatusIcon = statusMeta.icon
  const SourceIcon = sourceMeta.icon
  const SensIcon = sensMeta.icon

  const dueDate = fact.expiryDate ?? fact.reviewDate
  const dueLabel = fact.expiryDate != null ? x(M.memory_row_expiry) : x(M.memory_row_review)

  return (
    <div className="border-t border-inset px-[14px] py-[11px] first:border-t-0 hover:bg-surface">
      <div className="flex items-start gap-[10px]">
        <button
          type="button"
          onClick={onOpen}
          aria-label={x(M.memory_row_open_details)}
          className="min-w-0 flex-1 cursor-pointer border-none bg-transparent p-0 text-left"
        >
          <div className="flex flex-wrap items-center gap-x-[8px] gap-y-[3px]">
            <span className={`inline-flex items-center gap-[4px] rounded-[100px] border px-[7px] py-[2px] text-[10px] font-bold ${statusMeta.badge}`}>
              <StatusIcon size={11} strokeWidth={2} aria-hidden="true" />
              {pick(statusMeta.label, lang)}
            </span>
            <span className="text-[13px] font-medium text-text">
              {pickL(fact.statement, lang)}
            </span>
          </div>
          <div className="mt-[5px] flex flex-wrap items-center gap-x-[12px] gap-y-[4px] text-[11.5px] text-text-faint">
            <span className="inline-flex items-center gap-[4px]">
              <SourceIcon size={12} strokeWidth={1.7} aria-hidden="true" />
              {subject.label}
            </span>
            <span className="inline-flex items-center gap-[4px]">
              <span aria-hidden="true">·</span>
              {pick(sourceMeta.kind, lang)}
            </span>
            {fact.lastVerifiedAt != null && (
              <span className="inline-flex items-center gap-[4px]">
                <Clock size={12} strokeWidth={1.7} aria-hidden="true" />
                {x(M.memory_row_verified)} {formatMemoryDate(fact.lastVerifiedAt, lang, todayISO)}
              </span>
            )}
            {dueDate != null && (
              <span className={`inline-flex items-center gap-[4px] ${expiring ? 'font-semibold text-gold-fg' : ''}`}>
                <AlertTriangle size={12} strokeWidth={1.7} aria-hidden="true" />
                {dueLabel} {formatMemoryDate(dueDate, lang, todayISO)}
              </span>
            )}
            {onHold && (
              <span className="inline-flex items-center gap-[4px] font-semibold text-risk-dot">
                <Gavel size={12} strokeWidth={1.7} aria-hidden="true" />
                {x(M.memory_row_legal_hold)}
              </span>
            )}
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-[6px]">
          {!advisorUsable && (
            <span
              className="hidden items-center gap-[4px] text-[10.5px] font-semibold text-text-faint sm:inline-flex"
              title={x(M.memory_row_not_advisor_usable)}
            >
              <Lock size={12} strokeWidth={2} aria-hidden="true" />
            </span>
          )}
          <span className={`hidden items-center gap-[4px] rounded-[100px] border px-[7px] py-[2px] text-[10px] font-bold sm:inline-flex ${sensMeta.badge}`}>
            <SensIcon size={11} strokeWidth={2} aria-hidden="true" />
            {pick(sensMeta.label, lang)}
          </span>
          <div className="relative">
            <button
              type="button"
              onClick={onToggleMenu}
              aria-label={x(M.memory_row_actions)}
              aria-expanded={menuOpen}
              className="flex min-h-[32px] min-w-[32px] cursor-pointer items-center justify-center rounded-[8px] border border-transparent bg-transparent text-text-muted hover:bg-inset"
            >
              <MoreHorizontal size={16} strokeWidth={2} aria-hidden="true" />
            </button>
            {menuOpen && (
              <div
                role="menu"
                aria-label={x(M.memory_row_actions)}
                className="absolute right-0 top-[34px] z-10 w-[200px] rounded-[10px] border border-border bg-surface-2 py-[5px] shadow-lg"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={onOpen}
                  className="flex w-full cursor-pointer items-center gap-[8px] border-none bg-transparent px-[12px] py-[7px] text-left text-[12.5px] text-text-2 hover:bg-surface"
                >
                  {x(M.memory_row_open_details)}
                </button>
                {(status === 'proposed' || status === 'needs_review') && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => memoryActions.confirm(fact.id)}
                    className="flex w-full cursor-pointer items-center gap-[8px] border-none bg-transparent px-[12px] py-[7px] text-left text-[12.5px] font-semibold text-ok-fg hover:bg-surface"
                  >
                    <Check size={13} strokeWidth={2.2} aria-hidden="true" />
                    {x(M.memory_action_confirm)}
                  </button>
                )}
                <button
                  type="button"
                  role="menuitem"
                  onClick={onEdit}
                  className="flex w-full cursor-pointer items-center gap-[8px] border-none bg-transparent px-[12px] py-[7px] text-left text-[12.5px] text-text-2 hover:bg-surface"
                >
                  <Pencil size={13} strokeWidth={1.7} aria-hidden="true" />
                  {x(M.memory_action_edit)}
                </button>
                {status !== 'removed' && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={onRemove}
                    className="flex w-full cursor-pointer items-center gap-[8px] border-none bg-transparent px-[12px] py-[7px] text-left text-[12.5px] font-semibold text-risk-dot hover:bg-surface"
                  >
                    <Trash2 size={13} strokeWidth={1.7} aria-hidden="true" />
                    {x(M.memory_action_remove)}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/** Inline edit affordance for the Memories list (edit-before-confirm). */
export function MemoryInlineEdit({
  fact,
  onSave,
  onCancel,
}: {
  readonly fact: MemoryFact
  readonly onSave: (statement: string) => void
  readonly onCancel: () => void
}) {
  const { x } = useI18n()
  return (
    <div className="flex items-center gap-[8px] px-[14px] py-[10px]">
      <label className="sr-only" htmlFor={`mem-edit-${fact.id}`}>
        {x(M.memory_edit_label)}
      </label>
      <input
        id={`mem-edit-${fact.id}`}
        defaultValue={pickL(fact.statement, 'en')}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).form?.requestSubmit?.()
          if (e.key === 'Escape') onCancel()
        }}
        className="min-w-0 flex-1 rounded-[8px] border border-gold-dot px-[10px] py-[7px] font-sans text-[13.5px] text-text outline-none"
      />
      <button
        type="button"
        onClick={() => {
          const el = document.getElementById(`mem-edit-${fact.id}`) as HTMLInputElement | null
          if (el) onSave(el.value)
        }}
        className="cursor-pointer rounded-[7px] border-none bg-navy px-[11px] py-[7px] font-sans text-[12px] font-bold text-white"
      >
        {x(M.memory_action_save)}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="cursor-pointer rounded-[7px] border border-border bg-surface px-[10px] py-[7px] font-sans text-[12px] font-semibold text-text-muted"
      >
        {x(M.memory_action_cancel)}
      </button>
    </div>
  )
}

export { type Lang }
