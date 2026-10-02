/**
 * Rules accordion — the strategy builder's rule list, shared by the editor
 * and the wizard's review step. Port of the approved prototype:
 *
 * - Collapsed row: grip, auto-generated summary title, the user's label,
 *   action chip (Notify · severity | Propose order), up/down reorder
 *   arrows, expand chevron. One rule open at a time.
 * - Expanded body: metric, condition + threshold ($ … CAD wrap on currency
 *   metrics), 60-char label with live counter, match action segmented
 *   control, then severity (notify) or side + combined quantity control
 *   with the live plain-language preview (order).
 * - Remove lives only inside the expanded body, with two-tap confirm
 *   ("Tap again to confirm", auto-disarm after ~2.6 s).
 * - Rule array order is evaluation priority — the engine walks it top to
 *   bottom, so the reorder controls write through as-is.
 */
import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, ChevronDown, GripVertical, Plus, Trash2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { fill } from '@/lib/format'
import { investMessages as IM } from '@/i18n/messages/invest'
import { BOOK_METRICS, RULE_METRICS } from '../data/strategyRules'
import { RULE_METRIC_LABELS } from '../data/strategyRules'
import type { RuleMetric, StrategyRule } from '../data/types'
import { newRuleDraft } from './ruleDrafts'
import type { RuleDraft } from './ruleDrafts'
import {
  actionChip,
  isCurrencyMetric,
  qtyPreview,
  ruleTitle,
} from './strategyUi'

const RULE_LABEL_MAX = 60
const CONFIRM_MS = 2600

interface Props {
  drafts: RuleDraft[]
  onChange: (next: RuleDraft[]) => void
  /** Element-id namespace ('ed'/'wz') so the editor and wizard accordions
      never collide on one page. */
  idPrefix: string
  /** Editor only — 90-day firing count per rule (null = no history). */
  fireCount?: (rule: StrategyRule) => number | null
}

export function RulesAccordion({ drafts, onChange, idPrefix, fireCount }: Props) {
  const { x, lang } = useI18n()
  const [openId, setOpenId] = useState<string | null>(drafts[0]?.id ?? null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  /* Two-tap confirm auto-disarm — mirrors the prototype's 2.6 s timeout. */
  useEffect(() => {
    if (confirmId === null) return
    const t = window.setTimeout(() => setConfirmId(null), CONFIRM_MS)
    return () => window.clearTimeout(t)
  }, [confirmId])

  const patch = (id: string, next: StrategyRule) =>
    onChange(drafts.map((d) => (d.id === id ? { ...d, rule: next } : d)))

  const move = (index: number, delta: -1 | 1) => {
    const target = index + delta
    if (target < 0 || target >= drafts.length) return
    const next = [...drafts]
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item!)
    onChange(next)
  }

  const remove = (id: string) => {
    if (confirmId !== id) {
      setConfirmId(id)
      return
    }
    setConfirmId(null)
    if (openId === id) setOpenId(null)
    onChange(drafts.filter((d) => d.id !== id))
  }

  const addRule = () => {
    const draft = newRuleDraft()
    setOpenId(draft.id)
    setConfirmId(null)
    onChange([...drafts, draft])
  }

  /* Toggling the action re-shapes the rule — the union type swaps which
     fields exist, matching the engine's parseRules contract. */
  const setAction = (draft: RuleDraft, action: 'notify' | 'order') => {
    const r = draft.rule
    if (action === 'notify' && r.type !== 'signal') {
      patch(draft.id, { ...r, type: 'signal', severity: 'insight' })
    } else if (action === 'order' && r.type !== 'order_proposal') {
      patch(draft.id, {
        ...r,
        type: 'order_proposal',
        side: 'buy',
        qty: 1,
        qtyUnit: 'shares',
      })
    }
  }

  return (
    <div>
      {drafts.map((draft, i) => {
        const r = draft.rule
        const open = openId === draft.id
        const label = r.title
        const chip = actionChip(lang, r)
        const fired = fireCount?.(r) ?? null
        const bodyId = `${idPrefix}-body-${draft.id}`
        const isBook = BOOK_METRICS.includes(r.metric)
        return (
          <div key={draft.id} className={`sb-rule${open ? ' sb-open' : ''}`}>
            <div className="sb-rule-head">
              <div className="sb-grip" aria-hidden="true">
                <GripVertical size={18} strokeWidth={1.7} />
              </div>
              <div className="sb-rule-main">
                <div className="sb-r-title">{ruleTitle(lang, r)}</div>
                <div className="sb-r-label" title={label}>
                  {label}
                </div>
                <div className="sb-r-chiprow">
                  <span className={`sb-chip sb-chip-${chip.tone}`}>{chip.label}</span>
                </div>
              </div>
              <div className="sb-rule-tools">
                <div className="sb-reorder">
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                    aria-label={x(IM.invest_sb_move_up)}
                    title={x(IM.invest_sb_move_up_t)}
                  >
                    <ArrowUp size={16} strokeWidth={2.2} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    disabled={i === drafts.length - 1}
                    onClick={() => move(i, 1)}
                    aria-label={x(IM.invest_sb_move_down)}
                    title={x(IM.invest_sb_move_down_t)}
                  >
                    <ArrowDown size={16} strokeWidth={2.2} aria-hidden="true" />
                  </button>
                </div>
                <button
                  type="button"
                  className="sb-expand-btn"
                  aria-expanded={open}
                  aria-controls={bodyId}
                  aria-label={x(open ? IM.invest_sb_collapse : IM.invest_sb_expand)}
                  onClick={() => {
                    setOpenId(open ? null : draft.id)
                    setConfirmId(null)
                  }}
                >
                  <ChevronDown size={20} strokeWidth={2.2} aria-hidden="true" />
                </button>
              </div>
            </div>
            {open && (
              <div className="sb-rule-body" id={bodyId}>
                <div className="sb-field">
                  <label className="sb-flabel" htmlFor={`${idPrefix}-metric-${draft.id}`}>
                    {x(IM.invest_sb_metric)}
                  </label>
                  <select
                    className="sb-input"
                    id={`${idPrefix}-metric-${draft.id}`}
                    value={r.metric}
                    onChange={(e) => patch(draft.id, { ...r, metric: e.target.value as RuleMetric })}
                  >
                    {RULE_METRICS.map((m) => (
                      <option key={m} value={m}>
                        {x(IM[RULE_METRIC_LABELS[m] as keyof typeof IM])}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sb-field">
                  <span className="sb-flabel" id={`${idPrefix}-cond-${draft.id}-l`}>
                    {x(IM.invest_sb_condition)}
                  </span>
                  <div
                    className="sb-cond-row"
                    role="group"
                    aria-labelledby={`${idPrefix}-cond-${draft.id}-l`}
                  >
                    <select
                      className="sb-input"
                      aria-label={x(IM.invest_sb_condition)}
                      value={r.op}
                      onChange={(e) =>
                        patch(draft.id, { ...r, op: e.target.value === 'lt' ? 'lt' : 'gt' })
                      }
                    >
                      <option value="lt">{x(IM.invest_sb_cond_below)}</option>
                      <option value="gt">{x(IM.invest_sb_cond_above)}</option>
                    </select>
                    {isCurrencyMetric(r.metric) ? (
                      <div className="sb-cur-wrap">
                        <span className="sb-pre">$</span>
                        <input
                          className="sb-input"
                          type="number"
                          value={Number.isFinite(r.value) ? r.value : ''}
                          step="any"
                          inputMode="decimal"
                          aria-label={x(IM.invest_sb_threshold_cad)}
                          onChange={(e) =>
                            patch(draft.id, {
                              ...r,
                              value: Number.isNaN(e.target.valueAsNumber)
                                ? NaN
                                : e.target.valueAsNumber,
                            })
                          }
                        />
                        <span className="sb-suf">CAD</span>
                      </div>
                    ) : (
                      <div className="sb-cur-wrap">
                        <input
                          className="sb-input"
                          type="number"
                          value={Number.isFinite(r.value) ? r.value : ''}
                          step="any"
                          inputMode="decimal"
                          aria-label={x(IM.invest_sb_threshold)}
                          onChange={(e) =>
                            patch(draft.id, {
                              ...r,
                              value: Number.isNaN(e.target.valueAsNumber)
                                ? NaN
                                : e.target.valueAsNumber,
                            })
                          }
                        />
                        <span className="sb-suf">%</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="sb-field">
                  <div className="sb-label-count">
                    <label
                      className="sb-flabel"
                      style={{ marginBottom: 8 }}
                      htmlFor={`${idPrefix}-label-${draft.id}`}
                    >
                      {x(IM.invest_sb_rule_label)}
                    </label>
                    <span className="sb-count">
                      {label.length} / {RULE_LABEL_MAX}
                    </span>
                  </div>
                  <input
                    className="sb-input"
                    id={`${idPrefix}-label-${draft.id}`}
                    value={label}
                    maxLength={RULE_LABEL_MAX}
                    placeholder={x(IM.invest_sb_rule_label_ph)}
                    onChange={(e) =>
                      patch(draft.id, { ...r, title: e.target.value.slice(0, RULE_LABEL_MAX) })
                    }
                  />
                </div>
                <div className="sb-field">
                  <span className="sb-flabel" id={`${idPrefix}-act-${draft.id}-l`}>
                    {x(IM.invest_sb_when_match)}
                  </span>
                  <div
                    className="sb-seg"
                    role="group"
                    aria-labelledby={`${idPrefix}-act-${draft.id}-l`}
                  >
                    <button
                      type="button"
                      aria-pressed={r.type === 'signal'}
                      onClick={() => setAction(draft, 'notify')}
                    >
                      {x(IM.invest_sb_notify_me)}
                    </button>
                    <button
                      type="button"
                      aria-pressed={r.type === 'order_proposal'}
                      onClick={() => setAction(draft, 'order')}
                    >
                      {x(IM.invest_sb_propose_order)}
                    </button>
                  </div>
                </div>
                {r.type === 'signal' ? (
                  <div className="sb-field">
                    <label className="sb-flabel" htmlFor={`${idPrefix}-sev-${draft.id}`}>
                      {x(IM.invest_sb_severity)}
                    </label>
                    <select
                      className="sb-input"
                      id={`${idPrefix}-sev-${draft.id}`}
                      value={r.severity}
                      onChange={(e) =>
                        patch(draft.id, {
                          ...r,
                          severity: e.target.value === 'alert' ? 'alert' : 'insight',
                        })
                      }
                    >
                      <option value="insight">{x(IM.invest_sb_insight)}</option>
                      <option value="alert">{x(IM.invest_sb_alert)}</option>
                    </select>
                    <p className="sb-helper">{x(IM.invest_sb_severity_help)}</p>
                  </div>
                ) : (
                  <>
                    {isBook && (
                      <p className="sb-helper">{x(IM.invest_proposal_book_metric)}</p>
                    )}
                    <div className="sb-field">
                      <label className="sb-flabel" htmlFor={`${idPrefix}-side-${draft.id}`}>
                        {x(IM.invest_sb_side)}
                      </label>
                      <select
                        className="sb-input"
                        id={`${idPrefix}-side-${draft.id}`}
                        value={r.side}
                        onChange={(e) =>
                          patch(draft.id, {
                            ...r,
                            side: e.target.value === 'sell' ? 'sell' : 'buy',
                          })
                        }
                      >
                        <option value="buy">{x(IM.invest_sb_buy)}</option>
                        <option value="sell">{x(IM.invest_sb_sell)}</option>
                      </select>
                    </div>
                    <div className="sb-field">
                      <span className="sb-flabel" id={`${idPrefix}-qty-${draft.id}-l`}>
                        {x(IM.invest_sb_quantity)}
                      </span>
                      <div
                        className="sb-qty-row"
                        role="group"
                        aria-labelledby={`${idPrefix}-qty-${draft.id}-l`}
                      >
                        <input
                          className="sb-input"
                          type="number"
                          value={Number.isFinite(r.qty) ? r.qty : ''}
                          min="0"
                          step="any"
                          inputMode="decimal"
                          aria-label={x(IM.invest_sb_qty_amount)}
                          onChange={(e) =>
                            patch(draft.id, {
                              ...r,
                              qty: Number.isNaN(e.target.valueAsNumber)
                                ? NaN
                                : e.target.valueAsNumber,
                            })
                          }
                        />
                        <select
                          className="sb-input"
                          aria-label={x(IM.invest_sb_qty_unit)}
                          value={r.qtyUnit}
                          onChange={(e) =>
                            patch(draft.id, {
                              ...r,
                              qtyUnit: e.target.value as typeof r.qtyUnit,
                            })
                          }
                        >
                          <option value="shares">{x(IM.invest_sb_unit_shares)}</option>
                          <option value="percent_of_position">
                            {x(IM.invest_sb_unit_pct)}
                          </option>
                          <option value="currency">{x(IM.invest_sb_unit_currency)}</option>
                        </select>
                      </div>
                      <div className="sb-preview-line">{qtyPreview(lang, r)}</div>
                    </div>
                  </>
                )}
                {fired !== null && (
                  <p className="sb-fire-note">{fill(x(IM.invest_rule_fired), { count: fired })}</p>
                )}
                {fired === null && fireCount && (
                  <p className="sb-fire-note">{x(IM.invest_rule_no_history)}</p>
                )}
                <div className="sb-remove-wrap">
                  <button
                    type="button"
                    className={`sb-btn sb-btn-danger${confirmId === draft.id ? ' sb-armed' : ''}`}
                    onClick={() => remove(draft.id)}
                  >
                    <Trash2 size={15} strokeWidth={2.2} aria-hidden="true" />
                    {x(confirmId === draft.id ? IM.invest_sb_tap_confirm : IM.invest_sb_remove_rule)}
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
      <button type="button" className="sb-btn sb-btn-secondary sb-btn-block" onClick={addRule}>
        <Plus size={16} strokeWidth={2.4} aria-hidden="true" />
        {x(IM.invest_sb_add_rule)}
      </button>
    </div>
  )
}
