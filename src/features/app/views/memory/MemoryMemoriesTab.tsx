import { useMemo, useState } from 'react'
import { Brain, Check, Lock, Search, AlertTriangle, Clock, ShieldCheck } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { pick } from '@/i18n/core'
import type { Bi } from '@/i18n/core'
import { memoryMessages as M } from '@/i18n/messages/memory'
import type { MemoryFact, MemoryScope } from '@/data'
import { memoryScenarioTodayISO } from '@/data'
import { useMemoryStore, memoryActions } from './memoryStore'
import {
  computeMetrics,
  demoSubjectMaps,
  emptyMemoryFilter,
  isFilterActive,
  memoryMatchesQuery,
  resolveSubject,
  subjectOptions,
  type MemoryFilterState,
} from './memoryWorkspace'
import { MemoryListRow, MemoryInlineEdit } from './MemoryListRow'
import { MemoryDetailsDrawer } from './MemoryDetailsDrawer'
import { MemoryConfirmDialog } from './MemoryConfirmDialog'
import { effectiveStatus, effectiveSensitivity } from './memoryModel'

/**
 * Memories tab — the primary surface. Compact summary metrics, a filter/search
 * toolbar, a high-density memory list, an accessible details drawer, and the
 * empty state. Uses the full content width (no second sidebar).
 */
export interface MemoryMemoriesTabProps {
  readonly onAddMemory: () => void
  readonly onGoToReview?: () => void
  readonly onGoToGovernance?: () => void
}

const STATUS_OPTIONS: { value: string; label: Bi }[] = [
  { value: 'all', label: M.memory_filter_all },
  { value: 'proposed', label: M.memory_status_proposed },
  { value: 'needs_review', label: M.memory_status_needs_review },
  { value: 'confirmed', label: M.memory_status_confirmed },
  { value: 'expired', label: M.memory_status_expired },
]

const SENSITIVITY_OPTIONS: { value: string; label: Bi }[] = [
  { value: 'all', label: M.memory_filter_all },
  { value: 'standard', label: M.memory_sensitivity_standard },
  { value: 'restricted', label: M.memory_sensitivity_restricted },
]

const SOURCE_OPTIONS: { value: string; label: Bi }[] = [
  { value: 'all', label: M.memory_filter_all },
  { value: 'hris', label: M.memory_src_hris },
  { value: 'document', label: M.memory_src_document },
  { value: 'chat', label: M.memory_src_chat },
  { value: 'manual', label: M.memory_src_manual },
  { value: 'inference', label: M.memory_src_inference },
  { value: 'case', label: M.memory_src_case },
]

const SUBJECT_LABEL: Record<MemoryScope, Bi> = {
  person: M.memory_mgr_scope_person,
  case: M.memory_mgr_scope_case,
  thread: M.memory_mgr_scope_thread,
}

const selectClass =
  'rounded-[9px] border border-border bg-surface px-[10px] py-[7px] font-sans text-[12.5px] text-text outline-none'

export function MemoryMemoriesTab({ onAddMemory, onGoToReview, onGoToGovernance }: MemoryMemoriesTabProps) {
  const { x, lang } = useI18n()
  const { facts, audit, memoryEnabled } = useMemoryStore()
  const maps = useMemo(() => demoSubjectMaps(), [])
  const todayISO = memoryScenarioTodayISO

  const [filter, setFilter] = useState<MemoryFilterState>(emptyMemoryFilter)
  const [openId, setOpenId] = useState<string | null>(null)
  const [menuId, setMenuId] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [removeFact, setRemoveFact] = useState<MemoryFact | null>(null)
  const [holdFact, setHoldFact] = useState<MemoryFact | null>(null)
  const [holdReason, setHoldReason] = useState('')

  const active = facts.filter((f) => effectiveStatus(f) !== 'removed')
  const metrics = computeMetrics(facts, todayISO)
  const subjects = subjectOptions(facts)

  const filtered = active
    .filter((f) => (filter.subject === 'all' ? true : f.scope === filter.subject))
    .filter((f) => (filter.status === 'all' ? true : effectiveStatus(f) === filter.status))
    .filter((f) => (filter.source === 'all' ? true : f.source.type === filter.source))
    .filter((f) => (filter.sensitivity === 'all' ? true : effectiveSensitivity(f) === filter.sensitivity))
    .filter((f) => memoryMatchesQuery(f, filter.query, maps, lang))

  const openFact = openId != null ? facts.find((f) => f.id === openId) ?? null : null
  const openSubject = openFact != null ? resolveSubject(openFact, maps, lang) : null

  const metricItems = [
    { key: 'active', label: M.memory_metric_active, value: metrics.active, icon: ShieldCheck, tone: 'text-text-2', onClick: undefined as (() => void) | undefined },
    { key: 'review', label: M.memory_metric_needs_review, value: metrics.needsReview, icon: AlertTriangle, tone: metrics.needsReview > 0 ? 'text-gold-fg' : 'text-text-faint', onClick: onGoToReview },
    { key: 'expiring', label: M.memory_metric_expiring, value: metrics.expiringSoon, icon: Clock, tone: metrics.expiringSoon > 0 ? 'text-gold-fg' : 'text-text-faint', onClick: undefined },
    { key: 'restricted', label: M.memory_metric_restricted, value: metrics.restricted, icon: Lock, tone: metrics.restricted > 0 ? 'text-risk-dot' : 'text-text-faint', onClick: undefined },
  ]

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[1200px] px-[16px] pt-[18px] pb-[40px] md:px-[24px]">
        {/* Disabled state — memory is off */}
        {!memoryEnabled && (
          <div className="mb-[14px] rounded-[13px] border border-border-soft bg-surface-2 px-[16px] py-[14px]">
            <div className="flex items-start gap-[10px]">
              <AlertTriangle size={16} strokeWidth={1.8} className="mt-[1px] shrink-0 text-gold-fg" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="m-0 mb-[8px] text-[13px] font-semibold text-text">{x(M.memory_disabled_title)}</p>
                <p className="m-0 mb-[10px] text-[12.5px] leading-normal text-text-muted">{x(M.memory_disabled_body)}</p>
                {onGoToGovernance != null && (
                  <button
                    type="button"
                    onClick={onGoToGovernance}
                    className="cursor-pointer rounded-[8px] border border-border bg-surface px-[12px] py-[6px] font-sans text-[12px] font-semibold text-text-2"
                  >
                    {x(M.memory_disabled_enable)}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Compact metrics */}
        <div className="mb-[14px] flex flex-wrap gap-[8px]">
          {metricItems.map((m) => {
            const Icon = m.icon
            const interactive = m.onClick != null
            const cls = interactive
              ? 'cursor-pointer hover:border-border'
              : ''
            return (
              <div
                key={m.key}
                onClick={m.onClick}
                className={`flex items-center gap-[7px] rounded-[9px] border border-border-soft bg-surface px-[11px] py-[7px] ${cls}`}
                role={interactive ? 'button' : undefined}
                tabIndex={interactive ? 0 : undefined}
                onKeyDown={interactive ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); m.onClick?.() } } : undefined}
              >
                <Icon size={14} strokeWidth={1.8} className={m.tone} aria-hidden="true" />
                <span className="text-[16px] font-bold text-text">{m.value}</span>
                <span className="text-[11.5px] text-text-faint">{x(m.label)}</span>
              </div>
            )
          })}
        </div>

        {/* Filter toolbar */}
        <div className="mb-[12px] flex flex-wrap items-center gap-[8px]">
          <div className="flex min-w-[200px] flex-1 items-center gap-[8px] rounded-[9px] border border-border bg-surface px-[11px] py-[7px]">
            <Search size={14} strokeWidth={1.7} className="text-text-faint" aria-hidden="true" />
            <label className="sr-only" htmlFor="mem-search">
              {x(M.memory_filter_search)}
            </label>
            <input
              id="mem-search"
              value={filter.query}
              onChange={(e) => setFilter((f) => ({ ...f, query: e.target.value }))}
              placeholder={x(M.memory_filter_search)}
              className="min-w-0 flex-1 border-none bg-transparent font-sans text-[12.5px] text-text outline-none"
            />
          </div>
          <label className="sr-only" htmlFor="mem-filter-subject">{x(M.memory_filter_subject)}</label>
          <select
            id="mem-filter-subject"
            value={filter.subject}
            onChange={(e) => setFilter((f) => ({ ...f, subject: e.target.value as MemoryScope | 'all' }))}
            className={selectClass}
          >
            <option value="all">{x(M.memory_filter_subject)}</option>
            {subjects.map((s) => (
              <option key={s.scope} value={s.scope}>
                {pick(SUBJECT_LABEL[s.scope], lang)} ({s.count})
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="mem-filter-status">{x(M.memory_filter_status)}</label>
          <select
            id="mem-filter-status"
            value={filter.status}
            onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))}
            className={selectClass}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {pick(o.label, lang)}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="mem-filter-source">{x(M.memory_filter_source)}</label>
          <select
            id="mem-filter-source"
            value={filter.source}
            onChange={(e) => setFilter((f) => ({ ...f, source: e.target.value }))}
            className={selectClass}
          >
            {SOURCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {pick(o.label, lang)}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="mem-filter-sensitivity">{x(M.memory_filter_sensitivity)}</label>
          <select
            id="mem-filter-sensitivity"
            value={filter.sensitivity}
            onChange={(e) => setFilter((f) => ({ ...f, sensitivity: e.target.value }))}
            className={selectClass}
          >
            {SENSITIVITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {pick(o.label, lang)}
              </option>
            ))}
          </select>
          {isFilterActive(filter) && (
            <button
              type="button"
              onClick={() => setFilter(emptyMemoryFilter)}
              className="cursor-pointer rounded-[8px] border border-border bg-surface px-[10px] py-[7px] font-sans text-[12.5px] font-semibold text-text-muted"
            >
              {x(M.memory_filter_clear)}
            </button>
          )}
        </div>

        {/* Memory list */}
        {active.length === 0 ? (
          <EmptyMemories onAddMemory={onAddMemory} />
        ) : (
          <div className="overflow-hidden rounded-[14px] border border-border-soft bg-surface">
            {filtered.length === 0 ? (
              <div className="px-[24px] py-[28px] text-center">
                <Search size={18} strokeWidth={1.7} className="mx-auto mb-[8px] text-text-faint" aria-hidden="true" />
                <p className="m-0 mb-[4px] text-[13px] font-semibold text-text-2">{x(M.memory_no_results_title)}</p>
                <p className="m-0 mb-[12px] text-[12.5px] text-text-muted">{x(M.memory_no_results_body)}</p>
                <button
                  type="button"
                  onClick={() => setFilter(emptyMemoryFilter)}
                  className="cursor-pointer rounded-[8px] border border-border bg-surface px-[12px] py-[6px] font-sans text-[12px] font-semibold text-text-2"
                >
                  {x(M.memory_filter_clear)}
                </button>
              </div>
            ) : (
              filtered.map((fact) => {
                const subject = resolveSubject(fact, maps, lang)
                if (editId === fact.id) {
                  return (
                    <MemoryInlineEdit
                      key={fact.id}
                      fact={fact}
                      onSave={(s) => {
                        memoryActions.correct(fact.id, s)
                        setEditId(null)
                      }}
                      onCancel={() => setEditId(null)}
                    />
                  )
                }
                return (
                  <MemoryListRow
                    key={fact.id}
                    fact={fact}
                    subject={subject}
                    todayISO={todayISO}
                    memoryEnabled={memoryEnabled}
                    menuOpen={menuId === fact.id}
                    onToggleMenu={() => setMenuId((id) => (id === fact.id ? null : fact.id))}
                    onOpen={() => {
                      setMenuId(null)
                      setOpenId(fact.id)
                    }}
                    onEdit={() => {
                      setMenuId(null)
                      setEditId(fact.id)
                    }}
                    onRemove={() => {
                      setMenuId(null)
                      setRemoveFact(fact)
                    }}
                  />
                )
              })
            )}
          </div>
        )}
      </div>

      {/* Details drawer */}
      <MemoryDetailsDrawer
        fact={openFact}
        subject={openSubject}
        todayISO={todayISO}
        memoryEnabled={memoryEnabled}
        activity={audit}
        onClose={() => setOpenId(null)}
        onEdit={(f) => {
          setOpenId(null)
          setEditId(f.id)
        }}
        onRemove={(f) => {
          setOpenId(null)
          setRemoveFact(f)
        }}
        onAddHold={(f) => {
          setOpenId(null)
          setHoldFact(f)
          setHoldReason('')
        }}
        onRemoveHold={(f) => {
          memoryActions.removeLegalHold(f.id)
        }}
      />

      {/* Remove confirmation */}
      <MemoryConfirmDialog
        open={removeFact != null}
        title={x(M.memory_confirm_remove_title)}
        confirmLabel={x(M.memory_action_remove)}
        onClose={() => setRemoveFact(null)}
        onConfirm={() => {
          if (removeFact) memoryActions.remove(removeFact.id)
          setRemoveFact(null)
        }}
      >
        {x(M.memory_confirm_remove_body)}
      </MemoryConfirmDialog>

      {/* Legal hold confirmation */}
      <MemoryConfirmDialog
        open={holdFact != null}
        title={x(M.memory_confirm_hold_title)}
        confirmLabel={x(M.memory_action_add_hold)}
        confirmTone="gold"
        inputLabel={x(M.memory_confirm_hold_reason)}
        inputValue={holdReason}
        onInputChange={setHoldReason}
        inputRequired
        onClose={() => setHoldFact(null)}
        onConfirm={() => {
          if (holdFact) memoryActions.addLegalHold(holdFact.id, holdReason)
          setHoldFact(null)
        }}
      >
        {x(M.memory_confirm_hold_body)}
      </MemoryConfirmDialog>
    </div>
  )
}

function EmptyMemories({ onAddMemory }: { readonly onAddMemory: () => void }) {
  const { x } = useI18n()
  return (
    <div className="rounded-[14px] border border-border-soft bg-surface px-[24px] py-[28px] text-center">
      <div className="mx-auto mb-[10px] flex h-[40px] w-[40px] items-center justify-center rounded-[11px] bg-surface-2">
        <Brain size={18} strokeWidth={1.7} className="text-gold-fg" aria-hidden="true" />
      </div>
      <h3 className="m-0 mb-[5px] font-display text-[16px] font-semibold text-text">{x(M.memory_empty_title)}</h3>
      <p className="mx-auto mb-[10px] max-w-[420px] text-[12.5px] leading-normal text-text-muted">
        {x(M.memory_empty_body)}
      </p>
      <p className="mx-auto mb-[14px] max-w-[420px] text-[11.5px] leading-normal text-text-faint">
        {x(M.memory_empty_normal)}
      </p>
      <div className="flex flex-wrap justify-center gap-[8px]">
        <button
          type="button"
          onClick={onAddMemory}
          className="cursor-pointer rounded-[9px] border-none bg-navy px-[16px] py-[9px] font-sans text-[13px] font-bold text-white"
        >
          {x(M.memory_empty_add)}
        </button>
        <button
          type="button"
          className="flex cursor-pointer items-center gap-[6px] rounded-[9px] border border-border bg-surface px-[14px] py-[9px] font-sans text-[13px] font-semibold text-text-2"
        >
          <Check size={15} strokeWidth={1.8} aria-hidden="true" />
          {x(M.memory_empty_learn)}
        </button>
      </div>
    </div>
  )
}
