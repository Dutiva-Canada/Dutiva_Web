/**
 * /invest/strategies — the rebuilt strategy builder. Three views inside
 * one route, matching the approved prototype:
 *
 *   list    — "Agent strategies" + Scan now / New strategy + strategy cards
 *   editor  — settings, rules accordion, health (real test scan), run
 *             history, sticky save/discard bar
 *   wizard  — Describe → Review rules → Schedule & notifications
 *
 * Everything is backed by the real API: saveStrategy/testScan/scanNow/
 * deleteStrategy; no fixtures, no simulated results.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Loader2, Plus, ScanSearch } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { fill } from '@/lib/format'
import { investMessages as IM } from '@/i18n/messages/invest'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useInvestData } from '../data/InvestDataContext'
import { deleteStrategy, normalizeAiStrategyDraft, saveStrategy, scanNow, testScan } from '../data/api'
import { loadPendingSuggestions, resolveSuggestion, type AgentSuggestion } from '@/lib/agentQueue'
import type { InvestStrategy, StrategyCadence, StrategyRule } from '../data/types'
import { normalizeRules, ruleFireCount, validateRules } from '../data/strategyRules'
import { newRulePersistId, toDrafts } from './ruleDrafts'
import { relTimeLabel } from './relTime'
import { StrategyEditor } from './StrategyEditor'
import { StrategyWizard } from './StrategyWizard'
import { useInvestHead } from './useInvestHead'
import {
  formatRunWhen,
  pl,
  ruleProblemText,
  ruleTitle,
  scopeSymbols,
  strategyMeta,
  trackedUniverse,
} from './strategyUi'
import { suggestionIcon } from './suggestionIcons'
import type { Lang } from '@/i18n/core'
import {
  cloneDraft,
  draftsEqual,
  toDraft,
  toWire,
} from './strategyDraft'
import type { StrategyDraft } from './strategyDraft'
import { STRATEGY_TEMPLATES, type StrategyTemplate } from '../data/strategyTemplates'
import './strategies.css'

type View = { kind: 'list' } | { kind: 'editor' } | { kind: 'wizard' }

/* Suggestion kinds filed for surfaces other than this page — a thesis or
   goal row has no strategy_id, so the strategy-targeted path would read
   every one of them as stale. They get a "review on …" CTA that routes to
   their own page — resolving 'opened' here would evict the row before
   that page's strip can serve it, so navigation leaves it pending. */
const FOREIGN_SUGGESTION_PAGE: Record<string, { to: string; page: (typeof IM)[keyof typeof IM] }> = {
  thesis: { to: '/invest/theses', page: IM.invest_tab_theses },
  exit_proposal: { to: '/invest/theses', page: IM.invest_tab_theses },
  order_cross: { to: '/invest/orders', page: IM.invest_tab_orders },
  goal: { to: '/invest/analysis', page: IM.invest_tab_analysis },
  scan: { to: '/invest/analysis', page: IM.invest_tab_analysis },
  swot: { to: '/invest/analysis', page: IM.invest_tab_analysis },
  memory: { to: '/invest/profile', page: IM.invest_tab_profile },
  profile: { to: '/invest/profile', page: IM.invest_tab_profile },
}

/* Cadence is "at most" — the strategy's run window reopens at last +
   cadence (daily = next sweep, weekly = 7d, monthly = 30d), matching
   strategyDue in the bot. */
const CADENCE_MS: Record<StrategyCadence, number> = {
  daily: 86_400_000,
  weekly: 7 * 86_400_000,
  monthly: 30 * 86_400_000,
}

/* Suggestion kinds this page can act on itself — everything else is a
   foreign row that routes to its home page. */
const NATIVE_KINDS = new Set(['strategy', 'rule_add', 'rule_tune', 'scope_add'])

export function InvestStrategiesPage() {
  const { x, lang } = useI18n()
  const { state, loading, refresh } = useInvestData()
  const { showToast } = useToasts()
  const navigate = useNavigate()

  useInvestHead(IM.invest_seo_title_strategies, IM.invest_seo_desc_strategies)

  const [view, setView] = useState<View>({ kind: 'list' })
  const [draft, setDraft] = useState<StrategyDraft | null>(null)
  const [snapshot, setSnapshot] = useState<StrategyDraft | null>(null)
  const [busy, setBusy] = useState<'scan' | 'save' | 'delete' | 'create' | null>(null)
  /* Pending 'strategy' rows the AI drafted — a wizard abandoned mid-edit
     leaves the draft waiting here instead of vanishing. */
  const [pending, setPending] = useState<AgentSuggestion[]>([])
  /* Long strips bury the strategies they're advising on — cap the visible
     rows and let the user expand. */
  const [showAllPending, setShowAllPending] = useState(false)
  /* Rows that act here outrank rows that only route elsewhere — a foreign
     nav link shouldn't push an actionable rule below the fold. */
  const orderedPending = useMemo(
    () =>
      [...pending].sort(
        (a, b) => Number(!NATIVE_KINDS.has(a.kind)) - Number(!NATIVE_KINDS.has(b.kind)),
      ),
    [pending],
  )
  const [pendingBusy, setPendingBusy] = useState<string | null>(null)
  /* Suggestions applied into the open draft — staged, not resolved: the
     row resolves when the draft saves and re-shows if it discards, so a
     suggestion can't be consumed by an edit that never lands. */
  const [appliedSuggest, setAppliedSuggest] = useState<Set<string>>(new Set())

  const universe = useMemo(
    () => trackedUniverse(state.positions, state.watchlist),
    [state.positions, state.watchlist],
  )
  /* Book currency mirrors the engine's rule — first active account's
     base. Money thresholds and currency-unit quantities label in it. */
  const bookCurrency = useMemo(
    () =>
      (state.accounts.find((a) => a.status === 'active')?.baseCurrency ?? 'CAD').toUpperCase(),
    [state.accounts],
  )
  const fmtNext = useMemo(
    () =>
      new Intl.DateTimeFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', {
        month: 'short',
        day: 'numeric',
      }),
    [lang],
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

  useEffect(() => {
    loadPendingSuggestions('invest')
      .then((rows) => setPending(rows))
      .catch(() => {})
  }, [])

  /* "Add it" on a filed draft creates the strategy through the same
     saveStrategy path the wizard ends on — disabled, in-app notify. */
  const acceptPending = useCallback(
    async (s: AgentSuggestion) => {
      if (pendingBusy) return
      const raw = (s.payload as { draft?: Record<string, unknown> } | null)?.draft
      if (!raw) return
      setPendingBusy(s.id)
      try {
        const normalized = normalizeAiStrategyDraft(raw)
        /* Rules the model emitted but the normalizer couldn't read are
           named, not silently dropped — the saved strategy keeps the
           valid ones and the toast says what was lost. */
        const dropped =
          (Array.isArray(raw.rules) ? raw.rules.length : 0) - normalized.rules.length
        await saveStrategy(normalized)
        await resolveSuggestion(s.id, 'accepted', 'added')
        setPending((cur) => cur.filter((r) => r.id !== s.id))
        await refresh()
        showToast(IM.invest_sb_created)
        if (dropped > 0) {
          showToast(
            fill(x(IM.invest_sb_rules_dropped), { n: String(dropped) }),
          )
        }
      } catch (e) {
        showToast(
          fill(x(IM.invest_sb_save_failed), {
            error: e instanceof Error ? e.message : String(e),
          }),
        )
      } finally {
        setPendingBusy(null)
      }
    },
    [pendingBusy, refresh, showToast, x],
  )

  const dismissPending = useCallback(async (s: AgentSuggestion) => {
    setPending((cur) => cur.filter((r) => r.id !== s.id))
    await resolveSuggestion(s.id, 'dismissed', 'dismissed').catch(() => {})
  }, [])

  /* rule_add / rule_tune / scope_add — the suggestion carries the strategy
     row it targets; applying mutates that strategy through saveStrategy,
     so the edit lands live (rules validate inside saveStrategy anyway).
     A suggestion whose strategy vanished is stale — dismiss-only. */
  const acceptSuggestion = useCallback(
    async (s: AgentSuggestion) => {
      if (pendingBusy) return
      const p = (s.payload ?? {}) as Record<string, unknown>
      const strategyId = typeof p.strategy_id === 'string' ? p.strategy_id : null
      const strategy = strategyId
        ? state.strategies.find((t) => t.id === strategyId)
        : null
      if (!strategy) return
      setPendingBusy(s.id)
      try {
        const strategyName = strategy.name || x(IM.invest_sb_untitled)
        if (s.kind === 'rule_add' || s.kind === 'rule_tune') {
          const [rule] = normalizeRules([p.rule])
          if (!rule) throw new Error('Suggestion payload unreadable')
          if (s.kind === 'rule_add') {
            /* A suggestion may carry a cadence upgrade its rule needs
               (day-move rules can't fire on a monthly run) — the detail
               copy already disclosed it, apply it with the rule. */
            const nextCadence =
              p.cadence === 'daily' || p.cadence === 'weekly' || p.cadence === 'monthly'
                ? p.cadence
                : null
            await saveStrategy({
              ...strategy,
              ...(nextCadence && nextCadence !== strategy.cadence
                ? { cadence: nextCadence }
                : {}),
              rules: [...strategy.rules, { ...rule, id: newRulePersistId() }],
            })
            await resolveSuggestion(s.id, 'accepted', 'rule_added')
            showToast(fill(x(IM.invest_suggest_added_rule), { name: strategyName }))
          } else {
            const ident =
              typeof p.rule_ident === 'string'
                ? p.rule_ident
                : typeof p.rule_id === 'string'
                  ? p.rule_id
                  : null
            const idx = strategy.rules.findIndex((r) => (r.id ?? r.title) === ident)
            if (idx < 0) throw new Error('The rule this tunes no longer exists')
            /* The tuned rule keeps its identity — dedupe slots and firing
               history follow it through the change. */
            const rules = strategy.rules.map((r, i) =>
              i === idx ? { ...rule, ...(r.id ? { id: r.id } : {}) } : r,
            )
            await saveStrategy({ ...strategy, rules })
            await resolveSuggestion(s.id, 'accepted', 'tuned')
            showToast(fill(x(IM.invest_suggest_tuned), { name: strategyName }))
          }
        } else if (s.kind === 'scope_add') {
          const syms = Array.isArray(p.symbols)
            ? (p.symbols as string[]).map((v) => String(v).toUpperCase())
            : []
          await saveStrategy({
            ...strategy,
            scope: {
              ...strategy.scope,
              symbols: [...new Set([...strategy.scope.symbols, ...syms])],
            },
          })
          await resolveSuggestion(s.id, 'accepted', 'scope_added')
          showToast(fill(x(IM.invest_suggest_scope_added), { name: strategyName }))
        } else {
          return
        }
        setPending((cur) => cur.filter((r) => r.id !== s.id))
        await refresh()
      } catch (e) {
        showToast(
          fill(x(IM.invest_sb_save_failed), {
            error: e instanceof Error ? e.message : String(e),
          }),
        )
      } finally {
        setPendingBusy(null)
      }
    },
    [pendingBusy, refresh, showToast, state.strategies, x],
  )

  /* Apply a suggestion INTO the open draft — staged, resolved on Save.
     Dismiss resolves immediately (it's final either way). */
  const applyToDraft = useCallback((s: AgentSuggestion) => {
    const p = (s.payload ?? {}) as Record<string, unknown>
    const [rule] = normalizeRules([p.rule])
    if (s.kind === 'rule_add' && rule) {
      setDraft((d) => d && { ...d, rules: [...d.rules, ...toDrafts([rule])] })
    } else if (s.kind === 'rule_tune' && rule) {
      const ident =
        typeof p.rule_ident === 'string'
          ? p.rule_ident
          : typeof p.rule_id === 'string'
            ? p.rule_id
            : null
      if (!ident) return
      setDraft(
        (d) =>
          d && {
            ...d,
            rules: d.rules.map((rd) =>
              (rd.rule.id ?? rd.rule.title) === ident
                ? toDrafts([{ ...rule, ...(rd.rule.id ? { id: rd.rule.id } : {}) }])[0]!
                : rd,
            ),
          },
      )
    } else if (s.kind === 'scope_add') {
      const syms = Array.isArray(p.symbols)
        ? (p.symbols as string[]).map((v) => String(v).toUpperCase())
        : []
      setDraft(
        (d) =>
          d && {
            ...d,
            scope: {
              ...d.scope,
              symbols: [...new Set([...d.scope.symbols, ...syms])],
            },
          },
      )
    } else {
      return
    }
    setAppliedSuggest((cur) => new Set(cur).add(s.id))
    showToast(IM.invest_suggest_applied)
  }, [showToast])

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

  /* Gallery seed — blank titles so the accordion renders the generated
     localized label, empty scope so the user picks what it scans (the
     template file's own contract), tpl:<slug> provenance for the row. */
  const openTemplate = useCallback((t: StrategyTemplate) => {
    const d: StrategyDraft = {
      id: null,
      name: t.name[lang],
      enabled: true,
      cadence: t.cadence,
      scope: { watchlist: false, symbols: [] },
      notify: { inApp: true, email: false },
      multiMatch: 'each',
      template: `tpl:${t.slug}`,
      rules: toDrafts(t.rules.map((r) => ({ ...r, title: '' }))),
    }
    setDraft(d)
    setSnapshot(cloneDraft(d))
    setView({ kind: 'editor' })
    window.scrollTo({ top: 0 })
  }, [lang])

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
      const counts = (l: Lang) => ({
        signals: pl(l, res.signals, IM.invest_sb_new_signal_one, IM.invest_sb_new_signal_many),
        proposals: pl(
          l,
          res.proposals,
          IM.invest_sb_new_proposal_one,
          IM.invest_sb_new_proposal_many,
        ),
      })
      showToast({
        en: fill(IM.invest_sb_scan_result.en, counts('en')),
        fr: fill(IM.invest_sb_scan_result.fr, counts('fr')),
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

  /* The first invalid rule names itself in the toast — a NaN threshold or
     empty quantity would silently drop the rule at save time otherwise. */
  const ruleProblem = useCallback(
    (d: StrategyDraft): string | null => {
      const first = validateRules(d.rules.map((r) => r.rule))[0]
      return first ? ruleProblemText(lang, first) : null
    },
    [lang],
  )

  const saveDraft = useCallback(async () => {
    if (!draft || busy) return
    const problem = ruleProblem(draft)
    if (problem) {
      showToast(fill(x(IM.invest_sb_save_failed), { error: problem }))
      return
    }
    setBusy('save')
    try {
      const id = await saveStrategy(toWire(draft))
      /* Staged suggestions become real with the draft — resolve them and
         drop them from the review list in the same beat. */
      const applied = [...appliedSuggest]
      for (const sid of applied) {
        void resolveSuggestion(sid, 'accepted', 'applied').catch(() => {})
      }
      if (applied.length > 0) {
        setPending((cur) => cur.filter((r) => !appliedSuggest.has(r.id)))
        setAppliedSuggest(new Set())
      }
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
  }, [draft, busy, refresh, showToast, x, ruleProblem, appliedSuggest])

  const discardDraft = useCallback(() => {
    if (!snapshot) return
    setDraft(cloneDraft(snapshot))
    /* Staged suggestions go back to the queue — nothing was committed. */
    setAppliedSuggest(new Set())
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
    /* An invalid rule would silently drop out of the dry run too — the
       scan reports what the editor can fix, not a partial truth. */
    const problem = ruleProblem(draft)
    if (problem) return Promise.reject(new Error(problem))
    const wire = toWire(draft)
    const symbols = scopeSymbols(wire.scope, universe)
    /* draft.id carries the saved row's id — a test scan dedupes against
       that strategy's own open signals/drafts, not a throwaway key. */
    return testScan({
      rules: wire.rules,
      symbols,
      multiMatch: wire.multiMatch,
      strategyId: wire.id,
    })
  }, [draft, universe, ruleProblem])

  const createFromWizard = useCallback(
    async (d: StrategyDraft, suggestionId?: string | null) => {
      if (busy) return
      const problem = ruleProblem(d)
      if (problem) {
        showToast(fill(x(IM.invest_sb_save_failed), { error: problem }))
        return
      }
      setBusy('create')
      try {
        const id = await saveStrategy(toWire(d))
        /* The strategy reached the book — resolve the queue row the
           draft-strategy call filed, so no orphan card asks to add it
           again. Best-effort: a resolve failure leaves the row pending. */
        if (suggestionId) {
          void resolveSuggestion(suggestionId, 'accepted', 'added').catch(() => {})
        }
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
    [busy, refresh, showToast, x, ruleProblem],
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

  /* Same gate as every sibling tab — the provider mounts children on
     EMPTY_INVEST_STATE, so without it the page flashes the empty-board
     hint during the first load. */
  if (loading) {
    return (
      <div className="sb sb-page flex items-center justify-center py-[80px]">
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--sb-muted)' }} aria-hidden="true" />
      </div>
    )
  }

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

          {pending.length > 0 && (
            <div className="sb-mini-list" style={{ marginBottom: 16 }}>
              <p className="sb-caption" style={{ marginTop: 0 }}>
                {x(IM.invest_suggest_hint)}
              </p>
              {(showAllPending ? orderedPending : orderedPending.slice(0, 4)).map((s) => {
                const p = (s.payload ?? {}) as Record<string, unknown>
                const KindIcon = suggestionIcon(s.kind)
                const title =
                  lang === 'fr' && typeof p.title_fr === 'string' ? p.title_fr : s.title
                const detail =
                  (lang === 'fr' && typeof p.detail_fr === 'string'
                    ? p.detail_fr
                    : typeof p.detail_en === 'string'
                      ? p.detail_en
                      : null) ?? null
                /* What the row does and what its accept button says — per
                   kind. 'strategy' keeps the original rules+cadence meta. */
                let meta = ''
                let actionLabel = ''
                let act: (() => void) | null = null
                let stale = false
                if (s.kind === 'strategy') {
                  const d = (p.draft ?? {}) as { cadence?: string; rules?: unknown[] }
                  const ruleCount = Array.isArray(d.rules) ? d.rules.length : 0
                  const cadence =
                    d.cadence === 'weekly' || d.cadence === 'monthly' ? d.cadence : 'daily'
                  const cadenceLabel = x(
                    cadence === 'weekly'
                      ? IM.invest_cadence_weekly
                      : cadence === 'monthly'
                        ? IM.invest_cadence_monthly
                        : IM.invest_cadence_daily,
                  )
                  meta = fill(x(IM.invest_review_meta), {
                    rules: pl(lang, ruleCount, IM.invest_sb_rule_one, IM.invest_sb_rule_many),
                    cadence: cadenceLabel,
                  })
                  actionLabel = x(IM.invest_review_add)
                  act = () => void acceptPending(s)
                } else if (FOREIGN_SUGGESTION_PAGE[s.kind]) {
                  const dest = FOREIGN_SUGGESTION_PAGE[s.kind]
                  if (dest) {
                    /* The button names the destination as an action —
                       a separate 'On Theses' hint line adds nothing. */
                    actionLabel = fill(x(IM.invest_suggest_open), { page: x(dest.page) })
                    act = () => navigate(dest.to)
                  }
                } else {
                  const targetId = typeof p.strategy_id === 'string' ? p.strategy_id : ''
                  const target = state.strategies.find((t) => t.id === targetId)
                  stale = !target
                  const targetName = stale
                    ? ''
                    : target!.name || x(IM.invest_sb_untitled)
                  if (s.kind === 'rule_add' || s.kind === 'rule_tune') {
                    const [rule] = normalizeRules([p.rule])
                    meta = rule
                      ? fill(x(IM.invest_suggest_rule_meta), {
                          name: targetName,
                          rule: ruleTitle(lang, rule, bookCurrency),
                        })
                      : ''
                    actionLabel = x(
                      s.kind === 'rule_add' ? IM.invest_suggest_apply_rule : IM.invest_suggest_apply,
                    )
                  } else if (s.kind === 'scope_add') {
                    const syms = Array.isArray(p.symbols)
                      ? (p.symbols as string[]).join(', ')
                      : ''
                    meta = fill(x(IM.invest_suggest_rule_meta), {
                      name: targetName,
                      rule: syms,
                    })
                    actionLabel = x(IM.invest_suggest_apply_scope)
                  }
                  act = stale ? null : () => void acceptSuggestion(s)
                }
                return (
                  <div
                    key={s.id}
                    className="sb-notify-row"
                    style={{ alignItems: 'flex-start', marginBottom: 10, cursor: 'default' }}
                  >
                    <KindIcon size={15} className="sb-notify-ico" aria-hidden="true" />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <strong>{title}</strong>
                      {meta && <span className="sb-notify-hint">{meta}</span>}
                      {detail && <span className="sb-notify-hint">{detail}</span>}
                      {stale && (
                        <span className="sb-notify-hint">{x(IM.invest_suggest_stale)}</span>
                      )}
                    </span>
                    <span className="sb-row-actions" style={{ flexShrink: 0 }}>
                      {act && (
                        <button
                          type="button"
                          className="sb-btn sb-btn-secondary sb-btn-sm"
                          disabled={pendingBusy !== null}
                          onClick={act}
                        >
                          {pendingBusy === s.id && (
                            <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                          )}
                          {actionLabel}
                        </button>
                      )}
                      <button
                        type="button"
                        className="sb-btn sb-btn-secondary sb-btn-sm"
                        disabled={pendingBusy !== null}
                        onClick={() => void dismissPending(s)}
                      >
                        {x(IM.invest_dismiss)}
                      </button>
                    </span>
                  </div>
                )
              })}
              {pending.length > 4 && (
                <button
                  type="button"
                  className="sb-btn sb-btn-secondary sb-btn-sm"
                  onClick={() => setShowAllPending((v) => !v)}
                >
                  {showAllPending
                    ? x(IM.invest_suggest_collapse)
                    : fill(x(IM.invest_suggest_show_all), { n: pending.length })}
                </button>
              )}
            </div>
          )}

          <div className="sb-strat-grid">
            {state.strategies.map((s) => {
              /* A sweep writes one run row per strategy evaluated — exact
                 id match is the only honest attribution; the unscoped
                 'null' insight row belongs to no card. */
              const last = state.runs.find((r) => r.strategyId === s.id)
              const outcome = last
                ? [
                    last.signalsEmitted > 0 &&
                      pl(lang, last.signalsEmitted, IM.invest_sb_signal_one, IM.invest_sb_signal_many),
                    last.proposalsCreated > 0 &&
                      pl(
                        lang,
                        last.proposalsCreated,
                        IM.invest_sb_proposal_one,
                        IM.invest_sb_proposal_many,
                      ),
                    last.status !== 'ok' &&
                      x(last.status === 'failed' ? IM.invest_sb_run_failed : IM.invest_sb_run_partial),
                    /* A clean run that found nothing still gets a verdict —
                       "Last run 4d ago" alone reads as missing data. */
                    last.status === 'ok' &&
                      last.signalsEmitted === 0 &&
                      last.proposalsCreated === 0 &&
                      x(IM.invest_sb_run_quiet),
                  ]
                    .filter(Boolean)
                    .join(' · ')
                : ''
              /* 'next' projects from last_evaluated_at — the bot's actual
                 cadence gate. The run row lies here: a partial/failed run
                 doesn't stamp the gate, so projecting off ran_at promises
                 a wait the engine doesn't honor. Never-run and window-passed
                 enabled strategies are due on the next sweep — say so rather
                 than dropping the line. */
              const evalMs = s.lastEvaluatedAt ? Date.parse(s.lastEvaluatedAt) : Number.NaN
              const nextMs =
                s.enabled && Number.isFinite(evalMs) ? evalMs + CADENCE_MS[s.cadence] : null
              const due = s.enabled && (nextMs === null || nextMs <= Date.now())
              const next = nextMs !== null && nextMs > Date.now() ? nextMs : null
              return (
                <button
                  type="button"
                  key={s.id}
                  className="sb-strat-card"
                  onClick={() => openEditor(s)}
                  aria-label={`${s.name || x(IM.invest_sb_untitled)} — ${x(
                    s.enabled ? IM.invest_sb_pill_enabled : IM.invest_sb_pill_paused,
                  )}`}
                >
                  <span className="sb-top">
                    <span className="sb-name">{s.name || x(IM.invest_sb_untitled)}</span>
                    <span
                      className={`sb-pill ${s.enabled ? 'sb-pill-enabled' : 'sb-pill-paused'}`}
                    >
                      {x(s.enabled ? IM.invest_sb_pill_enabled : IM.invest_sb_pill_paused)}
                    </span>
                    <ChevronRight size={16} className="sb-strat-chevron" aria-hidden="true" />
                  </span>
                  <span className="sb-meta" style={{ display: 'block' }}>
                    {strategyMeta(lang, s, scopeSymbols(s.scope, universe).length)}
                  </span>
                  {(last || next !== null || due) && (
                    <span className="sb-meta" style={{ display: 'block' }}>
                      {last &&
                        fill(x(IM.invest_sb_last_run), {
                          time: formatRel(last.ranAt, x, lang),
                        })}
                      {outcome && ` · ${outcome}`}
                      {next !== null
                        ? `${last ? ' · ' : ''}${fill(x(IM.invest_sb_next_run), { time: fmtNext.format(next) })}`
                        : due
                          ? `${last ? ' · ' : ''}${x(IM.invest_sb_next_overdue)}`
                          : ''}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          {state.strategies.length === 0 && (
            <p className="sb-caption">{x(IM.invest_sb_empty_hint)}</p>
          )}

          <section className="sb-tpl">
            <h2 className="sb-flabel">{x(IM.invest_tpl_gallery_title)}</h2>
            <p className="sb-caption" style={{ marginTop: 0 }}>
              {x(IM.invest_tpl_gallery_sub)}
            </p>
            <div className="sb-tpl-grid">
              {STRATEGY_TEMPLATES.map((t) => (
                <div key={t.slug} className="sb-tpl-card">
                  <strong>{t.name[lang]}</strong>
                  <p>{t.blurb[lang]}</p>
                  <span className="sb-meta">
                    {x(
                      t.cadence === 'weekly'
                        ? IM.invest_cadence_weekly
                        : t.cadence === 'monthly'
                          ? IM.invest_cadence_monthly
                          : IM.invest_cadence_daily,
                    )}
                    {' · '}
                    {pl(lang, t.rules.length, IM.invest_sb_rule_one, IM.invest_sb_rule_many)}
                  </span>
                  <button
                    type="button"
                    className="sb-btn sb-btn-secondary sb-btn-sm"
                    onClick={() => openTemplate(t)}
                  >
                    {x(IM.invest_tpl_use)}
                  </button>
                </div>
              ))}
            </div>
          </section>
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
          bookCurrency={bookCurrency}
          strategyNameById={strategyNameById}
          fireCount={fireCount}
          suggestions={pending.filter(
            (s) =>
              !appliedSuggest.has(s.id) &&
              draft.id !== null &&
              (s.payload as { strategy_id?: string } | null)?.strategy_id === draft.id,
          )}
          onApplySuggestion={applyToDraft}
          onDismissSuggestion={(s) => void dismissPending(s)}
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
          bookCurrency={bookCurrency}
          suggestions={pending.filter((s) => s.kind === 'strategy')}
          onCancel={() => backToList(false)}
          onCreate={(d, sid) => void createFromWizard(d, sid)}
        />
      )}
    </div>
  )
}

type X = (m: { en: string; fr: string }) => string
function formatRel(iso: string, x: X, lang: Lang): string {
  /* A future or unparseable stamp can't be 'N hours ago' — fall back to
     the absolute date rather than leak the raw ISO string. */
  return relTimeLabel(iso, x) ?? (formatRunWhen(lang, iso) || '—')
}
