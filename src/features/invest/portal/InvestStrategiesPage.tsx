import { useState, type FormEvent } from 'react'
import { Loader2, Play, Plus, Trash2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { investMessages as IM } from '@/i18n/messages/invest'
import {
  ASSET_CLASSES,
  type AssetClass,
  type InvestStrategy,
  type SignalKind,
  type StrategyAutonomy,
  type StrategyCadence,
  type StrategyRule,
} from '@/features/invest/data/types'
import { useInvestData } from '@/features/invest/data/InvestDataContext'
import {
  deleteStrategy,
  runBot,
  saveStrategy,
  setStrategyEnabled,
} from '@/features/invest/data/api'
import { StrategyTemplates } from './StrategyTemplates'
import { StrategyAiDraft } from './StrategyAiDraft'

const cardClass = 'rounded-[14px] border border-border bg-surface p-[18px]'
const fieldClass =
  'h-[38px] w-full rounded-[9px] border border-border bg-bg px-[11px] text-[13px] text-text outline-none focus:border-navy'
const labelClass = 'mb-[4px] block text-[11.5px] font-semibold text-text-2'
const btnClass =
  'inline-flex h-[38px] cursor-pointer items-center justify-center gap-[6px] rounded-[9px] border-none bg-navy px-[14px] text-[13px] font-semibold text-white disabled:opacity-50'
const ghostBtnClass =
  'inline-flex h-[32px] cursor-pointer items-center justify-center gap-[6px] rounded-[8px] border border-border bg-transparent px-[11px] text-[12px] font-semibold text-text-2 hover:bg-inset disabled:opacity-50'

const assetLabel: Record<AssetClass, keyof typeof IM> = {
  equity: 'invest_asset_equity',
  etf: 'invest_asset_etf',
  crypto: 'invest_asset_crypto',
  bond: 'invest_asset_bond',
  cash: 'invest_asset_cash',
  other: 'invest_asset_other',
}

const kindLabel: Record<SignalKind, keyof typeof IM> = {
  screen: 'invest_signal_kind_screen',
  insight: 'invest_signal_kind_insight',
  alert: 'invest_signal_kind_alert',
  thesis: 'invest_signal_kind_thesis',
}

const metricLabel: Record<StrategyRule['metric'], keyof typeof IM> = {
  day_change_pct: 'invest_rule_metric_day_change',
  vs_ma50: 'invest_rule_metric_vs_ma50',
  value_floor: 'invest_rule_metric_value_floor',
  weight_pct: 'invest_rule_metric_weight',
  unrealized_gain_pct: 'invest_rule_metric_gain',
  cash_above: 'invest_rule_metric_cash',
}

const RULE_METRICS = [
  'day_change_pct',
  'vs_ma50',
  'value_floor',
  'weight_pct',
  'unrealized_gain_pct',
  'cash_above',
] as const

const cadenceLabel: Record<StrategyCadence, keyof typeof IM> = {
  daily: 'invest_cadence_daily',
  weekly: 'invest_cadence_weekly',
  monthly: 'invest_cadence_monthly',
}

/** Bot tab — strategies, autonomy, on-demand runs, run history. */
export function InvestStrategiesPage() {
  const { x } = useI18n()
  const { state, loading, refresh } = useInvestData()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [editing, setEditing] = useState<InvestStrategy | null>(null)
  const [creating, setCreating] = useState(false)
  const [seed, setSeed] = useState<Omit<InvestStrategy, 'id'> | null>(null)
  const [drafted, setDrafted] = useState(false)

  const openSeededForm = (s: Omit<InvestStrategy, 'id'>, fromAi: boolean) => {
    setSeed(s)
    setDrafted(fromAi)
    setCreating(true)
    setEditing(null)
  }

  const closeForm = () => {
    setCreating(false)
    setEditing(null)
    setSeed(null)
    setDrafted(false)
  }

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    setError(undefined)
    try {
      await fn()
      await refresh()
    } catch {
      setError(x(IM.invest_error_generic))
    } finally {
      setBusy(false)
    }
  }

  const runNow = () =>
    run(async () => {
      await runBot()
    })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-[80px]">
        <Loader2 size={24} className="animate-spin text-text-muted" aria-hidden="true" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-[24px]">
      <div className="flex flex-wrap items-center justify-between gap-[12px]">
        <h1 className="m-0 font-display text-[22px] font-semibold tracking-[-0.01em] text-text">
          {x(IM.invest_strategies_title)}
        </h1>
        <div className="flex gap-[8px]">
          <button type="button" onClick={() => void runNow()} disabled={busy} className={btnClass}>
            {busy ? (
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            ) : (
              <Play size={14} aria-hidden="true" />
            )}
            {busy ? x(IM.invest_running) : x(IM.invest_run_now)}
          </button>
          <button
            type="button"
            onClick={() => {
              setCreating(true)
              setEditing(null)
              setSeed(null)
              setDrafted(false)
            }}
            className={ghostBtnClass}
          >
            <Plus size={13} aria-hidden="true" />
            {x(IM.invest_add_strategy)}
          </button>
        </div>
      </div>
      {error && (
        <p role="alert" className="m-0 text-[12.5px] text-risk-fg">
          {error}
        </p>
      )}

      <p className="m-0 text-[12px] leading-normal text-text-muted">{x(IM.invest_info_note)}</p>

      <StrategyTemplates disabled={busy} onPick={(s) => openSeededForm(s, false)} />
      <StrategyAiDraft disabled={busy} onDraft={(s) => openSeededForm(s, true)} />

      {(creating || editing) && (
        <StrategyForm
          initial={editing}
          seed={seed}
          drafted={drafted}
          busy={busy}
          onCancel={closeForm}
          onSave={(s) =>
            run(async () => {
              await saveStrategy(s)
              closeForm()
            })
          }
        />
      )}

      {state.strategies.length === 0 ? (
        <p className={`m-0 text-[12.5px] text-text-muted ${cardClass}`}>
          {x(IM.invest_strategies_empty)}
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-[10px] p-0">
          {state.strategies.map((s) => (
            <li key={s.id} className={cardClass}>
              <div className="flex flex-wrap items-start justify-between gap-[12px]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-[8px]">
                    <p className="m-0 text-[14px] font-semibold text-text">{s.name}</p>
                    <span
                      className={`rounded-full px-[8px] py-[2px] text-[10.5px] font-semibold ${
                        s.enabled ? 'bg-gold-bg text-gold-fg' : 'bg-inset text-text-muted'
                      }`}
                    >
                      {x(s.enabled ? IM.invest_strategy_enabled : IM.invest_strategy_disabled)}
                    </span>
                    <span className="rounded-full border border-border px-[8px] py-[2px] text-[10.5px] font-semibold text-text-2">
                      {x(
                        s.autonomy === 'paper_execute'
                          ? IM.invest_autonomy_paper
                          : IM.invest_autonomy_suggest,
                      )}
                    </span>
                    <span className="rounded-full border border-border px-[8px] py-[2px] text-[10.5px] font-semibold text-text-2">
                      {x(IM[cadenceLabel[s.cadence]])}
                    </span>
                    {s.template.startsWith('tpl:') && (
                      <span className="rounded-full border border-border px-[8px] py-[2px] text-[10.5px] font-semibold text-text-2">
                        {x(IM.invest_template_badge)}
                      </span>
                    )}
                  </div>
                  <p className="m-0 mt-[6px] text-[11.5px] text-text-muted">
                    {s.assetClasses.map((cls) => x(IM[assetLabel[cls]])).join(' · ')} —{' '}
                    {s.rules.length} {x(IM.invest_strategy_rules).toLowerCase()}
                  </p>
                  <ul className="m-0 mt-[8px] flex list-none flex-col gap-[4px] p-0">
                    {s.rules.map((r, i) => (
                      <li key={i} className="text-[12px] text-text-3">
                        {x(IM[metricLabel[r.metric]])} {x(r.op === 'lt' ? IM.invest_rule_lt : IM.invest_rule_gt)}{' '}
                        {r.value} → {x(IM[kindLabel[r.kind]])}
                        {r.side ? ` · ${x(r.side === 'buy' ? IM.invest_order_buy : IM.invest_order_sell)} ${r.qty ?? ''}` : ''}
                        {r.title ? ` · “${r.title}”` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex shrink-0 gap-[6px]">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => run(() => setStrategyEnabled(s.id, !s.enabled))}
                    className={ghostBtnClass}
                  >
                    {x(s.enabled ? IM.invest_strategy_disabled : IM.invest_strategy_enabled)}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setEditing(s)
                      setCreating(false)
                      setSeed(null)
                      setDrafted(false)
                    }}
                    className={ghostBtnClass}
                  >
                    {x(IM.invest_save)}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    aria-label={x(IM.invest_delete)}
                    onClick={() => {
                      if (window.confirm(x(IM.invest_delete_confirm)))
                        void run(() => deleteStrategy(s.id))
                    }}
                    className="inline-flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-[8px] border border-border bg-transparent text-text-muted hover:bg-inset hover:text-risk-fg disabled:opacity-50"
                  >
                    <Trash2 size={13} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <section className={cardClass}>
        <h2 className="m-0 text-[14px] font-semibold text-text">{x(IM.invest_runs_title)}</h2>
        {state.runs.length === 0 ? (
          <p className="m-0 mt-[10px] text-[12.5px] text-text-muted">{x(IM.invest_ov_never_run)}</p>
        ) : (
          <ul className="m-0 mt-[8px] flex list-none flex-col divide-y divide-border p-0">
            {state.runs.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-[12px] py-[9px] text-[12.5px]">
                <span className="text-text-2">{new Date(r.ranAt).toLocaleString()}</span>
                <span className="text-text-muted">
                  {x(IM.invest_run_summary)
                    .replace('{signals}', String(r.signalsEmitted))
                    .replace('{orders}', String(r.ordersExecuted + r.ordersSuggested))}
                </span>
                <span
                  className={`rounded-full px-[8px] py-[2px] text-[10.5px] font-semibold ${
                    r.status === 'ok' ? 'bg-gold-bg text-gold-fg' : 'bg-inset text-text-muted'
                  }`}
                >
                  {r.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function StrategyForm({
  initial,
  seed,
  drafted,
  busy,
  onSave,
  onCancel,
}: {
  initial: InvestStrategy | null
  seed: Omit<InvestStrategy, 'id'> | null
  drafted: boolean
  busy: boolean
  onSave: (s: Omit<InvestStrategy, 'id'> & { id?: string }) => Promise<void>
  onCancel: () => void
}) {
  const { x } = useI18n()
  const base = initial ?? seed
  const [name, setName] = useState(base?.name ?? '')
  const [assetClasses, setAssetClasses] = useState<AssetClass[]>(
    base?.assetClasses ?? ['equity'],
  )
  const [autonomy, setAutonomy] = useState<StrategyAutonomy>(base?.autonomy ?? 'suggest')
  const [cadence, setCadence] = useState<StrategyCadence>(base?.cadence ?? 'daily')
  const [rules, setRules] = useState<StrategyRule[]>(
    base?.rules ?? [{ metric: 'day_change_pct', op: 'lt', value: -5, kind: 'screen', title: '' }],
  )

  const toggleClass = (cls: AssetClass) =>
    setAssetClasses((prev) =>
      prev.includes(cls) ? prev.filter((c) => c !== cls) : [...prev, cls],
    )

  const setRule = (i: number, patch: Partial<StrategyRule>) =>
    setRules((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim() || assetClasses.length === 0 || rules.length === 0) return
    void onSave({
      id: initial?.id,
      name: name.trim(),
      enabled: initial?.enabled ?? true,
      assetClasses,
      rules,
      autonomy,
      cadence,
      template: seed?.template ?? initial?.template ?? '',
    })
  }

  return (
    <form onSubmit={submit} className={`${cardClass} flex flex-col gap-[14px]`}>
      {drafted && (
        <p className="m-0 rounded-[9px] border border-border bg-inset px-[11px] py-[8px] text-[12px] text-text-2">
          {x(IM.invest_ai_review)}
        </p>
      )}
      <div className="flex flex-wrap gap-[10px]">
        <div className="min-w-[200px] flex-1">
          <label className={labelClass} htmlFor="inv-str-name">
            {x(IM.invest_strategy_name)}
          </label>
          <input
            id="inv-str-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldClass}
            required
          />
        </div>
        <div className="w-[220px]">
          <label className={labelClass} htmlFor="inv-str-autonomy">
            {x(IM.invest_strategy_autonomy)}
          </label>
          <select
            id="inv-str-autonomy"
            value={autonomy}
            onChange={(e) => setAutonomy(e.target.value as StrategyAutonomy)}
            className={fieldClass}
          >
            <option value="suggest">{x(IM.invest_autonomy_suggest)}</option>
            <option value="paper_execute">{x(IM.invest_autonomy_paper)}</option>
          </select>
        </div>
        <div className="w-[160px]">
          <label className={labelClass} htmlFor="inv-str-cadence">
            {x(IM.invest_cadence_label)}
          </label>
          <select
            id="inv-str-cadence"
            value={cadence}
            onChange={(e) => setCadence(e.target.value as StrategyCadence)}
            className={fieldClass}
          >
            {(['daily', 'weekly', 'monthly'] as const).map((c) => (
              <option key={c} value={c}>
                {x(IM[cadenceLabel[c]])}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <span className={labelClass}>{x(IM.invest_field_asset_class)}</span>
        <div className="flex flex-wrap gap-[6px]">
          {ASSET_CLASSES.map((cls) => {
            const active = assetClasses.includes(cls)
            return (
              <button
                key={cls}
                type="button"
                aria-pressed={active}
                onClick={() => toggleClass(cls)}
                className={`cursor-pointer rounded-full px-[11px] py-[5px] text-[11.5px] font-semibold ${
                  active
                    ? 'border border-navy bg-navy text-white'
                    : 'border border-border bg-transparent text-text-2 hover:bg-inset'
                }`}
              >
                {x(IM[assetLabel[cls]])}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <span className={labelClass}>{x(IM.invest_strategy_rules)}</span>
        <div className="flex flex-col gap-[8px]">
          {rules.map((r, i) => (
            <div
              key={i}
              className="flex flex-wrap items-end gap-[8px] rounded-[10px] border border-border bg-inset p-[10px]"
            >
              <div className="w-[180px]">
                <label className={labelClass}>{x(IM.invest_rule_metric)}</label>
                <select
                  value={r.metric}
                  onChange={(e) => setRule(i, { metric: e.target.value as StrategyRule['metric'] })}
                  className={fieldClass}
                >
                  {RULE_METRICS.map((m) => (
                    <option key={m} value={m}>
                      {x(IM[metricLabel[m]])}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-[110px]">
                <label className={labelClass}>{x(IM.invest_rule_operator)}</label>
                <select
                  value={r.op}
                  onChange={(e) => setRule(i, { op: e.target.value as StrategyRule['op'] })}
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
                  value={r.value}
                  onChange={(e) => setRule(i, { value: Number(e.target.value) })}
                  className={fieldClass}
                  required
                />
              </div>
              <div className="w-[110px]">
                <label className={labelClass}>{x(IM.invest_rule_action)}</label>
                <select
                  value={r.kind}
                  onChange={(e) => setRule(i, { kind: e.target.value as SignalKind })}
                  className={fieldClass}
                >
                  {(['screen', 'insight', 'alert', 'thesis'] as const).map((k) => (
                    <option key={k} value={k}>
                      {x(IM[kindLabel[k]])}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-[140px] flex-1">
                <label className={labelClass}>{x(IM.invest_rule_title)}</label>
                <input
                  value={r.title}
                  onChange={(e) => setRule(i, { title: e.target.value })}
                  className={fieldClass}
                />
              </div>
              <div className="w-[90px]">
                <label className={labelClass}>{x(IM.invest_order_side)}</label>
                <select
                  value={r.side ?? ''}
                  onChange={(e) =>
                    setRule(i, { side: (e.target.value || undefined) as StrategyRule['side'] })
                  }
                  className={fieldClass}
                >
                  <option value="">—</option>
                  <option value="buy">{x(IM.invest_order_buy)}</option>
                  <option value="sell">{x(IM.invest_order_sell)}</option>
                </select>
              </div>
              <div className="w-[80px]">
                <label className={labelClass}>{x(IM.invest_field_quantity)}</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={r.qty ?? ''}
                  onChange={(e) =>
                    setRule(i, { qty: e.target.value ? Number(e.target.value) : undefined })
                  }
                  className={fieldClass}
                />
              </div>
              <button
                type="button"
                onClick={() => setRules((prev) => prev.filter((_, idx) => idx !== i))}
                disabled={rules.length <= 1}
                className="h-[38px] cursor-pointer rounded-[9px] border border-border bg-transparent px-[10px] text-[12px] font-semibold text-text-muted hover:text-risk-fg disabled:opacity-50"
              >
                {x(IM.invest_rule_remove)}
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            setRules((prev) => [
              ...prev,
              { metric: 'day_change_pct', op: 'lt', value: 0, kind: 'screen', title: '' },
            ])
          }
          className={`${ghostBtnClass} mt-[8px]`}
        >
          <Plus size={13} aria-hidden="true" />
          {x(IM.invest_rule_add)}
        </button>
      </div>

      <div className="flex gap-[8px]">
        <button
          type="submit"
          disabled={busy || !name.trim() || assetClasses.length === 0 || rules.length === 0}
          className={btnClass}
        >
          {x(IM.invest_save)}
        </button>
        <button type="button" onClick={onCancel} className={ghostBtnClass}>
          {x(IM.invest_cancel_order)}
        </button>
      </div>
    </form>
  )
}
