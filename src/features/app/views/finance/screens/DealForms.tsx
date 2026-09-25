import { useState } from 'react'
import { useI18n } from '@/i18n/context'
import { pickL } from '@/i18n/core'
import type { Bi } from '@/i18n/core'
import { financeMessages as M } from '@/i18n/messages/finance'
import {
  CURRENCY_LABEL,
  DEAL_KIND_LABEL,
  DEAL_STAGE_LABEL,
  DEAL_STAGE_ORDER,
  DECISION_KIND_LABEL,
} from '../financeLabels'
import type {
  FinanceCommitment,
  FinanceCommitmentStatus,
  FinanceCurrency,
  FinanceDeal,
  FinanceDealKind,
  FinanceDealStage,
  FinanceDecisionKind,
  FinanceLegalEntity,
} from '../data/types'

/**
 * Form components for Deals.tsx — extracted to keep the screen under the
 * 800-line source budget (same split precedent as data/dealTypes.ts).
 * Only components are exported so fast refresh keeps working.
 */

const inputClass =
  'w-full rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px] text-text'
const labelClass = 'flex flex-col gap-[4px] text-[12px] text-text-muted'

function toAmount(v: string | undefined): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

export function DealForm({
  entities,
  defaultEntityId,
  initial,
  onSubmit,
  onCancel,
}: {
  entities: FinanceLegalEntity[]
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
export function DealDecisionForm({
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

/**
 * A capital commitment against one partner — launched from the partner's
 * card, so partyId is fixed and the form only needs entity + amounts +
 * call dates. `called <= committed` is a CHECK constraint on the table;
 * the form blocks that case before the API would reject it.
 */
export function CommitmentForm({
  partyId,
  entities,
  defaultEntityId,
  initial,
  onSubmit,
  onCancel,
}: {
  partyId: string
  entities: FinanceLegalEntity[]
  defaultEntityId: string
  initial?: FinanceCommitment
  onSubmit: (item: Omit<FinanceCommitment, 'id'>) => Promise<unknown>
  onCancel: () => void
}) {
  const { x } = useI18n()
  const [entityId, setEntityId] = useState(initial?.entityId ?? defaultEntityId)
  const [label, setLabel] = useState(initial?.label ? pickL(initial.label, 'en') : '')
  const [committed, setCommitted] = useState(initial?.committed ?? '')
  const [called, setCalled] = useState(initial?.called ?? '0')
  const [currency, setCurrency] = useState<FinanceCurrency>(initial?.currency ?? 'CAD')
  const [nextCallDate, setNextCallDate] = useState(initial?.nextCallDate ?? '')
  const [status, setStatus] = useState<FinanceCommitmentStatus>(initial?.status ?? 'active')
  const [notes, setNotes] = useState(initial?.notes ? pickL(initial.notes, 'en') : '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (saving || !entityId || !committed.trim()) return
    if (toAmount(called) > toAmount(committed)) return
    setSaving(true)
    setError(null)
    try {
      await onSubmit({
        entityId,
        partyId,
        label: label.trim()
          ? ({ en: label.trim(), fr: label.trim() } satisfies Bi as Bi)
          : undefined,
        committed: committed.trim(),
        called: called.trim() || '0',
        currency,
        nextCallDate: nextCallDate || undefined,
        status,
        notes: notes.trim()
          ? ({ en: notes.trim(), fr: notes.trim() } satisfies Bi as Bi)
          : undefined,
      })
    } catch {
      setError(x(M.finance_commitment_save_failed))
    } finally {
      setSaving(false)
    }
  }

  const calledOverCommitted =
    committed.trim() !== '' && called.trim() !== '' && toAmount(called) > toAmount(committed)

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="mt-[8px] flex flex-col gap-[8px] rounded-[8px] border border-border bg-surface p-[10px]"
    >
      <div className="text-[12px] font-semibold text-text">
        {initial ? x(M.finance_commitment_edit_title) : x(M.finance_commitment_create)}
      </div>
      <div className="grid grid-cols-2 gap-[8px]">
        <label className={labelClass}>
          <span>{x(M.finance_commitment_label)}</span>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          <span>{x(M.finance_commitment_entity)}</span>
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
      <div className="grid grid-cols-3 gap-[8px]">
        <label className={labelClass}>
          <span>{x(M.finance_commitment_committed)}</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={committed}
            onChange={(e) => setCommitted(e.target.value)}
            className={inputClass}
            required
          />
        </label>
        <label className={labelClass}>
          <span>{x(M.finance_commitment_called)}</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={called}
            onChange={(e) => setCalled(e.target.value)}
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
      </div>
      <div className="grid grid-cols-2 gap-[8px]">
        <label className={labelClass}>
          <span>{x(M.finance_commitment_next_call)}</span>
          <input
            type="date"
            value={nextCallDate}
            onChange={(e) => setNextCallDate(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          <span>{x(M.finance_commitment_status)}</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as FinanceCommitmentStatus)}
            className={inputClass}
          >
            <option value="active">{x(M.finance_commitment_status_active)}</option>
            <option value="closed">{x(M.finance_commitment_status_closed)}</option>
          </select>
        </label>
      </div>
      <label className={labelClass}>
        <span>{x(M.finance_deals_notes)}</span>
        <input value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} />
      </label>
      {(error || calledOverCommitted) && (
        <p className="m-0 text-[12px] text-red-600">
          {calledOverCommitted
            ? `${x(M.finance_commitment_called)} ≤ ${x(M.finance_commitment_committed)}`
            : error}
        </p>
      )}
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
          disabled={saving || calledOverCommitted}
          className="rounded-[6px] bg-navy px-[12px] py-[5px] text-[12px] font-semibold text-white disabled:opacity-60"
        >
          {x(M.finance_save)}
        </button>
      </div>
    </form>
  )
}
