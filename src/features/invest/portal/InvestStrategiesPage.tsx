/**
 * /invest/strategies — the rebuilt strategy builder. Three views inside
 * one route, matching the approved prototype:
 *
 *   list    — "Bot strategies" + Scan now / New strategy + strategy cards
 *   editor  — settings, rules accordion, health (real test scan), run
 *             history, sticky save/discard bar
 *   wizard  — Describe → Review rules → Schedule & notifications
 *
 * Everything is backed by the real API: saveStrategy/testScan/scanNow/
 * deleteStrategy; no fixtures, no simulated results.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Plus, ScanSearch } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { fill } from '@/lib/format'
import { investMessages as IM } from '@/i18n/messages/invest'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useInvestData } from '../data/InvestDataContext'
import { deleteStrategy, saveStrategy, scanNow, testScan } from '../data/api'
import type { InvestStrategy, StrategyRule } from '../data/types'
import { ruleFireCount } from '../data/strategyRules'
import { relTimeLabel } from './relTime'
import { StrategyEditor } from './StrategyEditor'
import { StrategyWizard } from './StrategyWizard'
import { useInvestHead } from './useInvestHead'
import { pl, scopeSymbols, strategyMeta, trackedUniverse } from './strategyUi'
import {
  cloneDraft,
  draftsEqual,
  toDraft,
  toWire,
} from './strategyDraft'
import type { StrategyDraft } from './strategyDraft'
import './strategies.css'

type View = { kind: 'list' } | { kind: 'editor' } | { kind: 'wizard' }

export function InvestStrategiesPage() {
  const { x, lang } = useI18n()
  const { state, refresh } = useInvestData()
  const { showToast } = useToasts()

  useInvestHead(IM.invest_seo_title_strategies, IM.invest_seo_desc_strategies)

  const [view, setView] = useState<View>({ kind: 'list' })
  const [draft, setDraft] = useState<StrategyDraft | null>(null)
  const [snapshot, setSnapshot] = useState<StrategyDraft | null>(null)
  const [busy, setBusy] = useState<'scan' | 'save' | 'delete' | 'create' | null>(null)

  const universe = useMemo(
    () => trackedUniverse(state.positions, state.watchlist),
    [state.positions, state.watchlist],
  )
  const dirty = draft !== null && snapshot !== null && !draftsEqual(draft, snapshot)

  /* The save bar is fixed — pad the page and lift the shared toast host
     out of its way while the editor is open (prototype: toasts stack
     above the bar). */
  useEffect(() => {
    const on = view.kind === 'editor'
    document.body.classList.toggle('sb-has-savebar', on)
    return () => document.body.classList.remove('sb-has-savebar')
  }, [view.kind])

  const openEditor = useCallback((s: InvestStrategy) => {
    const d = toDraft(s)
    setDraft(d)
    setSnapshot(cloneDraft(d))
    setView({ kind: 'editor' })
    window.scrollTo({ top: 0 })
  }, [])

  const openWizard = useCallback(() => {
    setView({ kind: 'wizard' })
    window.scrollTo({ top: 0 })
  }, [])

  const backToList = useCallback(
    (discardToast: boolean) => {
      if (discardToast && dirty) showToast(IM.invest_sb_unsaved_discarded)
      setDraft(null)
      setSnapshot(null)
      setView({ kind: 'list' })
      window.scrollTo({ top: 0 })
    },
    [dirty, showToast],
  )

  const runScan = useCallback(async () => {
    if (busy) return
    setBusy('scan')
    showToast(IM.invest_sb_scan_started)
    try {
      const res = await scanNow()
      await refresh()
      showToast({
        en: `${IM.invest_sb_scan_complete.en} — ${pl('en', res.signals, IM.invest_sb_new_signal_one, IM.invest_sb_new_signal_many)} · ${pl('en', res.proposals, IM.invest_sb_new_proposal_one, IM.invest_sb_new_proposal_many)}`,
        fr: `${IM.invest_sb_scan_complete.fr} — ${pl('fr', res.signals, IM.invest_sb_new_signal_one, IM.invest_sb_new_signal_many)} · ${pl('fr', res.proposals, IM.invest_sb_new_proposal_one, IM.invest_sb_new_proposal_many)}`,
      })
    } catch (e) {
      showToast(
        fill(x(IM.invest_sb_scan_failed), {
          error: e instanceof Error ? e.message : String(e),
          id: '—',
        }),
      )
    } finally {
      setBusy(null)
    }
  }, [busy, refresh, showToast, x])

  const saveDraft = useCallback(async () => {
    if (!draft || busy) return
    setBusy('save')
    try {
      const id = await saveStrategy(toWire(draft))
      const next = { ...draft, id: id ?? draft.id }
      setDraft(next)
      setSnapshot(cloneDraft(next))
      showToast(IM.invest_sb_saved)
      await refresh()
    } catch (e) {
      showToast(
        fill(x(IM.invest_sb_save_failed), {
          error: e instanceof Error ? e.message : String(e),
        }),
      )
    } finally {
      setBusy(null)
    }
  }, [draft, busy, refresh, showToast, x])

  const discardDraft = useCallback(() => {
    if (!snapshot) return
    setDraft(cloneDraft(snapshot))
    showToast(IM.invest_sb_discarded)
  }, [snapshot, showToast])

  const removeStrategy = useCallback(async () => {
    if (!draft?.id || busy) return
    setBusy('delete')
    try {
      await deleteStrategy(draft.id)
      await refresh()
      showToast(IM.invest_sb_deleted)
      setDraft(null)
      setSnapshot(null)
      setView({ kind: 'list' })
    } catch (e) {
      showToast(
        fill(x(IM.invest_sb_save_failed), {
          error: e instanceof Error ? e.message : String(e),
        }),
      )
    } finally {
      setBusy(null)
    }
  }, [draft, busy, refresh, showToast, x])

  /* Draft rules → dry run against the strategy's resolved scope. The edge
     function writes nothing; per-rule match detail comes back for the
     results cards. */
  const runDryScan = useCallback(() => {
    if (!draft) return Promise.reject(new Error('No draft'))
    const wire = toWire(draft)
    const symbols = scopeSymbols(wire.scope, universe)
    return testScan({ rules: wire.rules, symbols, multiMatch: wire.multiMatch })
  }, [draft, universe])

  const createFromWizard = useCallback(
    async (d: StrategyDraft) => {
      if (busy) return
      setBusy('create')
      try {
        const id = await saveStrategy(toWire(d))
        await refresh()
        showToast(IM.invest_sb_created)
        const next = { ...d, id: id ?? null }
        setDraft(next)
        setSnapshot(cloneDraft(next))
        setView({ kind: 'editor' })
        window.scrollTo({ top: 0 })
      } catch (e) {
        showToast(
          fill(x(IM.invest_sb_save_failed), {
            error: e instanceof Error ? e.message : String(e),
          }),
        )
      } finally {
        setBusy(null)
      }
    },
    [busy, refresh, showToast, x],
  )

  const fireCount = useCallback(
    (rule: StrategyRule) =>
      draft?.id
        ? ruleFireCount(rule, draft.id, state.runs, state.signals, new Date())
        : null,
    [draft?.id, state.runs, state.signals],
  )

  const strategyNameById = useMemo(
    () => Object.fromEntries(state.strategies.map((s) => [s.id, s.name])),
    [state.strategies],
  )

  return (
    <div className="sb sb-col">
      {view.kind === 'list' && (
        <div className="sb-list">
          <h1>{x(IM.invest_strategies_title)}</h1>
          <p className="sub">{x(IM.invest_sb_list_sub)}</p>
          <div className="sb-list-actions">
            <button
              type="button"
              className="sb-btn sb-btn-primary"
              disabled={busy === 'scan'}
              onClick={() => void runScan()}
            >
              {busy === 'scan' ? (
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              ) : (
                <ScanSearch size={16} strokeWidth={2} aria-hidden="true" />
              )}
              {x(IM.invest_scan_now)}
            </button>
            <button
              type="button"
              className="sb-btn sb-btn-secondary"
              onClick={openWizard}
            >
              <Plus size={16} strokeWidth={2.4} aria-hidden="true" />
              {x(IM.invest_add_strategy)}
            </button>
          </div>
          <p className="sb-caption">{x(IM.invest_sb_scan_caption)}</p>

          <div className="sb-strat-grid">
            {state.strategies.map((s) => {
              const last = state.runs.find(
                (r) => r.strategyId === s.id || r.strategyId === null,
              )
              return (
                <button
                  type="button"
                  key={s.id}
                  className="sb-strat-card"
                  onClick={() => openEditor(s)}
                >
                  <span className="sb-top">
                    <span className="sb-name">{s.name || x(IM.invest_sb_untitled)}</span>
                    <span
                      className={`sb-pill ${s.enabled ? 'sb-pill-enabled' : 'sb-pill-draft'}`}
                    >
                      {x(s.enabled ? IM.invest_sb_pill_enabled : IM.invest_sb_pill_draft)}
                    </span>
                  </span>
                  <span className="sb-meta" style={{ display: 'block' }}>
                    {strategyMeta(lang, s, universe.length)}
                  </span>
                  {last && (
                    <span className="sb-meta" style={{ display: 'block' }}>
                      {fill(x(IM.invest_sb_last_run), {
                        time: formatRel(last.ranAt, x),
                      })}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          {state.strategies.length === 0 && (
            <p className="sb-caption">{x(IM.invest_sb_empty_hint)}</p>
          )}
        </div>
      )}

      {view.kind === 'editor' && draft && (
        <StrategyEditor
          draft={draft}
          dirty={dirty}
          busy={busy !== null}
          trackedSymbols={universe}
          runs={state.runs}
          signals={state.signals}
          snapshots={state.snapshots}
          strategyNameById={strategyNameById}
          fireCount={fireCount}
          onChange={setDraft}
          onBack={() => backToList(true)}
          onSave={() => void saveDraft()}
          onDiscard={discardDraft}
          onDelete={() => void removeStrategy()}
          onTestScan={runDryScan}
        />
      )}

      {view.kind === 'wizard' && (
        <StrategyWizard
          trackedSymbols={universe}
          busy={busy === 'create'}
          onCancel={() => backToList(false)}
          onCreate={(d) => void createFromWizard(d)}
        />
      )}
    </div>
  )
}

type X = (m: { en: string; fr: string }) => string
function formatRel(iso: string, x: X): string {
  return relTimeLabel(iso, x) ?? iso
}
