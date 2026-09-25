import { useMemo, useState } from 'react'
import { ListPlus, NotebookPen, Pencil, Plus, Trash2 } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { statusChipClass } from '@/components/chips'
import type { ChipTone } from '@/components/chips'
import { useI18n } from '@/i18n/context'
import { pickL } from '@/i18n/core'
import type { Bi } from '@/i18n/core'
import { financeMessages as M } from '@/i18n/messages/finance'
import { useFinanceData } from '../data/useFinanceData'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { addDealFollowupTask } from '../../tasks/productionApi'
import {
  CURRENCY_LABEL,
  DEAL_KIND_LABEL,
  DEAL_STAGE_LABEL,
  DEAL_STAGE_ORDER,
  DECISION_KIND_LABEL,
} from '../financeLabels'
import type {
  FinanceCurrency,
  FinanceDeal,
  FinanceDealKind,
  FinanceDealStage,
  FinanceDecisionKind,
} from '../data/types'

/**
 * Finance → Deals — the transaction pipeline for orgs acting like a
 * holding / investment firm (acquisitions, minority stakes, financing
 * rounds) on top of the existing finance stack (migration 0171).
 *
 * Rows hang off finance_entities; counterparties that are capital partners
 * also appear in the partners section via finance_parties' investor/lender
 * types. Dutiva records where each deal stands — it does not broker deals
 * or provide investment advice.
 */

const inputClass =
  'w-full rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px] text-text'
const labelClass = 'flex flex-col gap-[4px] text-[12px] text-text-muted'

function toAmount(v: string | undefined): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

const STAGE_TONE: Record<FinanceDealStage, ChipTone> = {
  sourcing: 'neutral',
  diligence: 'info',
  negotiation: 'warning',
  agreement: 'info',
  closed: 'success',
  passed: 'neutral',
}

/** Stages that still count toward the pipeline — closed and passed don't. */
const ACTIVE_STAGES: ReadonlySet<FinanceDealStage> = new Set([
  'sourcing',
  'diligence',
  'negotiation',
  'agreement',
])

export function Deals() {
  const { x, lang } = useI18n()
  const { state, canWrite, addDeal, updateDeal, transitionDealStage, removeDeal, addDecisionEntry } =
    useFinanceData()
  const { organizationId } = useWorkspaceMode()
  const { showToast } = useToasts()

  const [form, setForm] = useState<{ mode: 'add' } | { mode: 'edit'; deal: FinanceDeal } | null>(
    null,
  )
  const [decisionFor, setDecisionFor] = useState<string | null>(null)
  const [taskBusy, setTaskBusy] = useState<string | null>(null)

  const activeDeals = useMemo(
    () => state.deals.filter((d) => ACTIVE_STAGES.has(d.stage)),
    [state.deals],
  )
  const pipelineValue = useMemo(
    () => activeDeals.reduce((sum, d) => sum + toAmount(d.value), 0),
    [activeDeals],
  )
  const nextTarget = useMemo(() => {
    const dates = activeDeals
      .map((d) => d.targetDate)
      .filter((d): d is string => Boolean(d))
      .sort()
    return dates[0]
  }, [activeDeals])
  const closedCount = useMemo(
    () => state.deals.filter((d) => d.stage === 'closed').length,
    [state.deals],
  )
  const capitalPartners = useMemo(
    () => state.parties.filter((p) => p.type === 'investor' || p.type === 'lender'),
    [state.parties],
  )

  const entityName = (id: string) =>
    state.entities.find((e) => e.id === id)?.legalName ?? '—'

  const firstEntityId = state.entities[0]?.id ?? ''

  /* Deal → task hand-off: the follow-up lands in compliance_tasks with
     metadata.deal_id, which the task detail links back from. */
  const onAddTask = async (d: FinanceDeal) => {
    if (!organizationId || taskBusy) return
    setTaskBusy(d.id)
    try {
      const name = pickL(d.name, lang)
      const details = x(M.finance_deals_task_details)
        .replace('{deal}', name)
        .replace('{kind}', pickL(DEAL_KIND_LABEL[d.kind], lang))
        .replace('{stage}', pickL(DEAL_STAGE_LABEL[d.stage], lang))
        .replace('{entity}', entityName(d.entityId))
      const task = await addDealFollowupTask(
        organizationId,
        d.id,
        x(M.finance_deals_task_title).replace('{deal}', name),
        d.targetDate ?? null,
        details + (d.counterparty ? ` · ${d.counterparty}` : ''),
      )
      /* The toast carries the deep link — without it the new task is a dead
         end, the same complaint that produced the task-detail route. */
      showToast(M.finance_deals_task_added, 'ok', {
        label: M.finance_deals_task_open,
        to: `/app/planning/tasks/${task.id}`,
      })
    } catch {
      showToast(M.finance_deals_task_failed, 'info')
    } finally {
      setTaskBusy(null)
    }
  }

  return (
    <div className="flex flex-col gap-[16px]">
      {/* Summary strip */}
      <section className="grid grid-cols-1 gap-[10px] sm:grid-cols-3">
        <div className="rounded-[12px] border border-border bg-surface p-[16px]">
          <div className="text-[11.5px] font-semibold text-text-3 uppercase tracking-[0.04em]">
            {x(M.finance_deals_title)}
          </div>
          <div className="mt-[6px] text-[20px] font-bold text-text">{activeDeals.length}</div>
          <div className="mt-[2px] text-[11.5px] text-text-muted">
            {x(M.finance_deals_active_count).replace('{count}', String(activeDeals.length))}
          </div>
        </div>
        <div className="rounded-[12px] border border-border bg-surface p-[16px]">
          <div className="text-[11.5px] font-semibold text-text-3 uppercase tracking-[0.04em]">
            {x(M.finance_deals_pipeline_value)}
          </div>
          <div className="mt-[6px] text-[20px] font-bold text-text">
            CAD {pipelineValue.toFixed(2)}
          </div>
          <div className="mt-[2px] text-[11.5px] text-text-muted">
            {x(M.finance_deals_closed_count).replace('{count}', String(closedCount))}
          </div>
        </div>
        <div className="rounded-[12px] border border-border bg-surface p-[16px]">
          <div className="text-[11.5px] font-semibold text-text-3 uppercase tracking-[0.04em]">
            {x(M.finance_deals_next_target)}
          </div>
          <div className="mt-[6px] text-[20px] font-bold text-text">{nextTarget ?? '—'}</div>
          <div className="mt-[2px] text-[11.5px] text-text-muted">
            {x(M.finance_deals_passed_count).replace(
              '{count}',
              String(state.deals.length - activeDeals.length - closedCount),
            )}
          </div>
        </div>
      </section>

      <p className="text-[12px] leading-[1.5] text-text-muted">{x(M.finance_deals_note)}</p>

      {/* Pipeline — grouped by stage */}
      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <div className="mb-[12px] flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-text">{x(M.finance_deals_title)}</h2>
          {canWrite && (
            <button
              type="button"
              onClick={() => setForm({ mode: 'add' })}
              className="flex items-center gap-[6px] text-[13px] font-semibold text-accent"
            >
              <Plus size={14} />
              {x(M.finance_deals_create)}
            </button>
          )}
        </div>
        {form && canWrite && (
          <DealForm
            key={form.mode === 'edit' ? form.deal.id : 'add'}
            entities={state.entities}
            defaultEntityId={firstEntityId}
            initial={form.mode === 'edit' ? form.deal : undefined}
            onSubmit={async (item) => {
              if (form.mode === 'edit') {
                const updated = await updateDeal(form.deal.id, item)
                if (!updated) throw new Error('updateDeal returned null')
              } else {
                const created = await addDeal(item)
                if (!created) throw new Error('addDeal returned null')
              }
              setForm(null)
            }}
            onCancel={() => setForm(null)}
          />
        )}
        {state.deals.length === 0 && !form ? (
          <p className="text-[13px] text-text-muted">{x(M.finance_deals_empty)}</p>
        ) : (
          <div className="flex flex-col gap-[14px]">
            {DEAL_STAGE_ORDER.map((stage) => {
              const stageDeals = state.deals.filter((d) => d.stage === stage)
              if (stageDeals.length === 0) return null
              return (
                <div key={stage}>
                  <div className="mb-[8px] flex items-center gap-[8px]">
                    <span className={statusChipClass(STAGE_TONE[stage])}>
                      {x(DEAL_STAGE_LABEL[stage])}
                    </span>
                    <span className="text-[11.5px] text-text-faint">{stageDeals.length}</span>
                  </div>
                  <ul className="m-0 flex flex-col gap-[10px] p-0">
                    {stageDeals.map((d) => (
                      <li
                        key={d.id}
                        className="rounded-[10px] bg-inset px-[12px] py-[10px]"
                      >
                        <div className="flex items-start justify-between gap-[8px]">
                          <div className="flex min-w-0 flex-col gap-[4px]">
                            <div className="flex flex-wrap items-center gap-[8px]">
                              <span className="text-[13px] font-semibold text-text">
                                {x(d.name)}
                              </span>
                              <span className={statusChipClass('neutral')}>
                                {x(DEAL_KIND_LABEL[d.kind])}
                              </span>
                            </div>
                            <div className="text-[12px] text-text-muted">
                              {entityName(d.entityId)}
                              {d.counterparty && ` · ${d.counterparty}`}
                              {d.value &&
                                ` · ${x(CURRENCY_LABEL[d.currency])} ${toAmount(d.value).toFixed(2)}`}
                            </div>
                            <div className="text-[12px] text-text-muted">
                              {d.targetDate &&
                                `${x(M.finance_deals_target_date)}: ${d.targetDate}`}
                              {d.owner && `${d.targetDate ? ' · ' : ''}${d.owner}`}
                            </div>
                            {d.notes && (
                              <div className="mt-[2px] text-[12px] leading-[1.5] text-text-2">
                                {x(d.notes)}
                              </div>
                            )}
                          </div>
                          {canWrite && (
                            <div className="flex shrink-0 items-center gap-[4px]">
                              <button
                                type="button"
                                onClick={() => setForm({ mode: 'edit', deal: d })}
                                className="rounded-[6px] p-[4px] text-text-muted hover:bg-surface hover:text-text"
                                aria-label={x(M.finance_deals_edit)}
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!confirm(x(M.finance_deals_remove_confirm))) return
                                  await removeDeal(d.id)
                                }}
                                className="rounded-[6px] p-[4px] text-text-muted hover:bg-surface hover:text-red-600"
                                aria-label={x(M.finance_deals_remove)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                        {canWrite && (
                          <div className="mt-[8px] flex flex-wrap items-center gap-[8px]">
                            <select
                              value={d.stage}
                              onChange={(e) =>
                                void transitionDealStage(
                                  d.id,
                                  e.target.value as FinanceDealStage,
                                )
                              }
                              aria-label={x(M.finance_deals_stage)}
                              className="rounded-[6px] border border-border bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2"
                            >
                              {DEAL_STAGE_ORDER.map((s) => (
                                <option key={s} value={s}>
                                  {x(M.finance_deals_move_to).replace(
                                    '{stage}',
                                    pickL(DEAL_STAGE_LABEL[s], lang),
                                  )}
                                </option>
                              ))}
                            </select>
                            {/* Lifecycle links — a deal feeds the decision
                                journal and the shared task list. */}
                            <button
                              type="button"
                              onClick={() =>
                                setDecisionFor((cur) => (cur === d.id ? null : d.id))
                              }
                              className="flex items-center gap-[5px] rounded-[6px] border border-border bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2 hover:border-(--accent-soft-border)"
                            >
                              <NotebookPen size={12} aria-hidden />
                              {x(M.finance_deals_log_decision)}
                            </button>
                            <button
                              type="button"
                              disabled={!organizationId || taskBusy === d.id}
                              onClick={() => void onAddTask(d)}
                              className="flex items-center gap-[5px] rounded-[6px] border border-border bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2 hover:border-(--accent-soft-border) disabled:opacity-60"
                            >
                              <ListPlus size={12} aria-hidden />
                              {x(M.finance_deals_add_task)}
                            </button>
                          </div>
                        )}
                        {canWrite && decisionFor === d.id && (
                          <DealDecisionForm
                            deal={d}
                            onSubmit={async (entry) => {
                              await addDecisionEntry(entry)
                              setDecisionFor(null)
                            }}
                            onCancel={() => setDecisionFor(null)}
                          />
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Capital partners — investor/lender parties live in the shared
          party table; this section surfaces them beside the pipeline. */}
      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <div className="mb-[12px] flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-text">
            {x(M.finance_partners_title)}
          </h2>
          <NavLink
            to="../purchases"
            className="text-[12.5px] font-semibold text-accent hover:underline"
          >
            {x(M.finance_tab_purchases)}
          </NavLink>
        </div>
        {capitalPartners.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.finance_partners_empty)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[10px] p-0">
            {capitalPartners.map((p) => (
              <li key={p.id} className="flex items-start justify-between gap-[12px]">
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-text">{p.name}</div>
                  <div className="text-[12px] text-text-muted">
                    {x(M[`finance_party_type_${p.type}` as keyof typeof M])} ·{' '}
                    {entityName(p.entityId)}
                  </div>
                </div>
                {p.bankingDetailsOnFile && (
                  <span className={statusChipClass('success')}>
                    {x(M.finance_party_banking_on_file)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

/* ---------- Form ---------- */

function DealForm({
  entities,
  defaultEntityId,
  initial,
  onSubmit,
  onCancel,
}: {
  entities: import('../data/types').FinanceLegalEntity[]
  defaultEntityId: string
  initial?: FinanceDeal
  onSubmit: (item: Omit<FinanceDeal, 'id'>) => Promise<unknown>
  onCancel: () => void
}) {
  const { x } = useI18n()
  const [entityId, setEntityId] = useState(initial?.entityId ?? defaultEntityId)
  const [name, setName] = useState(initial ? pickL(initial.name, 'en') : '')
  const [kind, setKind] = useState<FinanceDealKind>(initial?.kind ?? 'investment')
  const [stage, setStage] = useState<FinanceDealStage>(initial?.stage ?? 'sourcing')
  const [counterparty, setCounterparty] = useState(initial?.counterparty ?? '')
  const [value, setValue] = useState(initial?.value ?? '')
  const [currency, setCurrency] = useState<FinanceCurrency>(initial?.currency ?? 'CAD')
  const [targetDate, setTargetDate] = useState(initial?.targetDate ?? '')
  const [owner, setOwner] = useState(initial?.owner ?? '')
  const [notes, setNotes] = useState(initial?.notes ? pickL(initial.notes, 'en') : '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (saving || !entityId || !name.trim()) return
    setSaving(true)
    setError(null)
    try {
      await onSubmit({
        entityId,
        name: { en: name.trim(), fr: name.trim() } satisfies Bi as Bi,
        kind,
        stage,
        counterparty: counterparty.trim() || undefined,
        value: value.trim() || undefined,
        currency,
        targetDate: targetDate || undefined,
        owner: owner.trim() || undefined,
        notes: notes.trim() ? ({ en: notes.trim(), fr: notes.trim() } satisfies Bi as Bi) : undefined,
      })
    } catch {
      setError(x(M.finance_deals_save_failed))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-[12px] flex flex-col gap-[10px] rounded-[10px] border border-border bg-inset p-[12px]"
    >
      <div className="text-[13px] font-semibold text-text">
        {initial ? x(M.finance_deals_edit_title) : x(M.finance_deals_create)}
      </div>
      <div className="grid grid-cols-2 gap-[10px]">
        <label className={labelClass}>
          <span>{x(M.finance_deals_name)}</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            required
          />
        </label>
        <label className={labelClass}>
          <span>{x(M.finance_deals_entity)}</span>
          <select
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
            className={inputClass}
            required
          >
            {entities.map((ent) => (
              <option key={ent.id} value={ent.id}>
                {ent.legalName}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid grid-cols-2 gap-[10px]">
        <label className={labelClass}>
          <span>{x(M.finance_deals_kind)}</span>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as FinanceDealKind)}
            className={inputClass}
          >
            {(Object.keys(DEAL_KIND_LABEL) as FinanceDealKind[]).map((k) => (
              <option key={k} value={k}>
                {x(DEAL_KIND_LABEL[k])}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          <span>{x(M.finance_deals_stage)}</span>
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value as FinanceDealStage)}
            className={inputClass}
          >
            {DEAL_STAGE_ORDER.map((s) => (
              <option key={s} value={s}>
                {x(DEAL_STAGE_LABEL[s])}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid grid-cols-2 gap-[10px]">
        <label className={labelClass}>
          <span>{x(M.finance_deals_counterparty)}</span>
          <input
            value={counterparty}
            onChange={(e) => setCounterparty(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          <span>{x(M.finance_deals_owner)}</span>
          <input
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>
      <div className="grid grid-cols-3 gap-[10px]">
        <label className={labelClass}>
          <span>{x(M.finance_deals_value)}</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          <span>{x(M.finance_currency)}</span>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as FinanceCurrency)}
            className={inputClass}
          >
            {(Object.keys(CURRENCY_LABEL) as FinanceCurrency[]).map((c) => (
              <option key={c} value={c}>
                {x(CURRENCY_LABEL[c])}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          <span>{x(M.finance_deals_target_date)}</span>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>
      <label className={labelClass}>
        <span>{x(M.finance_deals_notes)}</span>
        <input value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} />
      </label>
      {error && <p className="m-0 text-[12px] text-red-600">{error}</p>}
      <div className="flex justify-end gap-[8px]">
        <button
          type="button"
          disabled={saving}
          onClick={onCancel}
          className="rounded-[6px] bg-inset px-[12px] py-[5px] text-[12px] font-semibold text-text-2 border border-border disabled:opacity-60"
        >
          {x(M.finance_cancel)}
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-[6px] bg-navy px-[12px] py-[5px] text-[12px] font-semibold text-white disabled:opacity-60"
        >
          {x(M.finance_save)}
        </button>
      </div>
    </form>
  )
}

/**
 * Compact journal entry for a deal — same fields as Portfolio's
 * DecisionForm, minus the subject picker: the entry inherits the deal's
 * own holdingId/watchlistItemId links and its entityId.
 */
function DealDecisionForm({
  deal,
  onSubmit,
  onCancel,
}: {
  deal: FinanceDeal
  onSubmit: (entry: Omit<import('../data/types').FinanceDecisionEntry, 'id'>) => Promise<unknown>
  onCancel: () => void
}) {
  const { x, lang } = useI18n()
  const [decision, setDecision] = useState<FinanceDecisionKind>('review')
  const [decidedAt, setDecidedAt] = useState(() => new Date().toISOString().slice(0, 10))
  const [summary, setSummary] = useState(() => pickL(deal.name, lang))
  const [rationale, setRationale] = useState('')
  const [reviewDate, setReviewDate] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!summary.trim()) return
    await onSubmit({
      entityId: deal.entityId,
      holdingId: deal.holdingId,
      watchlistItemId: deal.watchlistItemId,
      decision,
      decidedAt,
      summary: { en: summary.trim(), fr: summary.trim() } satisfies Bi as Bi,
      rationale: rationale.trim()
        ? ({ en: rationale.trim(), fr: rationale.trim() } satisfies Bi as Bi)
        : undefined,
      reviewDate: reviewDate || undefined,
    })
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="mt-[8px] flex flex-col gap-[8px] rounded-[8px] border border-border bg-surface p-[10px]"
    >
      <div className="text-[12px] font-semibold text-text">
        {x(M.finance_deals_log_decision)} — {x(deal.name)}
      </div>
      <div className="grid grid-cols-2 gap-[8px]">
        <label className={labelClass}>
          <span>{x(M.finance_portfolio_decision)}</span>
          <select
            value={decision}
            onChange={(e) => setDecision(e.target.value as FinanceDecisionKind)}
            className={inputClass}
          >
            {(Object.keys(DECISION_KIND_LABEL) as FinanceDecisionKind[]).map((k) => (
              <option key={k} value={k}>
                {x(DECISION_KIND_LABEL[k])}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          <span>{x(M.finance_portfolio_decided_at)}</span>
          <input
            type="date"
            value={decidedAt}
            onChange={(e) => setDecidedAt(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>
      <label className={labelClass}>
        <span>{x(M.finance_summary)}</span>
        <input
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className={inputClass}
          required
        />
      </label>
      <label className={labelClass}>
        <span>{x(M.finance_portfolio_rationale)}</span>
        <input
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          className={inputClass}
        />
      </label>
      <label className={labelClass}>
        <span>{x(M.finance_portfolio_review_date)}</span>
        <input
          type="date"
          value={reviewDate}
          onChange={(e) => setReviewDate(e.target.value)}
          className={inputClass}
        />
      </label>
      <div className="flex justify-end gap-[8px]">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-[6px] bg-inset px-[12px] py-[5px] text-[12px] font-semibold text-text-2 border border-border"
        >
          {x(M.finance_cancel)}
        </button>
        <button
          type="submit"
          className="rounded-[6px] bg-navy px-[12px] py-[5px] text-[12px] font-semibold text-white"
        >
          {x(M.finance_save)}
        </button>
      </div>
    </form>
  )
}
