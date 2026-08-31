import { useState } from 'react'
import { Check, Clock, Pencil, Trash2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { pick, pickL } from '@/i18n/core'
import type { Bi } from '@/i18n/core'
import { memoryMessages as M } from '@/i18n/messages/memory'
import type { MemoryFact } from '@/data'
import { CONFIDENCE_META, SOURCE_META, VISIBILITY_META } from './memoryModel'
import { formatMemoryDate, memoryDateReferenceISO } from './memoryDates'
import { memoryActions } from './memoryStore'

/**
 * One governed memory row (Advisor Memory prototype `memRowVO` markup):
 * confidence dot + statement (or the inline Correct editor) + provenance
 * line (source · learned/confirmed · visibility) + the three first-class
 * actions (Confirm on inferred rows, Correct, Forget) + confidence badge.
 * The manager variant prepends a scope tag line.
 */
export interface MemoryFactRowProps {
  readonly fact: MemoryFact
  /** Demo fixtures pass the scenario reference day so "Today" stays deterministic. */
  readonly dateReferenceISO?: string
  /** Manager rows show which scope the fact lives in. */
  readonly scopeTag?: { icon: LucideIcon; label: Bi | string }
  /** Production mode passes persistence callbacks; demo defaults to memoryStore. */
  readonly onConfirm?: (id: string) => void
  readonly onCorrect?: (id: string, statement: string) => void
  readonly onForget?: (id: string) => void
}

export function MemoryFactRow({
  fact,
  scopeTag,
  dateReferenceISO,
  onConfirm,
  onCorrect,
  onForget,
}: MemoryFactRowProps) {
  const { x, lang } = useI18n()
  const dateReference = memoryDateReferenceISO(dateReferenceISO)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  const conf = CONFIDENCE_META[fact.confidence]
  const source = SOURCE_META[fact.source.type]
  const visibility = VISIBILITY_META[fact.visibility]
  const SourceIcon = source.icon
  const VisibilityIcon = visibility.icon
  const ScopeIcon = scopeTag?.icon

  const confirm = onConfirm ?? memoryActions.confirm
  const correct = onCorrect ?? memoryActions.correct
  const forget = onForget ?? memoryActions.forget

  const startEdit = () => {
    setDraft(pickL(fact.statement, lang))
    setEditing(true)
  }
  const save = () => {
    correct(fact.id, draft)
    setEditing(false)
  }

  return (
    <div className="group border-t border-inset px-[15px] py-[13px] first:border-t-0">
      <div className="flex items-start gap-[11px]">
        <span
          title={pick(conf.label, lang)}
          className={`mt-[6px] h-[9px] w-[9px] shrink-0 rounded-full ${conf.dot}`}
        />
        <div className="min-w-0 flex-1">
          {ScopeIcon && scopeTag && (
            <div className="mb-[5px] flex items-center gap-[6px]">
              <ScopeIcon
                size={13}
                strokeWidth={1.7}
                className="text-text-faint"
                aria-hidden="true"
              />
              <span className="text-[11px] font-semibold text-text-faint">
                {typeof scopeTag.label === 'string' ? scopeTag.label : pick(scopeTag.label, lang)}
              </span>
            </div>
          )}

          {editing ? (
            <div className="mb-[7px] flex items-center gap-[8px]">
              <label className="sr-only" htmlFor={`memory-edit-${fact.id}`}>
                {x(M.memory_edit_label)}
              </label>
              <input
                id={`memory-edit-${fact.id}`}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') save()
                  if (e.key === 'Escape') setEditing(false)
                }}
                className="min-w-0 flex-1 rounded-[8px] border border-gold-dot px-[10px] py-[7px] font-sans text-[13.5px] text-text outline-none"
              />
              <button
                type="button"
                onClick={save}
                className="cursor-pointer rounded-[7px] border-none bg-navy px-[11px] py-[7px] font-sans text-[12px] font-bold text-white"
              >
                {x(M.memory_action_save)}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="cursor-pointer rounded-[7px] border border-border bg-surface px-[10px] py-[7px] font-sans text-[12px] font-semibold text-text-muted"
              >
                {x(M.memory_action_cancel)}
              </button>
            </div>
          ) : (
            <div className="text-[14px] leading-normal font-medium text-text">
              {pickL(fact.statement, lang)}
            </div>
          )}

          {/* Provenance line */}
          <div className="mt-[7px] flex flex-wrap items-center gap-x-[12px] gap-y-[5px]">
            <span className="inline-flex items-center gap-[5px] text-[11.5px] text-text-faint">
              <SourceIcon size={13} strokeWidth={1.7} className="opacity-80" aria-hidden="true" />
              {pick(source.kind, lang)} · {pick(fact.source.detail, lang)}
            </span>
            <span className="inline-flex items-center gap-[5px] text-[11.5px] text-text-faint">
              <Clock size={13} strokeWidth={1.7} className="opacity-70" aria-hidden="true" />
              {x(M.memory_learned)} {formatMemoryDate(fact.learnedAt, lang, dateReference)} ·{' '}
              {fact.confirmation !== null
                ? `${x(M.memory_confirmed_on)} ${formatMemoryDate(fact.confirmation.at, lang, dateReference)}`
                : x(M.memory_not_confirmed)}
            </span>
            <span
              className={`inline-flex items-center gap-[5px] text-[11px] font-semibold ${visibility.className}`}
            >
              <VisibilityIcon size={14} strokeWidth={1.7} aria-hidden="true" />
              {pick(visibility.label, lang)}
            </span>
          </div>

          {/* Actions — rendered at full opacity: a resting dim (opacity-60)
              pushed the muted/risk button text below the 4.5:1 AA contrast
              floor, and the audit judges the resting state. */}
          <div className="mt-[10px] flex flex-wrap gap-[7px]">
            {fact.confidence === 'inferred' && (
              <button
                type="button"
                onClick={() => confirm(fact.id)}
                className="flex cursor-pointer items-center gap-[5px] rounded-[7px] border-none bg-ok-bg px-[11px] py-[5px] font-sans text-[12px] font-bold text-ok-fg"
              >
                <Check size={13} strokeWidth={2.2} aria-hidden="true" />
                {x(M.memory_action_confirm)}
              </button>
            )}
            <button
              type="button"
              onClick={startEdit}
              className="flex cursor-pointer items-center gap-[5px] rounded-[7px] border border-border bg-surface px-[10px] py-[5px] font-sans text-[12px] font-semibold text-text-muted"
            >
              <Pencil size={13} strokeWidth={1.7} aria-hidden="true" />
              {x(M.memory_action_correct)}
            </button>
            <button
              type="button"
              onClick={() => forget(fact.id)}
              className="flex cursor-pointer items-center gap-[5px] rounded-[7px] border border-risk-border bg-surface px-[10px] py-[5px] font-sans text-[12px] font-semibold text-risk-dot"
            >
              <Trash2 size={13} strokeWidth={1.7} aria-hidden="true" />
              {x(M.memory_action_forget)}
            </button>
          </div>
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-[5px] rounded-[100px] border px-[9px] py-[3px] text-[10.5px] font-bold ${conf.badge}`}
        >
          {pick(conf.label, lang)}
        </span>
      </div>
    </div>
  )
}
