import { useMemo, useState } from 'react'
import { AlertTriangle, Check, Pencil, X } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { pick, pickL } from '@/i18n/core'
import { memoryMessages as M } from '@/i18n/messages/memory'
import type { MemoryFact } from '@/data'
import { memoryScenarioTodayISO } from '@/data'
import { useMemoryStore, memoryActions } from './memoryStore'
import { demoSubjectMaps, resolveSubject } from './memoryWorkspace'
import { SENSITIVITY_META, SOURCE_META, effectiveSensitivity, effectiveStatus } from './memoryModel'
import { formatMemoryDate } from './memoryDates'
import { MemoryConfirmDialog } from './MemoryConfirmDialog'

/**
 * Review queue — proposed memories requiring a human decision before they
 * become active Advisor memory. Each proposal shows the proposed memory,
 * subject, source, source excerpt, why Advisor proposed it, confidence,
 * sensitivity, date, and approve / edit-before-confirming / reject actions.
 * Sensitive information shows an additional necessity warning and is never
 * auto-confirmed.
 */
export function MemoryReviewTab() {
  const { x, lang } = useI18n()
  const { facts } = useMemoryStore()
  const maps = useMemo(() => demoSubjectMaps(), [])
  const todayISO = memoryScenarioTodayISO
  const [editId, setEditId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [rejectFact, setRejectFact] = useState<MemoryFact | null>(null)

  const proposed = facts.filter((f) => {
    const s = effectiveStatus(f)
    return s === 'proposed' || s === 'needs_review'
  })

  const startEdit = (fact: MemoryFact) => {
    setEditDraft(pickL(fact.statement, lang))
    setEditId(fact.id)
  }
  const saveEdit = () => {
    if (editId != null) memoryActions.correct(editId, editDraft)
    setEditId(null)
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[920px] px-[16px] pt-[18px] pb-[40px] md:px-[24px]">
        {proposed.length === 0 ? (
          <div className="rounded-[14px] border border-border-soft bg-surface px-[24px] py-[40px] text-center">
            <Check size={22} strokeWidth={1.8} className="mx-auto mb-[10px] text-ok-fg" aria-hidden="true" />
            <p className="m-0 text-[13px] text-text-muted">{x(M.memory_review_empty)}</p>
          </div>
        ) : (
          <ul className="m-0 list-none space-y-[10px] p-0">
            {proposed.map((fact) => {
              const subject = resolveSubject(fact, maps, lang)
              const sensitivity = effectiveSensitivity(fact)
              const sensMeta = SENSITIVITY_META[sensitivity]
              const sourceMeta = SOURCE_META[fact.source.type]
              const restricted = sensitivity === 'restricted'
              const SourceIcon = sourceMeta.icon
              const SensIcon = sensMeta.icon
              return (
                <li
                  key={fact.id}
                  className="overflow-hidden rounded-[13px] border border-gold-border bg-surface"
                >
                  <div className="px-[15px] py-[13px]">
                    {/* Statement */}
                    {editId === fact.id ? (
                      <div className="mb-[10px]">
                        <label className="sr-only" htmlFor={`review-edit-${fact.id}`}>
                          {x(M.memory_edit_label)}
                        </label>
                        <textarea
                          id={`review-edit-${fact.id}`}
                          value={editDraft}
                          onChange={(e) => setEditDraft(e.target.value)}
                          rows={3}
                          className="w-full resize-y rounded-[9px] border border-gold-dot bg-surface px-[11px] py-[9px] font-sans text-[13.5px] text-text outline-none"
                        />
                        <div className="mt-[8px] flex gap-[7px]">
                          <button
                            type="button"
                            onClick={saveEdit}
                            className="flex cursor-pointer items-center gap-[5px] rounded-[8px] border-none bg-navy px-[12px] py-[7px] font-sans text-[12.5px] font-bold text-white"
                          >
                            <Check size={14} strokeWidth={2.2} aria-hidden="true" />
                            {x(M.memory_action_edit_confirm)}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditId(null)}
                            className="cursor-pointer rounded-[8px] border border-border bg-surface px-[11px] py-[7px] font-sans text-[12.5px] font-semibold text-text-muted"
                          >
                            {x(M.memory_action_cancel)}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-[8px] text-[14px] leading-normal font-medium text-text">
                        {pickL(fact.statement, lang)}
                      </div>
                    )}

                    {/* Provenance */}
                    <div className="mb-[8px] flex flex-wrap items-center gap-x-[12px] gap-y-[4px] text-[11.5px] text-text-faint">
                      <span className="inline-flex items-center gap-[4px]">
                        <SourceIcon size={12} strokeWidth={1.7} aria-hidden="true" />
                        {subject.label} · {pick(sourceMeta.kind, lang)}
                      </span>
                      <span>{x(M.memory_review_proposed_at)} {formatMemoryDate(fact.learnedAt, lang, todayISO)}</span>
                      {fact.confidenceScore != null && (
                        <span className="font-semibold text-text-muted">
                          {x(M.memory_details_confidence)} {Math.round(fact.confidenceScore * 100)}%
                        </span>
                      )}
                      <span className={`inline-flex items-center gap-[4px] rounded-[100px] border px-[7px] py-[2px] text-[10px] font-bold ${sensMeta.badge}`}>
                        <SensIcon size={11} strokeWidth={2} aria-hidden="true" />
                        {pick(sensMeta.label, lang)}
                      </span>
                    </div>

                    {/* Source excerpt */}
                    {fact.sourceExcerpt != null && (
                      <blockquote className="m-0 mb-[8px] border-l-2 border-border-soft pl-[10px] text-[12.5px] italic text-text-muted">
                        {pickL(fact.sourceExcerpt, lang)}
                      </blockquote>
                    )}

                    {/* Why proposed */}
                    <div className="mb-[8px] text-[12px] leading-normal text-text-muted">
                      <span className="font-semibold text-text-2">{x(M.memory_review_why)}:</span>{' '}
                      {pick(fact.source.detail, lang)}
                    </div>

                    {/* Sensitive warning */}
                    {restricted && (
                      <div className="mb-[10px] flex items-start gap-[8px] rounded-[10px] border border-risk-border bg-surface px-[11px] py-[9px]">
                        <AlertTriangle size={14} strokeWidth={1.8} className="mt-[1px] shrink-0 text-risk-dot" aria-hidden="true" />
                        <div className="text-[12px] leading-normal text-text-muted">{x(M.memory_review_sensitive_warning)}</div>
                      </div>
                    )}

                    {/* Actions */}
                    {editId !== fact.id && (
                      <div className="flex flex-wrap gap-[7px]">
                        <button
                          type="button"
                          onClick={() => memoryActions.confirm(fact.id)}
                          className="flex cursor-pointer items-center gap-[5px] rounded-[8px] border-none bg-ok-bg px-[12px] py-[7px] font-sans text-[12.5px] font-bold text-ok-fg"
                        >
                          <Check size={14} strokeWidth={2.2} aria-hidden="true" />
                          {x(M.memory_action_confirm)}
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(fact)}
                          className="flex cursor-pointer items-center gap-[5px] rounded-[8px] border border-border bg-surface px-[11px] py-[7px] font-sans text-[12.5px] font-semibold text-text-muted"
                        >
                          <Pencil size={14} strokeWidth={1.7} aria-hidden="true" />
                          {x(M.memory_action_edit_confirm)}
                        </button>
                        <button
                          type="button"
                          onClick={() => setRejectFact(fact)}
                          className="flex cursor-pointer items-center gap-[5px] rounded-[8px] border border-risk-border bg-surface px-[11px] py-[7px] font-sans text-[12.5px] font-semibold text-risk-dot"
                        >
                          <X size={14} strokeWidth={2} aria-hidden="true" />
                          {x(M.memory_action_reject)}
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <MemoryConfirmDialog
        open={rejectFact != null}
        title={x(M.memory_confirm_reject_title)}
        confirmLabel={x(M.memory_action_reject)}
        onClose={() => setRejectFact(null)}
        onConfirm={() => {
          if (rejectFact) memoryActions.reject(rejectFact.id)
          setRejectFact(null)
        }}
      >
        {x(M.memory_confirm_reject_body)}
      </MemoryConfirmDialog>
    </div>
  )
}
