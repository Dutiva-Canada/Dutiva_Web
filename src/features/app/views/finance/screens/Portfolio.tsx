import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { statusChipClass } from '@/components/chips'
import { useI18n } from '@/i18n/context'
import { pickL } from '@/i18n/core'
import type { Bi } from '@/i18n/core'
import { financeMessages as M } from '@/i18n/messages/finance'
import { useFinanceData } from '../data/useFinanceData'
import {
  ASSET_CLASS_LABEL,
  CURRENCY_LABEL,
  DECISION_KIND_LABEL,
  WATCHLIST_STATUS_LABEL,
} from '../financeLabels'
import type { FinanceAssetClass, FinanceDecisionKind, FinanceWatchlistStatus } from '../data/types'

/**
 * Finance → Portfolio — company investment tracking adapted from the
 * portfolio-research pattern (holdings + watchlist + decision journal).
 *
 * Holdings themselves live on `finance_holdings` (migration 0119) and are
 * entered under Treasury; this screen layers the *decision* side on top —
 * what the org is watching, and the dated journal of what it decided and
 * why. Dutiva records decisions; it does not place trades or advise.
 */

const inputClass =
  'w-full rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px] text-text'
const labelClass = 'flex flex-col gap-[4px] text-[12px] text-text-muted'

function toAmount(v: string | undefined): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function toMoney(n: number): string {
  return n.toFixed(2)
}

export function Portfolio() {
  const { x, lang } = useI18n()
  const {
    state,
    canWrite,
    addWatchlistItem,
    transitionWatchlistStatus,
    addDecisionEntry,
    updateDecisionOutcome,
  } = useFinanceData()

  const [showWatchForm, setShowWatchForm] = useState(false)
  const [showDecisionForm, setShowDecisionForm] = useState(false)
  const [outcomeEdit, setOutcomeEdit] = useState<string | null>(null)
  const [outcomeText, setOutcomeText] = useState('')

  const totalMarket = useMemo(
    () => state.holdings.reduce((sum, h) => sum + toAmount(h.marketValue), 0),
    [state.holdings],
  )
  const activeWatch = useMemo(
    () =>
      state.watchlistItems.filter((w) => w.status === 'watching' || w.status === 'under_review'),
    [state.watchlistItems],
  )
  const nextReview = useMemo(() => {
    const dates = state.decisionEntries
      .map((d) => d.reviewDate)
      .filter((d): d is string => Boolean(d))
      .sort()
    return dates[0]
  }, [state.decisionEntries])
  const sortedEntries = useMemo(
    () => [...state.decisionEntries].sort((a, b) => b.decidedAt.localeCompare(a.decidedAt)),
    [state.decisionEntries],
  )

  const subjectName = (holdingId?: string, watchlistItemId?: string): string => {
    if (holdingId) {
      const h = state.holdings.find((v) => v.id === holdingId)
      if (h) return pickL(h.label, lang)
    }
    if (watchlistItemId) {
      const w = state.watchlistItems.find((v) => v.id === watchlistItemId)
      if (w) return w.symbol ? `${w.symbol} — ${pickL(w.label, lang)}` : pickL(w.label, lang)
    }
    return '—'
  }

  const firstEntityId = state.entities[0]?.id ?? ''

  return (
    <div className="flex flex-col gap-[16px]">
      {/* Summary strip */}
      <section className="grid grid-cols-1 gap-[10px] sm:grid-cols-3">
        <div className="rounded-[12px] border border-border bg-surface p-[16px]">
          <div className="text-[11.5px] font-semibold text-text-3 uppercase tracking-[0.04em]">
            {x(M.finance_portfolio_total_value)}
          </div>
          <div className="mt-[6px] text-[20px] font-bold text-text">CAD {toMoney(totalMarket)}</div>
          <div className="mt-[2px] text-[11.5px] text-text-muted">
            {x(M.finance_portfolio_holdings_count).replace(
              '{count}',
              String(state.holdings.length),
            )}
          </div>
        </div>
        <div className="rounded-[12px] border border-border bg-surface p-[16px]">
          <div className="text-[11.5px] font-semibold text-text-3 uppercase tracking-[0.04em]">
            {x(M.finance_portfolio_watch_active)}
          </div>
          <div className="mt-[6px] text-[20px] font-bold text-text">{activeWatch.length}</div>
          <div className="mt-[2px] text-[11.5px] text-text-muted">
            {x(M.finance_portfolio_watch_total).replace(
              '{count}',
              String(state.watchlistItems.length),
            )}
          </div>
        </div>
        <div className="rounded-[12px] border border-border bg-surface p-[16px]">
          <div className="text-[11.5px] font-semibold text-text-3 uppercase tracking-[0.04em]">
            {x(M.finance_portfolio_next_review)}
          </div>
          <div className="mt-[6px] text-[20px] font-bold text-text">{nextReview ?? '—'}</div>
          <div className="mt-[2px] text-[11.5px] text-text-muted">
            {x(M.finance_portfolio_journal_count).replace(
              '{count}',
              String(state.decisionEntries.length),
            )}
          </div>
        </div>
      </section>

      <p className="text-[12px] leading-[1.5] text-text-muted">{x(M.finance_portfolio_note)}</p>

      {/* Holdings — read-only view of treasury positions with allocation share */}
      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <div className="mb-[12px] flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-text">{x(M.finance_portfolio_holdings)}</h2>
          <NavLink
            to="../treasury"
            className="text-[12.5px] font-semibold text-accent hover:underline"
          >
            {x(M.finance_portfolio_manage_treasury)}
          </NavLink>
        </div>
        {state.holdings.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.finance_treasury_no_holdings)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[10px] p-0">
            {state.holdings.map((h) => {
              const share = totalMarket > 0 ? (toAmount(h.marketValue) / totalMarket) * 100 : 0
              return (
                <li key={h.id} className="flex items-start justify-between gap-[12px]">
                  <div>
                    <div className="text-[13px] font-semibold text-text">{x(h.label)}</div>
                    <div className="text-[12px] text-text-muted">
                      {x(h.institution)} · {x(CURRENCY_LABEL[h.currency])} {h.marketValue ?? '0.00'}
                      {h.units && ` · ${h.units} ${x(M.finance_portfolio_units)}`}
                      {` · ${x(M.finance_portfolio_allocation)}: ${share.toFixed(1)}%`}
                    </div>
                    <div className="text-[12px] text-text-muted">
                      {x(M.finance_treasury_as_of)}: {h.asOfDate} · {x(M.finance_source)}:{' '}
                      {x(h.valuationSource)}
                    </div>
                  </div>
                  {h.stale && (
                    <span className={statusChipClass('warning')}>
                      {x(M.finance_treasury_stale)}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* Watchlist */}
      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <div className="mb-[12px] flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-text">
            {x(M.finance_portfolio_watchlist)}
          </h2>
          {canWrite && (
            <button
              type="button"
              onClick={() => setShowWatchForm((v) => !v)}
              className="flex items-center gap-[6px] text-[13px] font-semibold text-accent"
            >
              <Plus size={14} />
              {x(M.finance_portfolio_watch_add)}
            </button>
          )}
        </div>
        {showWatchForm && canWrite && (
          <WatchlistForm
            entityId={firstEntityId}
            onSubmit={(item) => {
              void addWatchlistItem(item)
              setShowWatchForm(false)
            }}
            onCancel={() => setShowWatchForm(false)}
          />
        )}
        {state.watchlistItems.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.finance_portfolio_empty_watchlist)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[10px] p-0">
            {state.watchlistItems.map((w) => (
              <li key={w.id} className="flex items-start justify-between gap-[12px]">
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-text">
                    {w.symbol ? `${w.symbol} — ` : ''}
                    {x(w.label)}
                  </div>
                  <div className="text-[12px] text-text-muted">
                    {x(ASSET_CLASS_LABEL[w.assetClass])} · {x(CURRENCY_LABEL[w.currency])}
                    {(w.targetLow || w.targetHigh) &&
                      ` · ${x(M.finance_portfolio_target_range)}: ${w.targetLow ?? '—'}–${w.targetHigh ?? '—'}`}
                  </div>
                  {w.thesis && (
                    <div className="mt-[2px] text-[12px] text-text-muted">{x(w.thesis)}</div>
                  )}
                </div>
                {canWrite ? (
                  <select
                    value={w.status}
                    onChange={(e) =>
                      void transitionWatchlistStatus(w.id, e.target.value as FinanceWatchlistStatus)
                    }
                    aria-label={x(M.finance_status)}
                    className="shrink-0 rounded-[6px] border border-border bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2"
                  >
                    {(Object.keys(WATCHLIST_STATUS_LABEL) as FinanceWatchlistStatus[]).map((s) => (
                      <option key={s} value={s}>
                        {x(WATCHLIST_STATUS_LABEL[s])}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className={statusChipClass(w.status === 'dropped' ? 'neutral' : 'warning')}>
                    {x(WATCHLIST_STATUS_LABEL[w.status])}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Decision journal */}
      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <div className="mb-[12px] flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-text">{x(M.finance_portfolio_journal)}</h2>
          {canWrite && (
            <button
              type="button"
              onClick={() => setShowDecisionForm((v) => !v)}
              className="flex items-center gap-[6px] text-[13px] font-semibold text-accent"
            >
              <Plus size={14} />
              {x(M.finance_portfolio_decision_add)}
            </button>
          )}
        </div>
        {showDecisionForm && canWrite && (
          <DecisionForm
            entityId={firstEntityId}
            subjects={[
              ...state.holdings.map((h) => ({
                key: `h:${h.id}`,
                name: pickL(h.label, lang),
                holdingId: h.id,
              })),
              ...state.watchlistItems.map((w) => ({
                key: `w:${w.id}`,
                name: w.symbol ? `${w.symbol} — ${pickL(w.label, lang)}` : pickL(w.label, lang),
                watchlistItemId: w.id,
              })),
            ]}
            onSubmit={(entry) => {
              void addDecisionEntry(entry)
              setShowDecisionForm(false)
            }}
            onCancel={() => setShowDecisionForm(false)}
          />
        )}
        {sortedEntries.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.finance_portfolio_empty_journal)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[12px] p-0">
            {sortedEntries.map((d) => (
              <li key={d.id} className="border-b border-inset pb-[12px] last:border-b-0 last:pb-0">
                <div className="flex items-start justify-between gap-[12px]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-[8px]">
                      <span
                        className={statusChipClass(
                          d.decision === 'buy' || d.decision === 'add'
                            ? 'success'
                            : d.decision === 'sell' || d.decision === 'exit'
                              ? 'risk'
                              : 'neutral',
                        )}
                      >
                        {x(DECISION_KIND_LABEL[d.decision])}
                      </span>
                      <span className="text-[13px] font-semibold text-text">{x(d.summary)}</span>
                    </div>
                    <div className="mt-[3px] text-[12px] text-text-muted">
                      {x(M.finance_portfolio_decided_at)}: {d.decidedAt}
                      {' · '}
                      {x(M.finance_portfolio_subject)}:{' '}
                      {subjectName(d.holdingId, d.watchlistItemId)}
                      {d.reviewDate && ` · ${x(M.finance_portfolio_review_date)}: ${d.reviewDate}`}
                    </div>
                    {d.rationale && (
                      <div className="mt-[4px] text-[12px] leading-[1.5] text-text-2">
                        {x(M.finance_portfolio_rationale)}: {x(d.rationale)}
                      </div>
                    )}
                    {d.outcome && (
                      <div className="mt-[4px] text-[12px] leading-[1.5] text-text-2">
                        {x(M.finance_portfolio_outcome)}: {x(d.outcome)}
                      </div>
                    )}
                    {canWrite && outcomeEdit === d.id && (
                      <div className="mt-[6px] flex items-center gap-[6px]">
                        <input
                          value={outcomeText}
                          onChange={(e) => setOutcomeText(e.target.value)}
                          placeholder={x(M.finance_portfolio_outcome)}
                          className="w-[240px] rounded-[6px] border border-border bg-surface px-[6px] py-[3px] text-[12px]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const text = outcomeText.trim()
                            if (!text) return
                            const outcome: Bi = { en: text, fr: text }
                            void updateDecisionOutcome(d.id, outcome)
                            setOutcomeEdit(null)
                            setOutcomeText('')
                          }}
                          className="rounded-[6px] bg-navy px-[8px] py-[3px] text-[11px] font-semibold text-white"
                        >
                          {x(M.finance_save)}
                        </button>
                        <button
                          type="button"
                          onClick={() => setOutcomeEdit(null)}
                          className="rounded-[6px] bg-inset px-[8px] py-[3px] text-[11px] font-semibold text-text-2 border border-border"
                        >
                          {x(M.finance_cancel)}
                        </button>
                      </div>
                    )}
                    {canWrite && outcomeEdit !== d.id && !d.outcome && (
                      <button
                        type="button"
                        onClick={() => {
                          setOutcomeEdit(d.id)
                          setOutcomeText('')
                        }}
                        className="mt-[6px] rounded-[6px] bg-surface px-[8px] py-[3px] text-[11px] font-semibold text-text-2 hover:bg-inset border border-border"
                      >
                        {x(M.finance_portfolio_record_outcome)}
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

/* ---------- Forms ---------- */

function WatchlistForm({
  entityId,
  onSubmit,
  onCancel,
}: {
  entityId: string
  onSubmit: (item: Omit<import('../data/types').FinanceWatchlistItem, 'id'>) => void
  onCancel: () => void
}) {
  const { x, lang } = useI18n()
  const [symbol, setSymbol] = useState('')
  const [label, setLabel] = useState('')
  const [assetClass, setAssetClass] = useState<FinanceAssetClass>('fund')
  const [thesis, setThesis] = useState('')
  const [targetLow, setTargetLow] = useState('')
  const [targetHigh, setTargetHigh] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!entityId || !label.trim()) return
    const thesisText = thesis.trim()
    onSubmit({
      entityId,
      symbol: symbol.trim() || undefined,
      label: { en: label.trim(), fr: label.trim() },
      assetClass,
      thesis: thesisText ? ({ en: thesisText, fr: thesisText } satisfies Bi as Bi) : undefined,
      targetLow: targetLow.trim() || undefined,
      targetHigh: targetHigh.trim() || undefined,
      currency: 'CAD',
      status: 'watching',
    })
    void lang
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-[12px] flex flex-col gap-[10px] rounded-[10px] bg-inset p-[12px]"
    >
      <div className="grid grid-cols-2 gap-[10px]">
        <label className={labelClass}>
          <span>{x(M.finance_portfolio_symbol)}</span>
          <input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          <span>{x(M.finance_portfolio_asset_class)}</span>
          <select
            value={assetClass}
            onChange={(e) => setAssetClass(e.target.value as FinanceAssetClass)}
            className={inputClass}
          >
            {(Object.keys(ASSET_CLASS_LABEL) as FinanceAssetClass[]).map((c) => (
              <option key={c} value={c}>
                {x(ASSET_CLASS_LABEL[c])}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className={labelClass}>
        <span>{x(M.finance_name)}</span>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className={inputClass}
          required
        />
      </label>
      <label className={labelClass}>
        <span>{x(M.finance_portfolio_thesis)}</span>
        <input value={thesis} onChange={(e) => setThesis(e.target.value)} className={inputClass} />
      </label>
      <div className="grid grid-cols-2 gap-[10px]">
        <label className={labelClass}>
          <span>{x(M.finance_portfolio_target_low)}</span>
          <input
            value={targetLow}
            onChange={(e) => setTargetLow(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          <span>{x(M.finance_portfolio_target_high)}</span>
          <input
            value={targetHigh}
            onChange={(e) => setTargetHigh(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>
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

function DecisionForm({
  entityId,
  subjects,
  onSubmit,
  onCancel,
}: {
  entityId: string
  subjects: { key: string; name: string; holdingId?: string; watchlistItemId?: string }[]
  onSubmit: (entry: Omit<import('../data/types').FinanceDecisionEntry, 'id'>) => void
  onCancel: () => void
}) {
  const { x } = useI18n()
  const [subjectKey, setSubjectKey] = useState('')
  const [decision, setDecision] = useState<FinanceDecisionKind>('review')
  const [decidedAt, setDecidedAt] = useState(() => new Date().toISOString().slice(0, 10))
  const [summary, setSummary] = useState('')
  const [rationale, setRationale] = useState('')
  const [reviewDate, setReviewDate] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!entityId || !summary.trim()) return
    const subject = subjects.find((s) => s.key === subjectKey)
    onSubmit({
      entityId,
      holdingId: subject?.holdingId,
      watchlistItemId: subject?.watchlistItemId,
      decision,
      decidedAt,
      summary: { en: summary.trim(), fr: summary.trim() },
      rationale: rationale.trim() ? { en: rationale.trim(), fr: rationale.trim() } : undefined,
      reviewDate: reviewDate || undefined,
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-[12px] flex flex-col gap-[10px] rounded-[10px] bg-inset p-[12px]"
    >
      <div className="grid grid-cols-2 gap-[10px]">
        <label className={labelClass}>
          <span>{x(M.finance_portfolio_subject)}</span>
          <select
            value={subjectKey}
            onChange={(e) => setSubjectKey(e.target.value)}
            className={inputClass}
          >
            <option value="">—</option>
            {subjects.map((s) => (
              <option key={s.key} value={s.key}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
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
      <div className="grid grid-cols-2 gap-[10px]">
        <label className={labelClass}>
          <span>{x(M.finance_portfolio_decided_at)}</span>
          <input
            type="date"
            value={decidedAt}
            onChange={(e) => setDecidedAt(e.target.value)}
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
      </div>
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
