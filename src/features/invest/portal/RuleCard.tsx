import { Bell, ShoppingCart, Trash2, TriangleAlert } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { investMessages as IM } from '@/i18n/messages/invest'
import {
  BOOK_METRICS,
  RULE_METRIC_LABELS,
  RULE_METRICS,
  cadenceMismatch,
  ruleSentence,
} from '@/features/invest/data/strategyRules'
import type {
  OrderSide,
  QuantityUnit,
  RuleMetric,
  SignalSeverity,
  StrategyCadence,
  StrategyRule,
} from '@/features/invest/data/types'

const fieldClass =
  'h-[38px] w-full rounded-[9px] border border-border bg-bg px-[11px] text-[13px] text-text outline-none focus:border-navy'
const labelClass = 'mb-[4px] block text-[11.5px] font-semibold text-text-2'

const severityLabel: Record<SignalSeverity, keyof typeof IM> = {
  insight: 'invest_signal_kind_insight',
  alert: 'invest_signal_kind_alert',
}

const unitLabel: Record<QuantityUnit, keyof typeof IM> = {
  shares: 'invest_unit_shares',
  percent_of_position: 'invest_unit_pct',
  currency: 'invest_unit_currency',
}

const cadenceLabel: Record<StrategyCadence, keyof typeof IM> = {
  daily: 'invest_cadence_daily',
  weekly: 'invest_cadence_weekly',
  monthly: 'invest_cadence_monthly',
}

function baseOf(r: StrategyRule) {
  return { metric: r.metric, op: r.op, value: r.value, title: r.title }
}

/**
 * One rule as a stacked card — the plain-English sentence stays visible
 * while the fields edit it. Order fields render only on order-proposal
 * rules; signal rules carry severity instead.
 */
export function RuleCard({
  rule,
  cadence,
  fireCount,
  canRemove,
  onChange,
  onRemove,
}: {
  rule: StrategyRule
  cadence: StrategyCadence
  /** 90-day firing count, or null when no history exists. */
  fireCount: number | null
  canRemove: boolean
  onChange: (rule: StrategyRule) => void
  onRemove: () => void
}) {
  const { x } = useI18n()
  const mismatch = cadenceMismatch(rule, cadence)
  const proposalOnBookMetric = rule.type === 'order_proposal' && BOOK_METRICS.includes(rule.metric)

  return (
    <div className="flex flex-col gap-[10px] rounded-[10px] border border-border bg-inset p-[12px]">
      {/* The rule as a sentence — always visible, never truncated. */}
      <p className="m-0 text-[13px] font-semibold leading-normal text-text">
        {x(ruleSentence(rule, (m) => IM[RULE_METRIC_LABELS[m] as keyof typeof IM]))}
      </p>

      <div className="flex flex-wrap items-end gap-[8px]">
        <div className="min-w-[170px] flex-1">
          <label className={labelClass}>{x(IM.invest_rule_metric)}</label>
          <select
            value={rule.metric}
            onChange={(e) => onChange({ ...rule, metric: e.target.value as RuleMetric })}
            className={fieldClass}
          >
            {RULE_METRICS.map((m) => (
              <option key={m} value={m}>
                {x(IM[RULE_METRIC_LABELS[m] as keyof typeof IM])}
              </option>
            ))}
          </select>
        </div>
        <div className="w-[110px]">
          <label className={labelClass}>{x(IM.invest_rule_operator)}</label>
          <select
            value={rule.op}
            onChange={(e) => onChange({ ...rule, op: e.target.value as 'lt' | 'gt' })}
            className={fieldClass}
          >
            <option value="lt">{x(IM.invest_rule_lt)}</option>
            <option value="gt">{x(IM.invest_rule_gt)}</option>
          </select>
        </div>
        <div className="w-[90px]">
          <label className={labelClass}>{x(IM.invest_rule_value)}</label>
          <input
            type="number"
            step="any"
            value={rule.value}
            onChange={(e) => onChange({ ...rule, value: Number(e.target.value) })}
            className={fieldClass}
            required
          />
        </div>
        <div className="min-w-[160px] flex-1">
          <label className={labelClass}>{x(IM.invest_rule_title)}</label>
          <input
            value={rule.title}
            onChange={(e) => onChange({ ...rule, title: e.target.value })}
            className={fieldClass}
            required
          />
        </div>
      </div>

      {/* Notify vs propose — mutually exclusive, per rule. */}
      <div>
        <span className={labelClass}>{x(IM.invest_rule_when_matches)}</span>
        <div
          className="flex flex-wrap gap-[6px]"
          role="group"
          aria-label={x(IM.invest_rule_when_matches)}
        >
          <button
            type="button"
            aria-pressed={rule.type === 'signal'}
            onClick={() => onChange({ ...baseOf(rule), type: 'signal', severity: 'insight' })}
            className={`inline-flex min-h-[36px] cursor-pointer items-center gap-[6px] rounded-full px-[12px] text-[12px] font-semibold ${
              rule.type === 'signal'
                ? 'border border-navy bg-navy text-white'
                : 'border border-border bg-transparent text-text-2 hover:bg-surface'
            }`}
          >
            <Bell size={12} aria-hidden="true" />
            {x(IM.invest_rule_notify)}
          </button>
          <button
            type="button"
            aria-pressed={rule.type === 'order_proposal'}
            onClick={() =>
              onChange({
                ...baseOf(rule),
                type: 'order_proposal',
                side: 'buy',
                qty: 1,
                qtyUnit: 'shares',
              })
            }
            className={`inline-flex min-h-[36px] cursor-pointer items-center gap-[6px] rounded-full px-[12px] text-[12px] font-semibold ${
              rule.type === 'order_proposal'
                ? 'border border-navy bg-navy text-white'
                : 'border border-border bg-transparent text-text-2 hover:bg-surface'
            }`}
          >
            <ShoppingCart size={12} aria-hidden="true" />
            {x(IM.invest_rule_propose)}
          </button>
        </div>
      </div>

      {rule.type === 'signal' ? (
        <div className="w-[160px]">
          <label className={labelClass}>{x(IM.invest_rule_severity)}</label>
          <select
            value={rule.severity}
            onChange={(e) => onChange({ ...rule, severity: e.target.value as SignalSeverity })}
            className={fieldClass}
          >
            {(['insight', 'alert'] as const).map((s) => (
              <option key={s} value={s}>
                {x(IM[severityLabel[s]])}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="flex flex-col gap-[8px]">
          <div className="flex flex-wrap items-end gap-[8px]">
            <div className="w-[110px]">
              <label className={labelClass}>{x(IM.invest_order_side)}</label>
              <select
                value={rule.side}
                onChange={(e) => onChange({ ...rule, side: e.target.value as OrderSide })}
                className={fieldClass}
              >
                <option value="buy">{x(IM.invest_order_buy)}</option>
                <option value="sell">{x(IM.invest_order_sell)}</option>
              </select>
            </div>
            <div className="w-[110px]">
              <label className={labelClass}>{x(IM.invest_field_quantity)}</label>
              <input
                type="number"
                min="0"
                step="any"
                value={rule.qty}
                onChange={(e) => onChange({ ...rule, qty: Number(e.target.value) })}
                className={fieldClass}
                required
              />
            </div>
            <div className="w-[170px]">
              <label className={labelClass}>{x(IM.invest_qty_unit)}</label>
              <select
                value={rule.qtyUnit}
                onChange={(e) => onChange({ ...rule, qtyUnit: e.target.value as QuantityUnit })}
                className={fieldClass}
              >
                {(Object.keys(unitLabel) as QuantityUnit[]).map((u) => (
                  <option key={u} value={u}>
                    {x(IM[unitLabel[u]])}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="m-0 rounded-[8px] border border-border bg-surface px-[10px] py-[7px] text-[11.5px] leading-normal text-text-2">
            {x(IM.invest_proposal_guarantee)}
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-[8px]">
        <div className="flex flex-col gap-[4px]">
          <p className="m-0 text-[11px] text-text-muted">
            {fireCount === null
              ? x(IM.invest_rule_no_history)
              : x(IM.invest_rule_fired).replace('{count}', String(fireCount))}
          </p>
          {mismatch && (
            <p className="m-0 flex items-center gap-[5px] text-[11px] font-semibold text-risk-fg">
              <TriangleAlert size={12} aria-hidden="true" />
              {x(IM.invest_cadence_mismatch).replace(
                '{cadence}',
                x(IM[cadenceLabel[cadence]]).toLowerCase(),
              )}
            </p>
          )}
          {proposalOnBookMetric && (
            <p className="m-0 flex items-center gap-[5px] text-[11px] font-semibold text-risk-fg">
              <TriangleAlert size={12} aria-hidden="true" />
              {x(IM.invest_proposal_book_metric)}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          aria-label={x(IM.invest_rule_remove)}
          className="inline-flex min-h-[36px] cursor-pointer items-center gap-[5px] rounded-[8px] border border-border bg-transparent px-[10px] text-[11.5px] font-semibold text-text-muted hover:text-risk-fg disabled:opacity-50"
        >
          <Trash2 size={12} aria-hidden="true" />
          {x(IM.invest_rule_remove)}
        </button>
      </div>
    </div>
  )
}
