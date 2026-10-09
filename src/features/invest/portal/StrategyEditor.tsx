/**
 * Strategy editor — the core strategy-builder screen. Sections in the
 * prototype's order: back link → name + status pill → draft banner →
 * settings card → rules accordion → strategy health (real test scan) →
 * run history → sticky save bar (Discard restores the pre-edit snapshot).
 *
 * All mutations flow through `onChange` — the page owns draft state, dirty
 * tracking, and persistence, so Discard is just a snapshot restore.
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, Lock, ScanSearch } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { fill } from '@/lib/format'
import { investMessages as IM } from '@/i18n/messages/invest'
import { estimateFrequency, staleScopeSymbols } from '../data/strategyRules'
import type {
  InvestBotRun,
  InvestSignal,
  MarketSnapshot,
  StrategyCadence,
  StrategyRule,
} from '../data/types'
import type { BotRequestError, TestScanResult } from '../data/api'
import { RulesAccordion } from './RulesAccordion'
import {
  CADENCE_LABEL,
  cadenceHelp,
  channelHelper,
  matchCard,
  pl,
  runLine,
  scanSummaryLine,
} from './strategyUi'
import type { StrategyDraft } from './strategyDraft'

const RUN_HISTORY_MAX = 10

type ScanState =
  | { phase: 'idle' }
  | { phase: 'running' }
  | { phase: 'done'; result: TestScanResult }
  | { phase: 'empty' }
  | { phase: 'error'; error: BotRequestError | Error }

interface Props {
  draft: StrategyDraft
  dirty: boolean
  busy: boolean
  /** Full tracked universe (held ∪ watched) for scope/match counts. */
  trackedSymbols: string[]
  runs: InvestBotRun[]
  signals: InvestSignal[]
  snapshots: MarketSnapshot[]
  strategyNameById: Record<string, string>
  fireCount: (rule: StrategyRule) => number | null
  onChange: (next: StrategyDraft) => void
  onBack: () => void
  onSave: () => void
  onDiscard: () => void
  onDelete: () => void
  /** Runs the dry run — the caller resolves scope → symbols and calls the
      edge function; this component renders whatever comes back. */
  onTestScan: () => Promise<TestScanResult>
}

export function StrategyEditor({
  draft,
  dirty,
  busy,
  trackedSymbols,
  runs,
  signals,
  snapshots,
  strategyNameById,
  fireCount,
  onChange,
  onBack,
  onSave,
  onDiscard,
  onDelete,
  onTestScan,
}: Props) {
  const { x, lang } = useI18n()
  const [scan, setScan] = useState<ScanState>({ phase: 'idle' })
  const [deleteArmed, setDeleteArmed] = useState(false)

  const scopeIsAll = draft.scope.watchlist
  const symbolCount = scopeIsAll ? trackedSymbols.length : draft.scope.symbols.length
  const now = useMemo(() => new Date(), [])

  const freq = draft.id
    ? estimateFrequency(draft.rules.map((d) => d.rule), draft.id, runs, signals, now)
    : null
  const stale = staleScopeSymbols(
    scopeIsAll ? trackedSymbols : draft.scope.symbols,
    snapshots,
    now,
  )

  const recentRuns = useMemo(
    () =>
      runs
        .filter((r) => r.strategyId === null || r.strategyId === draft.id)
        .slice(0, RUN_HISTORY_MAX),
    [runs, draft.id],
  )

  const set = (patch: Partial<StrategyDraft>) => onChange({ ...draft, ...patch })

  const runTestScan = async () => {
    /* An empty scope can't produce anything — say so locally instead of
       firing a request that comes back "No symbols in scope". */
    if (symbolCount === 0) {
      setScan({ phase: 'empty' })
      return
    }
    setScan({ phase: 'running' })
    try {
      setScan({ phase: 'done', result: await onTestScan() })
    } catch (e) {
      setScan({ phase: 'error', error: e instanceof Error ? e : new Error(String(e)) })
    }
  }

  return (
    <div className="sb-editor">
      <button type="button" className="sb-backlink" onClick={onBack}>
        <ChevronLeft size={18} strokeWidth={2.4} aria-hidden="true" />
        {x(IM.invest_sb_back)}
      </button>

      <div className="sb-ed-head">
        <h1>{draft.name || x(IM.invest_sb_untitled)}</h1>
        <span className={`sb-pill ${draft.enabled ? 'sb-pill-enabled' : 'sb-pill-draft'}`}>
          {x(draft.enabled ? IM.invest_sb_pill_enabled : IM.invest_sb_pill_draft)}
        </span>
      </div>

      {!draft.enabled && <div className="sb-draft-banner">{x(IM.invest_sb_draft_banner)}</div>}

      <div className="sb-card sb-settings">
        <div className="sb-section-head sb-span" style={{ marginTop: 0 }}>
          <h2>{x(IM.invest_sb_settings_h)}</h2>
        </div>

        <div className="sb-field sb-span">
          <label className="sb-flabel" htmlFor="sb-ed-name">
            {x(IM.invest_sb_name)}
          </label>
          <input
            className="sb-input"
            id="sb-ed-name"
            value={draft.name}
            onChange={(e) => set({ name: e.target.value })}
          />
        </div>

        <div className="sb-field">
          <label className="sb-flabel" htmlFor="sb-ed-cadence">
            {x(IM.invest_sb_cadence)}
          </label>
          <select
            className="sb-input"
            id="sb-ed-cadence"
            value={draft.cadence}
            onChange={(e) => set({ cadence: e.target.value as StrategyCadence })}
          >
            {(Object.keys(CADENCE_LABEL) as StrategyCadence[]).map((c) => (
              <option key={c} value={c}>
                {x(CADENCE_LABEL[c])}
              </option>
            ))}
          </select>
          <p className="sb-helper">{cadenceHelp(lang, draft.cadence)}</p>
        </div>

        <div className="sb-field">
          <span className="sb-flabel" id="sb-ed-scope-l">
            {x(IM.invest_sb_scope)}
          </span>
          <div className="sb-seg" role="group" aria-labelledby="sb-ed-scope-l">
            <button
              type="button"
              aria-pressed={scopeIsAll}
              onClick={() => set({ scope: { ...draft.scope, watchlist: true } })}
            >
              {x(IM.invest_sb_scope_all)}
            </button>
            <button
              type="button"
              aria-pressed={!scopeIsAll}
              onClick={() => set({ scope: { ...draft.scope, watchlist: false } })}
            >
              {x(IM.invest_sb_scope_specific)}
            </button>
          </div>
          <div className="sb-manage-row">
            <Link to="/invest/portfolio" className="sb-linklike">
              {pl(lang, trackedSymbols.length, IM.invest_sb_tracked_one, IM.invest_sb_tracked_many)}
              {' · '}
              {x(IM.invest_sb_manage)}
            </Link>
          </div>
          {!scopeIsAll && (
            <div style={{ marginTop: 12 }}>
              <label className="sb-flabel" htmlFor="sb-ed-addsym" style={{ fontSize: 15 }}>
                {x(IM.invest_sb_add_symbol)}
              </label>
              <input
                className="sb-input"
                id="sb-ed-addsym"
                placeholder={x(IM.invest_sb_sym_placeholder)}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return
                  e.preventDefault()
                  const v = e.currentTarget.value.trim().toUpperCase()
                  if (!v) return
                  if (!draft.scope.symbols.includes(v)) {
                    set({ scope: { ...draft.scope, symbols: [...draft.scope.symbols, v] } })
                  }
                  e.currentTarget.value = ''
                }}
              />
              <div className="sb-chips">
                {draft.scope.symbols.map((sym) => (
                  <span className="sb-chip-sym" key={sym}>
                    {sym}
                    <button
                      type="button"
                      aria-label={`${x(IM.invest_sb_remove_sym)} ${sym}`}
                      onClick={() =>
                        set({
                          scope: {
                            ...draft.scope,
                            symbols: draft.scope.symbols.filter((s) => s !== sym),
                          },
                        })
                      }
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="sb-field">
          <span className="sb-flabel" id="sb-ed-chan-l">
            {x(IM.invest_sb_notify_via)}
          </span>
          <div className="sb-pills" role="group" aria-labelledby="sb-ed-chan-l">
            <button
              type="button"
              aria-pressed={draft.notify.inApp}
              onClick={() => set({ notify: { ...draft.notify, inApp: !draft.notify.inApp } })}
            >
              {x(IM.invest_sb_chan_inapp)}
            </button>
            <button
              type="button"
              aria-pressed={draft.notify.email}
              onClick={() => set({ notify: { ...draft.notify, email: !draft.notify.email } })}
            >
              {x(IM.invest_sb_chan_email)}
            </button>
          </div>
          <p className="sb-helper">{channelHelper(lang, draft.notify)}</p>
        </div>

        <div className="sb-field">
          <span className="sb-flabel" id="sb-ed-mm-l">
            {x(IM.invest_sb_multi_match)}
          </span>
          <div className="sb-seg" role="group" aria-labelledby="sb-ed-mm-l">
            <button
              type="button"
              aria-pressed={draft.multiMatch === 'summary'}
              onClick={() => set({ multiMatch: 'summary' })}
            >
              {x(IM.invest_sb_mm_summary)}
            </button>
            <button
              type="button"
              aria-pressed={draft.multiMatch === 'each'}
              onClick={() => set({ multiMatch: 'each' })}
            >
              {x(IM.invest_sb_mm_each)}
            </button>
          </div>
          <p className="sb-helper">
            {x(draft.multiMatch === 'summary' ? IM.invest_sb_mm_summary_help : IM.invest_sb_mm_each_help)}
          </p>
        </div>

        <div className="sb-field sb-span">
          <label className="sb-check-row">
            <input
              type="checkbox"
              checked={draft.enabled}
              onChange={(e) => set({ enabled: e.target.checked })}
            />
            <span>
              <span className="sb-t">{x(IM.invest_sb_pill_enabled)}</span>
              <br />
              <span className="sb-d">{x(IM.invest_sb_enabled_help)}</span>
            </span>
          </label>
        </div>

        <div className="sb-safety sb-span">
          <Lock size={18} strokeWidth={1.8} aria-hidden="true" />
          <span>{x(IM.invest_sb_safety)}</span>
        </div>

        <div className="sb-field sb-span" style={{ marginTop: 10 }}>
          <button
            type="button"
            className={`sb-btn sb-btn-danger sb-btn-block${deleteArmed ? ' sb-armed' : ''}`}
            onClick={() => {
              if (deleteArmed) {
                setDeleteArmed(false)
                onDelete()
              } else {
                setDeleteArmed(true)
              }
            }}
          >
            {x(deleteArmed ? IM.invest_sb_tap_confirm : IM.invest_sb_delete_strategy)}
          </button>
        </div>
      </div>

      <div className="sb-section-head">
        <div>
          <h2>{x(IM.invest_sb_rules_h)}</h2>
          <p className="sub" style={{ margin: 0 }}>
            {x(IM.invest_sb_rules_sub)}
          </p>
        </div>
      </div>
      <RulesAccordion
        drafts={draft.rules}
        onChange={(rules) => set({ rules })}
        idPrefix="ed"
        fireCount={fireCount}
      />

      <div className="sb-section-head">
        <h2>{x(IM.invest_sb_health_h)}</h2>
      </div>
      <div className="sb-card sb-health">
        {freq ? (
          <p className="sb-fire-stat">
            {fill(x(IM.invest_health_frequency), { count: freq.perWeek })}
          </p>
        ) : (
          <p className="sb-empty">{x(IM.invest_sb_no_firing)}</p>
        )}
        {stale.missing.length > 0 && (
          <p className="sb-empty">
            {fill(x(IM.invest_health_no_price), { symbols: stale.missing.join(', ') })}
          </p>
        )}
        {stale.stale.length > 0 && (
          <p className="sb-empty">
            {fill(x(IM.invest_health_stale_price), { symbols: stale.stale.join(', ') })}
          </p>
        )}
        <button
          type="button"
          className="sb-btn sb-btn-secondary"
          disabled={busy || scan.phase === 'running'}
          onClick={() => void runTestScan()}
        >
          <ScanSearch size={16} strokeWidth={2} aria-hidden="true" />
          {x(IM.invest_sb_test_scan)}
        </button>
        {scan.phase === 'running' && (
          <div className="sb-scan-progress">
            {fill(x(IM.invest_sb_scanning), { n: symbolCount })}
            <div className="sb-scan-bar">
              <i />
            </div>
          </div>
        )}
        {scan.phase === 'done' && (
          <div className="sb-scan-results">
            <h3>{x(IM.invest_sb_results_h)}</h3>
            <p className="sub small">{x(IM.invest_sb_results_sub)}</p>
            <p className="sub small">{scanSummaryLine(lang, scan.result)}</p>
            {scan.result.matches.length === 0 ? (
              <p className="sub">{x(IM.invest_sb_no_matches)}</p>
            ) : (
              scan.result.matches.map((m, i) => {
                const card = matchCard(lang, m, draft.rules[m.ruleIndex]?.rule)
                return (
                  <div className="sb-match" key={i}>
                    <div className="sb-sym">{card.symbol}</div>
                    <div className="sb-detail">{card.detail}</div>
                    <div className="sb-outcome">{card.outcome}</div>
                  </div>
                )
              })
            )}
            {scan.result.warnings.map((w, i) => (
              <p className="sub small" key={i}>
                {w}
              </p>
            ))}
          </div>
        )}
        {scan.phase === 'empty' && symbolCount === 0 && (
          <div className="sb-scan-results">
            <p className="sub">{x(IM.invest_sb_scan_empty)}</p>
          </div>
        )}
        {scan.phase === 'error' && (
          <div className="sb-scan-results">
            <div className="sb-scan-error">
              {fill(x(IM.invest_sb_scan_failed), {
                error: scan.error.message,
                id: (scan.error as BotRequestError).requestId ?? '—',
              })}
            </div>
          </div>
        )}
      </div>

      <div className="sb-section-head">
        <h2>{x(IM.invest_sb_runs_h)}</h2>
      </div>
      <div className="sb-runs">
        {recentRuns.length === 0 ? (
          <div className="sb-run">
            <div className="sb-txt">{x(IM.invest_sb_no_runs)}</div>
          </div>
        ) : (
          recentRuns.map((r) => (
            <div className="sb-run" key={r.id}>
              <div className="sb-txt">
                {runLine(lang, r, r.strategyId ? strategyNameById[r.strategyId] : undefined)}
                {r.proposalsCreated > 0 && (
                  <>
                    {' · '}
                    <Link to="/invest/orders" className="sb-linklike">
                      {x(IM.invest_run_view_orders)}
                    </Link>
                  </>
                )}
              </div>
              <span
                className={`sb-pill ${
                  r.status === 'ok'
                    ? 'sb-pill-ok'
                    : r.status === 'partial'
                      ? 'sb-pill-warn'
                      : 'sb-pill-fail'
                }`}
              >
                {x(
                  r.status === 'ok'
                    ? IM.invest_sb_run_ok
                    : r.status === 'partial'
                      ? IM.invest_sb_run_partial
                      : IM.invest_sb_run_failed,
                )}
              </span>
            </div>
          ))
        )}
      </div>
      <p className="sb-runs-foot">{x(IM.invest_sb_runs_foot)}</p>

      <div className="sb-savebar">
        <div className={`sb-col${dirty ? ' sb-is-dirty' : ''}`}>
          <div className="sb-dirty-ind">
            <span className="sb-dirty-dot" aria-hidden="true" />
            <span className="sb-dirty-txt">
              {x(dirty ? IM.invest_sb_unsaved : IM.invest_sb_no_changes)}
            </span>
          </div>
          <button
            type="button"
            className="sb-btn sb-btn-secondary"
            disabled={!dirty || busy}
            onClick={onDiscard}
          >
            {x(IM.invest_sb_discard)}
          </button>
          <button
            type="button"
            className="sb-btn sb-btn-primary"
            disabled={!dirty || busy}
            onClick={onSave}
          >
            {x(IM.invest_sb_save)}
          </button>
        </div>
      </div>
    </div>
  )
}
