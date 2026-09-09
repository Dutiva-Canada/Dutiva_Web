import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronRight, X } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { pick } from '@/i18n/core'
import { memoryMessages as M } from '@/i18n/messages/memory'
import { cases, employees } from '@/data'
import type {
  MemoryCategory,
  MemoryClassification,
  MemoryRetentionCategory,
  MemoryRetrievalScopeType,
  MemoryScope,
} from '@/data'
import { memoryActions, type AddMemoryInput } from './memoryStore'
import {
  CLASSIFICATION_ORDER,
  CLASSIFICATION_META,
  RETENTION_CATEGORY_ORDER,
  RETENTION_CATEGORY_LABELS,
  RETRIEVAL_SCOPE_META,
} from './memoryModel'

/**
 * Add-memory dialog with progressive disclosure: subject + text are required;
 * classification, sensitivity, purpose and retention are advanced (collapsed)
 * with sensible defaults. Warns when sensitive information may be unnecessary.
 * Accessible: focus on open, Escape to close, labelled controls.
 */
export interface AddMemoryDialogProps {
  readonly open: boolean
  readonly onClose: () => void
}

const inputClass =
  'w-full rounded-[10px] border border-border bg-surface px-[12px] py-[9px] font-sans text-[13.5px] text-text outline-none'
const labelClass = 'mb-[5px] block text-[12px] font-semibold text-text-3'

export function AddMemoryDialog({ open, onClose }: AddMemoryDialogProps) {
  const { x, lang } = useI18n()
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const [scope, setScope] = useState<MemoryScope>('person')
  const [personId, setPersonId] = useState('')
  const [caseId, setCaseId] = useState('')
  const [textEn, setTextEn] = useState('')
  const [textFr, setTextFr] = useState('')
  const [classification, setClassification] = useState<MemoryClassification>('fact')
  const [sensitivity, setSensitivity] = useState<'standard' | 'restricted'>('standard')
  const [purpose, setPurpose] = useState('')
  const [retention, setRetention] = useState<MemoryRetentionCategory | ''>('')
  const [retrievalScope, setRetrievalScope] = useState<MemoryRetrievalScopeType | ''>('')
  const [advanced, setAdvanced] = useState(false)

  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => closeBtnRef.current?.focus(), 0)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(t)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  const reset = () => {
    setScope('person')
    setPersonId('')
    setCaseId('')
    setTextEn('')
    setTextFr('')
    setClassification('fact')
    setSensitivity('standard')
    setPurpose('')
    setRetention('')
    setRetrievalScope('')
    setAdvanced(false)
  }

  const entityId = scope === 'person' ? personId : scope === 'case' ? caseId : ''
  const canSubmit = entityId.length > 0 && textEn.trim().length > 0

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    const input: AddMemoryInput = {
      scope,
      entityId,
      category: 'note',
      statement: { en: textEn.trim(), fr: textFr.trim() || textEn.trim() },
      classification,
      sensitivity,
      ...(purpose.trim().length > 0 ? { purpose: { en: purpose.trim(), fr: purpose.trim() } } : {}),
      ...(retention !== '' ? { retentionCategory: retention } : {}),
      ...(retrievalScope !== ''
        ? { retrievalScope: { type: retrievalScope, ...(scope === 'case' && caseId ? { id: caseId } : {}) } }
        : {}),
    }
    memoryActions.addMemory(input)
    reset()
    onClose()
  }

  const showSensitiveWarning = sensitivity === 'restricted'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={x(M.memory_add_title)}
      className="fixed inset-0 z-90 flex items-center justify-center bg-black/45 p-[16px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <form
        onSubmit={onSubmit}
        className="w-full max-w-[560px] rounded-[14px] border border-border bg-surface-2 p-[18px] shadow-lg motion-safe:animate-[fadeIn_0.12s_ease-out]"
      >
        <div className="mb-[14px] flex items-start justify-between gap-[10px]">
          <h2 className="m-0 font-display text-[16px] font-semibold text-text">{x(M.memory_add_title)}</h2>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label={x(M.memory_details_close)}
            className="flex min-h-[36px] min-w-[36px] cursor-pointer items-center justify-center rounded-[8px] border-none bg-transparent text-text-muted hover:bg-inset"
          >
            <X size={16} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>

        <div className="grid gap-[12px]">
          {/* Subject */}
          <div className="grid gap-[12px] sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="mem-add-scope">
                {x(M.memory_add_subject)}
              </label>
              <select
                id="mem-add-scope"
                value={scope}
                onChange={(e) => setScope(e.target.value as MemoryScope)}
                className={inputClass}
              >
                <option value="person">{x(M.memory_add_person)}</option>
                <option value="case">{x(M.memory_add_case)}</option>
              </select>
            </div>
            <div>
              {scope === 'person' ? (
                <>
                  <label className={labelClass} htmlFor="mem-add-person">
                    {x(M.memory_add_person)}
                  </label>
                  <select
                    id="mem-add-person"
                    value={personId}
                    onChange={(e) => setPersonId(e.target.value)}
                    className={inputClass}
                    required
                  >
                    <option value="">{x(M.memory_add_select_person)}</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <>
                  <label className={labelClass} htmlFor="mem-add-case">
                    {x(M.memory_add_case)}
                  </label>
                  <select
                    id="mem-add-case"
                    value={caseId}
                    onChange={(e) => setCaseId(e.target.value)}
                    className={inputClass}
                    required
                  >
                    <option value="">{x(M.memory_add_select_case)}</option>
                    {cases.map((c) => (
                      <option key={c.id} value={c.id}>
                        {pick(c.title, lang)}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>
          </div>

          {/* Memory text */}
          <div>
            <label className={labelClass} htmlFor="mem-add-text">
              {x(M.memory_add_text)}
            </label>
            <textarea
              id="mem-add-text"
              value={textEn}
              onChange={(e) => setTextEn(e.target.value)}
              rows={3}
              className={`${inputClass} resize-y`}
              required
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="mem-add-text-fr">
              {x(M.memory_add_text_fr)}
            </label>
            <input
              id="mem-add-text-fr"
              value={textFr}
              onChange={(e) => setTextFr(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Advanced (progressive disclosure) */}
          <button
            type="button"
            onClick={() => setAdvanced((a) => !a)}
            aria-expanded={advanced}
            className="flex cursor-pointer items-center gap-[6px] border-none bg-transparent px-0 py-[2px] text-[12.5px] font-semibold text-text-muted"
          >
            {advanced ? (
              <ChevronDown size={14} strokeWidth={2} aria-hidden="true" />
            ) : (
              <ChevronRight size={14} strokeWidth={2} aria-hidden="true" />
            )}
            {x(M.memory_add_advanced)}
          </button>

          {advanced && (
            <div className="grid gap-[12px] rounded-[10px] border border-border-soft bg-surface p-[12px] sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="mem-add-class">
                  {x(M.memory_add_classification)}
                </label>
                <select
                  id="mem-add-class"
                  value={classification}
                  onChange={(e) => setClassification(e.target.value as MemoryClassification)}
                  className={inputClass}
                >
                  {CLASSIFICATION_ORDER.map((c) => (
                    <option key={c} value={c}>
                      {pick(CLASSIFICATION_META[c].label, lang)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="mem-add-sens">
                  {x(M.memory_add_sensitivity)}
                </label>
                <select
                  id="mem-add-sens"
                  value={sensitivity}
                  onChange={(e) => setSensitivity(e.target.value as 'standard' | 'restricted')}
                  className={inputClass}
                >
                  <option value="standard">{x(M.memory_sensitivity_standard)}</option>
                  <option value="restricted">{x(M.memory_sensitivity_restricted)}</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor="mem-add-purpose">
                  {x(M.memory_add_purpose)}
                </label>
                <input
                  id="mem-add-purpose"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor="mem-add-retention">
                  {x(M.memory_add_retention)}
                </label>
                <select
                  id="mem-add-retention"
                  value={retention}
                  onChange={(e) => setRetention(e.target.value as MemoryRetentionCategory | '')}
                  className={inputClass}
                >
                  <option value="">{x(M.memory_filter_none)}</option>
                  {RETENTION_CATEGORY_ORDER.map((r) => (
                    <option key={r} value={r}>
                      {pick(RETENTION_CATEGORY_LABELS[r], lang)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor="mem-add-scope-retrieval">
                  {x(M.memory_retrieval_scope)}
                </label>
                <select
                  id="mem-add-scope-retrieval"
                  value={retrievalScope}
                  onChange={(e) => setRetrievalScope(e.target.value as MemoryRetrievalScopeType | '')}
                  className={inputClass}
                >
                  <option value="">{x(M.memory_filter_none)}</option>
                  {(Object.keys(RETRIEVAL_SCOPE_META) as MemoryRetrievalScopeType[]).map((s) => (
                    <option key={s} value={s}>
                      {pick(RETRIEVAL_SCOPE_META[s].label, lang)}
                    </option>
                  ))}
                </select>
                <p className="m-0 mt-[4px] text-[11px] leading-normal text-text-faint">
                  {x(M.memory_retrieval_scope_note)}
                </p>
              </div>
            </div>
          )}

          {showSensitiveWarning && (
            <div className="flex items-start gap-[9px] rounded-[10px] border border-risk-border bg-surface px-[12px] py-[10px]">
              <AlertTriangle
                size={15}
                strokeWidth={1.8}
                className="mt-[1px] shrink-0 text-risk-dot"
                aria-hidden="true"
              />
              <div className="text-[12px] leading-normal text-text-muted">{x(M.memory_add_sensitive_warning)}</div>
            </div>
          )}
        </div>

        <div className="mt-[16px] flex justify-end gap-[8px]">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-[9px] border border-border bg-surface px-[14px] py-[9px] font-sans text-[13px] font-semibold text-text-muted"
          >
            {x(M.memory_add_cancel)}
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="cursor-pointer rounded-[9px] border-none bg-navy px-[16px] py-[9px] font-sans text-[13px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {x(M.memory_add_save)}
          </button>
        </div>
      </form>
    </div>
  )
}

/** Category options kept for parity with the production form. */
export const ADD_MEMORY_CATEGORIES: MemoryCategory[] = [
  'employment',
  'compensation',
  'matter',
  'record',
  'note',
  'case',
  'conversation',
]
