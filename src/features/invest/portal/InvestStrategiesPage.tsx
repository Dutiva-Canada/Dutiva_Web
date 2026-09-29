import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronUp, Loader2, Plus, ScanSearch, Trash2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { investMessages as IM } from '@/i18n/messages/invest'
import { RULE_METRIC_LABELS, ruleSentence } from '@/features/invest/data/strategyRules'
import { relTimeLabel } from './relTime'
import { fill } from '@/lib/format'
import type { InvestStrategy, QuantityUnit, StrategyCadence } from '@/features/invest/data/types'
import { useInvestData } from '@/features/invest/data/InvestDataContext'
import {
  deleteStrategy,
  saveStrategy,
  scanNow,
  setStrategyEnabled,
} from '@/features/invest/data/api'
import { StrategyTemplates } from './StrategyTemplates'
import { StrategyAiDraft } from './StrategyAiDraft'
import { StrategyForm } from './StrategyForm'

const cardClass = 'rounded-[14px] border border-border bg-surface p-[18px]'
const btnClass =
  'inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-[6px] rounded-[9px] border-none bg-navy px-[14px] text-[13px] font-semibold text-white disabled:opacity-50'
const ghostBtnClass =
  'inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-[6px] rounded-[8px] border border-border bg-transparent px-[11px] text-[12px] font-semibold text-text-2 hover:bg-inset disabled:opacity-50'

const cadenceLabel: Record<StrategyCadence, keyof typeof IM> = {
  daily: 'invest_cadence_daily',
  weekly: 'invest_cadence_weekly',
  monthly: 'invest_cadence_monthly',
}

const unitLabel: Record<QuantityUnit, keyof typeof IM> = {
  shares: 'invest_unit_shares',
  percent_of_position: 'invest_unit_pct',
  currency: 'invest_unit_currency',
}

/** Bot tab — strategies with scope + rule types, on-demand scans, run history. */
export function InvestStrategiesPage() {
  const { x } = useI18n()
  const { state, loading, refresh } = useInvestData()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [editing, setEditing] = useState<InvestStrategy | null>(null)
  const [creating, setCreating] = useState(false)
  const [seed, setSeed] = useState<Omit<InvestStrategy, 'id'> | null>(null)
  const [drafted, setDrafted] = useState(false)
  /* null = untouched: the create panel opens by itself only while the
     strategy list is empty; once the user toggles it, their choice wins. */
  const [createOpen, setCreateOpen] = useState<boolean | null>(null)
  const showPickers = (createOpen ?? state.strategies.length === 0) && !creating && !editing

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

  const scan = () =>
    run(async () => {
      await scanNow()
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
      <div className="flex flex-wrap items-start justify-between gap-[12px]">
        <h1 className="m-0 font-display text-[22px] font-semibold tracking-[-0.01em] text-text">
          {x(IM.invest_strategies_title)}
        </h1>
        <div className="flex gap-[8px]">
          <div className="flex flex-col items-end gap-[3px]">
            <button type="button" onClick={() => void scan()} disabled={busy} className={btnClass}>
              {busy ? (
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              ) : (
                <ScanSearch size={14} aria-hidden="true" />
              )}
              {busy ? x(IM.invest_scanning) : x(IM.invest_scan_now)}
            </button>
            <p className="m-0 text-[10.5px] text-text-muted">{x(IM.invest_scan_caption)}</p>
          </div>
          <button
            type="button"
            aria-expanded={showPickers}
            aria-controls="invest-create"
            onClick={() => setCreateOpen((v) => !(v ?? state.strategies.length === 0))}
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

      {/* Create paths collapse behind "New strategy" so the list stays
          dominant. Order inside: describe it in words, templates, blank. */}
      <section>
        <button
          type="button"
          aria-expanded={showPickers}
          aria-controls="invest-create"
          onClick={() => setCreateOpen(!(createOpen ?? state.strategies.length === 0))}
          className="flex w-full cursor-pointer items-center justify-between gap-[10px] border-none bg-transparent p-0 text-left"
        >
          <span className="text-[14px] font-semibold text-text">{x(IM.invest_add_strategy)}</span>
          <span className="flex items-center gap-[8px] text-[11.5px] text-text-muted">
            {x(IM.invest_create_sub)}
            {showPickers ? (
              <ChevronUp size={14} aria-hidden="true" />
            ) : (
              <ChevronDown size={14} aria-hidden="true" />
            )}
          </span>
        </button>
        {showPickers && (
          <div id="invest-create" className="mt-[12px] flex flex-col gap-[16px]">
            <StrategyAiDraft disabled={busy} onDraft={(s) => openSeededForm(s, true)} />
            <StrategyTemplates disabled={busy} onPick={(s) => openSeededForm(s, false)} />
            <button
              type="button"
              onClick={() => {
                setCreating(true)
                setEditing(null)
                setSeed(null)
                setDrafted(false)
              }}
              className={`${ghostBtnClass} self-start`}
            >
              {x(IM.invest_create_blank)}
            </button>
          </div>
        )}
      </section>

      {(creating || editing) && (
        <StrategyForm
          key={editing ? `edit:${editing.id}` : `seed:${JSON.stringify(seed)}`}
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
          {state.strategies.map((s) => {
            const hasProposal = s.rules.some((r) => r.type === 'order_proposal')
            const scopeSummary = [
              s.scope.watchlist ? x(IM.invest_scope_summary_watchlist) : null,
              s.scope.symbols.length > 0 ? s.scope.symbols.join(' · ') : null,
            ]
              .filter(Boolean)
              .join(' + ')
            return (
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
                        {x(IM[cadenceLabel[s.cadence]])}
                      </span>
                      {hasProposal && (
                        <span className="rounded-full border border-border px-[8px] py-[2px] text-[10.5px] font-semibold text-text-2">
                          {x(IM.invest_proposal_badge)}
                        </span>
                      )}
                      {s.template.startsWith('tpl:') && (
                        <span className="rounded-full border border-border px-[8px] py-[2px] text-[10.5px] font-semibold text-text-2">
                          {x(IM.invest_template_badge)}
                        </span>
                      )}
                    </div>
                    <p className="m-0 mt-[6px] text-[11.5px] text-text-muted">
                      {scopeSummary || '—'} — {s.rules.length}{' '}
                      {x(IM.invest_strategy_rules).toLowerCase()}
                    </p>
                    <ul className="m-0 mt-[8px] flex list-none flex-col gap-[4px] p-0">
                      {s.rules.map((r, i) => (
                        <li key={i} className="text-[12px] leading-normal text-text-3">
                          {x(ruleSentence(r, (m) => IM[RULE_METRIC_LABELS[m] as keyof typeof IM]))}
                          {' → '}
                          {x(r.type === 'signal' ? IM.invest_rule_notify : IM.invest_rule_propose)}
                          {r.type === 'order_proposal' &&
                            ` · ${x(r.side === 'buy' ? IM.invest_order_buy : IM.invest_order_sell)} ${r.qty} ${x(IM[unitLabel[r.qtyUnit]]).toLowerCase()}`}
                          {r.title ? ` · “${r.title}”` : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-[8px]">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => run(() => setStrategyEnabled(s.id, !s.enabled))}
                      className={ghostBtnClass}
                    >
                      {x(s.enabled ? IM.invest_strategy_disable : IM.invest_strategy_enable)}
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
                      {x(IM.invest_edit)}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      aria-label={x(IM.invest_delete)}
                      onClick={() => {
                        if (window.confirm(x(IM.invest_delete_confirm)))
                          void run(() => deleteStrategy(s.id))
                      }}
                      className="inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-[8px] border border-border bg-transparent text-text-muted hover:bg-inset hover:text-risk-fg disabled:opacity-50"
                    >
                      <Trash2 size={13} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <section className={cardClass}>
        <h2 className="m-0 text-[14px] font-semibold text-text">{x(IM.invest_runs_title)}</h2>
        {state.runs.length === 0 ? (
          <p className="m-0 mt-[10px] text-[12.5px] text-text-muted">{x(IM.invest_ov_never_run)}</p>
        ) : (
          <ul className="m-0 mt-[8px] flex list-none flex-col divide-y divide-border p-0">
            {state.runs.map((r) => {
              const hitEntries = Object.entries(r.ruleHits)
              const strategyName = r.strategyId
                ? (state.strategies.find((s) => s.id === r.strategyId)?.name ??
                  x(IM.invest_run_deleted_strategy))
                : x(IM.invest_run_sweep)
              const when = relTimeLabel(r.ranAt, x) ?? new Date(r.ranAt).toLocaleDateString()
              return (
                <li key={r.id} className="flex flex-col gap-[3px] py-[9px] text-[12.5px]">
                  <div className="flex flex-wrap items-center justify-between gap-[12px]">
                    <span className="text-text-2" title={new Date(r.ranAt).toLocaleString()}>
                      {when} — {strategyName}
                    </span>
                    <span className="text-text-muted">
                      {fill(x(IM.invest_run_summary), {
                        signals: r.signalsEmitted,
                        proposals: r.proposalsCreated,
                      })}
                      {r.symbolsScanned.length > 0 &&
                        ` · ${fill(x(IM.invest_run_scanned), { count: r.symbolsScanned.length })}`}
                      {r.durationMs !== null &&
                        ` · ${fill(x(IM.invest_run_duration), { seconds: (r.durationMs / 1000).toFixed(1) })}`}
                      {r.proposalsCreated > 0 && (
                        <>
                          {' · '}
                          <Link
                            to="/invest/orders"
                            className="font-semibold text-navy underline underline-offset-2 hover:text-text"
                          >
                            {x(IM.invest_run_view_orders)}
                          </Link>
                        </>
                      )}
                    </span>
                    <span
                      className={`rounded-full px-[8px] py-[2px] text-[10.5px] font-semibold ${
                        r.status === 'ok' ? 'bg-gold-bg text-gold-fg' : 'bg-inset text-text-muted'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                  {hitEntries.length > 0 && (
                    <p className="m-0 text-[11px] text-text-muted">
                      {hitEntries.map(([title, n]) => `${title} ×${n}`).join(' · ')}
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
