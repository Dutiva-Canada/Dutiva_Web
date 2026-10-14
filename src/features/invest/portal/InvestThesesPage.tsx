/**
 * /invest/theses — standing claims per holding. Each card is one company's
 * story plus the conditions that would fray it (drift) or end it (break);
 * the sweep writes the verdict onto the row (status + per-rule reads +
 * posture line) and this page renders it — no client-side engine twin.
 *
 * The composer writes the claim and its conditions; Tally can draft both
 * from a plain-language story (draft-thesis, filed to the review queue
 * like every agent artifact), and the deterministic suggestion pass files
 * 'thesis' rows for holdings nobody has claimed yet.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Check,
  CircleAlert,
  Loader2,
  Plus,
  Sparkles,
  X,
} from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { fill } from '@/lib/format'
import { investMessages as IM } from '@/i18n/messages/invest'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useInvestData } from '../data/InvestDataContext'
import { createOrder, deleteThesis, draftThesis, saveThesis } from '../data/api'
import { readOrderMode } from './investPrefs'
import { loadPendingSuggestions, resolveSuggestion, type AgentSuggestion } from '@/lib/agentQueue'
import type {
  AssetClass,
  InvestThesis,
  RuleMetric,
  SignalRule,
  ThesisIntent,
} from '../data/types'
import { THESIS_INTENTS } from '../data/types'
import { newRuleDraft, newRulePersistId, toDrafts } from './ruleDrafts'
import type { RuleDraft } from './ruleDrafts'
import { RulesAccordion } from './RulesAccordion'
import { validateRules } from '../data/strategyRules'
import { ruleProblemText } from './strategyUi'
import { relTimeLabel } from './relTime'
import { useInvestHead } from './useInvestHead'
import './strategies.css'

type View = { kind: 'list' } | { kind: 'composer' }

interface ThesisDraftState {
  /** Present when editing — symbol/assetClass freeze (the identity). */
  id: string | null
  assetClass: AssetClass
  symbol: string
  name: string
  thesis: string
  intent: ThesisIntent
  breakDrafts: RuleDraft[]
  driftDrafts: RuleDraft[]
  /** The queue row that seeded this composer — resolves when it saves. */
  suggestionId: string | null
  /** Tally's draft-in-progress state. */
  tallyDescription: string
  tallyBusy: boolean
  tallyNote: boolean
  /** What a landed draft overwrote — the note offers a one-shot restore. */
  prevDraft: {
    thesis: string
    intent: ThesisIntent
    breakDrafts: RuleDraft[]
    driftDrafts: RuleDraft[]
    suggestionId: string | null
  } | null
}

const emptyComposer = (): ThesisDraftState => ({
  id: null,
  assetClass: 'equity',
  symbol: '',
  name: '',
  thesis: '',
  intent: 'core',
  breakDrafts: [],
  driftDrafts: [],
  suggestionId: null,
  tallyDescription: '',
  tallyBusy: false,
  tallyNote: false,
  prevDraft: null,
})

const STATUS_PILL: Record<InvestThesis['status'], string> = {
  healthy: 'sb-pill-ok',
  drifting: 'sb-pill-warn',
  broken: 'sb-pill-fail',
}
const STATUS_LABEL: Record<InvestThesis['status'], keyof typeof IM> = {
  healthy: 'invest_thesis_status_healthy',
  drifting: 'invest_thesis_status_drifting',
  broken: 'invest_thesis_status_broken',
}
const INTENT_LABEL: Record<ThesisIntent, keyof typeof IM> = {
  core: 'invest_thesis_intent_core',
  growth: 'invest_thesis_intent_growth',
  income: 'invest_thesis_intent_income',
  speculative: 'invest_thesis_intent_speculative',
}

/** Observed-metric readout for a condition row — % metrics render as a
    percent, value metrics as book currency, null means "no reading". */
function evalValueLabel(
  metric: RuleMetric,
  value: number | null,
  ccy: string,
  lang: string,
): string | null {
  if (value === null || !Number.isFinite(value)) return null
  if (metric === 'value_floor' || metric === 'cash_above') {
    return `${Math.round(value).toLocaleString(lang === 'fr' ? 'fr-CA' : 'en-CA')} ${ccy}`
  }
  return `${value > 0 ? '+' : ''}${Math.round(value * 10) / 10}%`
}

function seedToDrafts(rules: unknown): RuleDraft[] {
  const list = Array.isArray(rules) ? rules : []
  const drafts: RuleDraft[] = []
  for (const raw of list) {
    const r = raw as Record<string, unknown>
    if (r?.type !== 'signal') continue
    const d = newRuleDraft()
    /* 'between' is meaningless without its second bound — a draft that
       dropped value2 becomes a dead rule, so fall back to 'lt'. */
    const op: SignalRule['op'] =
      r.op === 'gt' ? 'gt' : r.op === 'between' && typeof r.value2 === 'number' ? 'between' : 'lt'
    drafts.push({
      id: d.id,
      rule: {
        id: newRulePersistId(),
        type: 'signal',
        metric: (r.metric as SignalRule['metric']) ?? 'vs_ma50',
        op,
        value: typeof r.value === 'number' ? r.value : 0,
        ...(op === 'between' ? { value2: r.value2 as number } : {}),
        title: typeof r.title === 'string' ? r.title : '',
        severity: r.severity === 'alert' ? 'alert' : 'insight',
      },
    })
  }
  return drafts
}

export function InvestThesesPage() {
  const { x, lang } = useI18n()
  const { state, loading, refresh } = useInvestData()
  const { showToast } = useToasts()

  useInvestHead(IM.invest_seo_title_theses, IM.invest_seo_desc_theses)

  const [view, setView] = useState<View>({ kind: 'list' })
  const [composer, setComposer] = useState<ThesisDraftState>(emptyComposer)
  const [busy, setBusy] = useState<'save' | 'delete' | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [pending, setPending] = useState<AgentSuggestion[]>([])
  const [pendingBusy, setPendingBusy] = useState<string | null>(null)

  const bookCurrency = useMemo(
    () =>
      (state.accounts.find((a) => a.status === 'active')?.baseCurrency ?? 'CAD').toUpperCase(),
    [state.accounts],
  )

  /* The tracked universe minus claimed symbols — the composer's pick list.
     Held positions first, then watch-only symbols. */
  const thesised = useMemo(
    () => new Set(state.theses.map((t) => `${t.assetClass}:${t.symbol.toUpperCase()}`)),
    [state.theses],
  )
  const candidates = useMemo(() => {
    const seen = new Set<string>()
    const out: { assetClass: AssetClass; symbol: string; name: string; held: boolean }[] = []
    for (const p of state.positions) {
      const key = `${p.assetClass}:${p.symbol.toUpperCase()}`
      if (seen.has(key) || thesised.has(key)) continue
      seen.add(key)
      out.push({ assetClass: p.assetClass, symbol: p.symbol.toUpperCase(), name: p.name, held: true })
    }
    for (const w of state.watchlist) {
      const key = `${w.assetClass}:${w.symbol.toUpperCase()}`
      if (seen.has(key) || thesised.has(key)) continue
      seen.add(key)
      out.push({ assetClass: w.assetClass, symbol: w.symbol.toUpperCase(), name: w.name, held: false })
    }
    return out
  }, [state.positions, state.watchlist, thesised])

  useEffect(() => {
    loadPendingSuggestions('invest')
      .then((rows) =>
        setPending(rows.filter((r) => r.kind === 'thesis' || r.kind === 'exit_proposal')),
      )
      .catch(() => {})
  }, [])

  const openComposer = useCallback((seed?: Partial<ThesisDraftState>) => {
    setComposer({ ...emptyComposer(), ...seed })
    setView({ kind: 'composer' })
    window.scrollTo({ top: 0 })
  }, [])

  const openEdit = useCallback((t: InvestThesis) => {
    openComposer({
      id: t.id,
      assetClass: t.assetClass,
      symbol: t.symbol,
      name: t.name,
      thesis: t.thesis,
      intent: t.intent,
      breakDrafts: toDrafts(t.breakRules),
      driftDrafts: toDrafts(t.driftRules),
    })
  }, [openComposer])

  const dismissPending = useCallback(async (s: AgentSuggestion) => {
    setPending((cur) => cur.filter((r) => r.id !== s.id))
    await resolveSuggestion(s.id, 'dismissed', 'dismissed').catch(() => {})
  }, [])

  /* Accepting a thesis suggestion opens the composer pre-seeded — the
     queue row stays pending until the save lands (same staging contract
     the strategy editor uses). */
  const acceptSuggestion = useCallback(
    (s: AgentSuggestion) => {
      const p = (s.payload ?? {}) as Record<string, unknown>
      const seed = (p.seed ?? {}) as Record<string, unknown>
      const assetClass =
        typeof p.asset_class === 'string' ? (p.asset_class as AssetClass) : 'equity'
      const symbol = typeof p.symbol === 'string' ? p.symbol.toUpperCase() : ''
      if (!symbol) return
      openComposer({
        assetClass,
        symbol,
        name: typeof p.name === 'string' ? p.name : '',
        thesis: typeof seed.thesis === 'string' ? seed.thesis : '',
        intent:
          seed.intent === 'growth' || seed.intent === 'income' || seed.intent === 'speculative'
            ? seed.intent
            : 'core',
        breakDrafts: seedToDrafts(seed.break_rules),
        driftDrafts: seedToDrafts(seed.drift_rules),
        suggestionId: s.id,
      })
    },
    [openComposer],
  )

  /* 'exit_proposal' accept — the thesis already broke; the row turns into
     a QUEUED sell for the held quantity, never an execution. It waits on
     the Orders page like every other proposal. */
  const acceptExit = useCallback(
    async (s: AgentSuggestion) => {
      const p = (s.payload ?? {}) as Record<string, unknown>
      const symbol = typeof p.symbol === 'string' ? p.symbol.toUpperCase() : ''
      const pos = state.positions.find(
        (r) => r.assetClass === p.asset_class && r.symbol.toUpperCase() === symbol,
      )
      if (!pos) return
      setPendingBusy(s.id)
      try {
        await createOrder({
          accountId: pos.accountId,
          assetClass: pos.assetClass,
          symbol: pos.symbol,
          name: pos.name,
          side: 'sell',
          quantity: pos.quantity,
          orderType: 'market',
          mode: readOrderMode(),
          note: `Thesis exit — ${symbol}`,
        })
        void resolveSuggestion(s.id, 'accepted', 'drafted').catch(() => {})
        setPending((cur) => cur.filter((r) => r.id !== s.id))
        showToast(IM.invest_exit_drafted)
        await refresh()
      } catch (e) {
        showToast(
          fill(x(IM.invest_exit_failed), {
            error: e instanceof Error ? e.message : String(e),
          }),
        )
      } finally {
        setPendingBusy(null)
      }
    },
    [state.positions, showToast, refresh, x],
  )

  const runTallyDraft = useCallback(async () => {
    const c = composer
    if (!c.symbol || c.tallyDescription.trim().length < 10 || c.tallyBusy) return
    setComposer((cur) => ({ ...cur, tallyBusy: true, tallyNote: false }))
    try {
      const res = await draftThesis({
        assetClass: c.assetClass,
        symbol: c.symbol,
        name: c.name,
        description: c.tallyDescription,
        lang,
      })
      setComposer((cur) => {
        /* Every draft call files its own queue row server-side — when the
           composer already tracks one (a strip accept, or an earlier draft),
           the newcomer is a duplicate; resolve it superseded or it sits
           pending forever. */
        if (res.suggestionId && cur.suggestionId && res.suggestionId !== cur.suggestionId) {
          void resolveSuggestion(res.suggestionId, 'dismissed', 'superseded').catch(() => {})
        }
        return {
          ...cur,
          /* Snapshot before replacing — `cur` carries anything typed while
             the draft was in flight, so the restore is lossless either way. */
          prevDraft: {
            thesis: cur.thesis,
            intent: cur.intent,
            breakDrafts: cur.breakDrafts,
            driftDrafts: cur.driftDrafts,
            suggestionId: cur.suggestionId,
          },
          thesis: res.draft.thesis,
          intent: res.draft.intent,
          breakDrafts: toDrafts(res.draft.breakRules),
          driftDrafts: toDrafts(res.draft.driftRules),
          /* The model already filed a queue row — adopt it as the pending
             suggestion so the save resolves it (no orphan card). */
          suggestionId: cur.suggestionId ?? res.suggestionId,
          tallyBusy: false,
          tallyNote: true,
        }
      })
    } catch {
      setComposer((cur) => ({ ...cur, tallyBusy: false }))
      showToast(IM.invest_thesis_tally_failed)
    }
  }, [composer, lang, showToast])

  /* Restore what a draft overwrote. suggestionId rolls back with it — a
     reverted draft's queue row stays pending (it resurfaces as a strip
     card on next mount) instead of resolving 'added' behind a save that
     didn't adopt it. */
  const undoTallyDraft = useCallback(() => {
    setComposer((cur) =>
      cur.prevDraft
        ? { ...cur, ...cur.prevDraft, prevDraft: null, tallyNote: false }
        : cur,
    )
  }, [])

  const save = useCallback(async () => {
    const c = composer
    /* The claim is the thesis — a symbol with no claim and no conditions
       would be an empty card the sweep can't even read. */
    if (!c.symbol || !c.thesis.trim() || busy) return
    /* Same gate the strategy editor runs — a NaN threshold or a boundless
       'between' would persist as a dead rule otherwise. */
    const signalRules = (ds: RuleDraft[]): SignalRule[] =>
      ds.map((d) => d.rule).filter((r): r is SignalRule => r.type === 'signal')
    const problem = validateRules([...signalRules(c.breakDrafts), ...signalRules(c.driftDrafts)])[0]
    if (problem) {
      showToast(
        fill(x(IM.invest_thesis_save_failed), { error: ruleProblemText(lang, problem) }),
      )
      return
    }
    setBusy('save')
    try {
      await saveThesis({
        ...(c.id ? { id: c.id } : {}),
        assetClass: c.assetClass,
        symbol: c.symbol,
        name: c.name || c.symbol,
        thesis: c.thesis,
        intent: c.intent,
        breakRules: signalRules(c.breakDrafts),
        driftRules: signalRules(c.driftDrafts),
      })
      if (c.suggestionId) {
        void resolveSuggestion(c.suggestionId, 'accepted', 'added').catch(() => {})
        setPending((cur) => cur.filter((r) => r.id !== c.suggestionId))
      }
      showToast(IM.invest_thesis_saved)
      await refresh()
      setView({ kind: 'list' })
      setComposer(emptyComposer())
    } catch (e) {
      showToast(
        fill(x(IM.invest_thesis_save_failed), {
          error: e instanceof Error ? e.message : String(e),
        }),
      )
    } finally {
      setBusy(null)
    }
  }, [composer, busy, refresh, showToast, x, lang])

  const remove = useCallback(
    async (t: InvestThesis) => {
      if (busy) return
      setBusy('delete')
      try {
        await deleteThesis(t.id)
        showToast(IM.invest_thesis_deleted)
        await refresh()
      } catch (e) {
        showToast(
          fill(x(IM.invest_thesis_save_failed), {
            error: e instanceof Error ? e.message : String(e),
          }),
        )
      } finally {
        setBusy(null)
        setConfirmDelete(null)
      }
    },
    [busy, refresh, showToast, x],
  )

  /* Same gate as every sibling tab — without it the list flashes "No
     theses yet" and the composer would show the empty-universe hint
     while the positions/watchlist are still landing. */
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
          <h1>{x(IM.invest_theses_title)}</h1>
          <p className="sub">{x(IM.invest_theses_sub)}</p>
          <div className="sb-list-actions">
            <button
              type="button"
              className="sb-btn sb-btn-primary"
              onClick={() => openComposer()}
            >
              <Plus size={16} strokeWidth={2.4} aria-hidden="true" />
              {x(IM.invest_thesis_new)}
            </button>
          </div>

          {pending.length > 0 && (
            <div className="sb-mini-list" style={{ marginBottom: 16 }}>
              <p className="sb-caption" style={{ marginTop: 0 }}>
                {x(IM.invest_suggest_hint)}
              </p>
              {pending.map((s) => {
                const p = (s.payload ?? {}) as Record<string, unknown>
                const title =
                  lang === 'fr' && typeof p.title_fr === 'string' ? p.title_fr : s.title
                const detail =
                  (lang === 'fr' && typeof p.detail_fr === 'string'
                    ? p.detail_fr
                    : typeof p.detail_en === 'string'
                      ? p.detail_en
                      : null) ?? null
                const key =
                  typeof p.asset_class === 'string' && typeof p.symbol === 'string'
                    ? `${p.asset_class}:${p.symbol.toUpperCase()}`
                    : ''
                /* Stale reads differently per kind — a thesis seed is
                   stale when the thesis exists; an exit is stale when the
                   position it would sell is already gone. */
                const stale =
                  s.kind === 'exit_proposal'
                    ? key === '' ||
                      !state.positions.some(
                        (r) => `${r.assetClass}:${r.symbol.toUpperCase()}` === key,
                      )
                    : key !== '' && thesised.has(key)
                return (
                  <div
                    key={s.id}
                    className="sb-notify-row"
                    style={{ alignItems: 'flex-start', marginBottom: 10, cursor: 'default' }}
                  >
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <strong>{title}</strong>
                      {detail && <span className="sb-notify-hint">{detail}</span>}
                      {stale && (
                        <span className="sb-notify-hint">
                          {x(
                            s.kind === 'exit_proposal'
                              ? IM.invest_exit_stale
                              : IM.invest_thesis_suggest_stale,
                          )}
                        </span>
                      )}
                    </span>
                    <span className="sb-row-actions" style={{ flexShrink: 0 }}>
                      {!stale && s.kind === 'thesis' && (
                        <button
                          type="button"
                          className="sb-btn sb-btn-secondary sb-btn-sm"
                          disabled={pendingBusy !== null}
                          onClick={() => {
                            setPendingBusy(s.id)
                            acceptSuggestion(s)
                            setPendingBusy(null)
                          }}
                        >
                          {x(IM.invest_thesis_suggest_accept)}
                        </button>
                      )}
                      {!stale && s.kind === 'exit_proposal' && (
                        <button
                          type="button"
                          className="sb-btn sb-btn-secondary sb-btn-sm"
                          disabled={pendingBusy !== null}
                          onClick={() => void acceptExit(s)}
                        >
                          {pendingBusy === s.id && (
                            <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                          )}
                          {x(IM.invest_exit_accept)}
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
            </div>
          )}

          {state.theses.length === 0 ? (
            <div className="sb-empty">{x(IM.invest_thesis_empty)}</div>
          ) : (
            <div className="sb-thesis-grid">
              {state.theses.map((t) => {
                const detail = t.evalDetail
                const action = lang === 'fr' ? detail?.action_fr : detail?.action_en
                const evalRows = detail?.rules ?? []
                const breakRows = evalRows.filter((r) => r.zone === 'break')
                const driftRows = evalRows.filter((r) => r.zone === 'drift')
                const when = t.lastEvaluatedAt ? relTimeLabel(t.lastEvaluatedAt, x) : null
                return (
                  <article key={t.id} className="sb-thesis">
                    <header className="sb-thesis-head">
                      <div className="sb-thesis-id">
                        <span className="sb-thesis-sym">{t.symbol}</span>
                        {t.name && <span className="sb-thesis-name">{t.name}</span>}
                      </div>
                      <span className={`sb-pill ${STATUS_PILL[t.status]}`}>
                        {x(IM[STATUS_LABEL[t.status]])}
                      </span>
                    </header>
                    <p className="sb-thesis-intent">
                      {x(IM.invest_thesis_intent_label)} — {x(IM[INTENT_LABEL[t.intent]])}
                    </p>
                    {t.thesis && <blockquote className="sb-thesis-story">{t.thesis}</blockquote>}
                    {action && (
                      <p className="sb-thesis-action">
                        <strong>{x(IM.invest_thesis_posture)}</strong> — {action}
                      </p>
                    )}
                    {evalRows.length > 0 && (
                      <div className="sb-thesis-conds">
                        {breakRows.length > 0 && (
                          <div className="sb-thesis-zone">
                            <span className="sb-thesis-zone-label sb-thesis-zone-break">
                              {x(IM.invest_thesis_zone_break)}
                            </span>
                            {breakRows.map((r) => {
                              const read = evalValueLabel(r.metric, r.value, bookCurrency, lang)
                              return (
                                <div key={`${r.zone}-${r.ident}`} className="sb-thesis-cond">
                                  {r.fired ? (
                                    <CircleAlert size={15} className="sb-cond-bad" aria-hidden="true" />
                                  ) : (
                                    <Check size={15} className="sb-cond-ok" aria-hidden="true" />
                                  )}
                                  <span className={r.fired ? 'sb-cond-fired' : ''}>{r.title}</span>
                                  <span className="sb-cond-read">
                                    {read !== null
                                      ? fill(x(IM.invest_thesis_last_read), { value: read })
                                      : x(IM.invest_thesis_no_read)}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        )}
                        {driftRows.length > 0 && (
                          <div className="sb-thesis-zone">
                            <span className="sb-thesis-zone-label sb-thesis-zone-drift">
                              {x(IM.invest_thesis_zone_drift)}
                            </span>
                            {driftRows.map((r) => {
                              const read = evalValueLabel(r.metric, r.value, bookCurrency, lang)
                              return (
                                <div key={`${r.zone}-${r.ident}`} className="sb-thesis-cond">
                                  {r.fired ? (
                                    <CircleAlert size={15} className="sb-cond-warn" aria-hidden="true" />
                                  ) : (
                                    <Check size={15} className="sb-cond-ok" aria-hidden="true" />
                                  )}
                                  <span className={r.fired ? 'sb-cond-fired' : ''}>{r.title}</span>
                                  <span className="sb-cond-read">
                                    {read !== null
                                      ? fill(x(IM.invest_thesis_last_read), { value: read })
                                      : x(IM.invest_thesis_no_read)}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                    <footer className="sb-thesis-foot">
                      <span className="sb-thesis-when">
                        {when
                          ? fill(x(IM.invest_thesis_evaluated), { when })
                          : x(IM.invest_thesis_never)}
                      </span>
                      <span className="sb-row-actions">
                        <button
                          type="button"
                          className="sb-btn sb-btn-secondary sb-btn-sm"
                          onClick={() => openEdit(t)}
                        >
                          {x(IM.invest_thesis_edit)}
                        </button>
                        <button
                          type="button"
                          className={`sb-btn sb-btn-danger sb-btn-sm${confirmDelete === t.id ? ' sb-armed' : ''}`}
                          disabled={busy !== null}
                          onClick={() => {
                            if (confirmDelete === t.id) {
                              void remove(t)
                            } else {
                              setConfirmDelete(t.id)
                            }
                          }}
                        >
                          {confirmDelete === t.id
                            ? x(IM.invest_thesis_delete_confirm)
                            : x(IM.invest_thesis_delete)}
                        </button>
                      </span>
                    </footer>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      )}

      {view.kind === 'composer' && (
        <div className="sb-list">
          <button
            type="button"
            className="sb-btn sb-btn-secondary sb-btn-sm"
            onClick={() => setView({ kind: 'list' })}
          >
            <X size={15} aria-hidden="true" />
            {x(IM.invest_thesis_cancel)}
          </button>
          <h1 style={{ marginTop: 12 }}>
            {composer.id ? x(IM.invest_thesis_edit) : x(IM.invest_thesis_new)}
          </h1>

          <div className="sb-card" style={{ marginTop: 12 }}>
            <div className="sb-card-pad">
              <div className="sb-field">
                <label className="sb-flabel" htmlFor="th-symbol">
                  {x(IM.invest_thesis_symbol)}
                </label>
                {composer.id ? (
                  <div className="sb-preview-line">
                    {composer.symbol} · {composer.assetClass}
                  </div>
                ) : (
                  <select
                    className="sb-input"
                    id="th-symbol"
                    value={`${composer.assetClass}:${composer.symbol}`}
                    onChange={(e) => {
                      const [assetClass, symbol] = e.target.value.split(':')
                      const pick = candidates.find(
                        (c) => c.assetClass === assetClass && c.symbol === symbol,
                      )
                      setComposer((cur) => ({
                        ...cur,
                        assetClass: (assetClass ?? 'equity') as AssetClass,
                        symbol: symbol ?? '',
                        name: cur.name || pick?.name || '',
                      }))
                    }}
                  >
                    <option value="equity:">{x(IM.invest_thesis_pick_symbol)}</option>
                    {candidates.length === 0 && (
                      <option disabled value="">
                        {x(IM.invest_thesis_no_symbols)}
                      </option>
                    )}
                    {candidates.map((c) => (
                      <option key={`${c.assetClass}:${c.symbol}`} value={`${c.assetClass}:${c.symbol}`}>
                        {c.symbol}
                        {c.name ? ` — ${c.name}` : ''}
                        {c.held ? '' : ' · watchlist'}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="sb-field">
                <label className="sb-flabel" htmlFor="th-name">
                  {x(IM.invest_thesis_name)}
                </label>
                <input
                  className="sb-input"
                  id="th-name"
                  value={composer.name}
                  maxLength={80}
                  onChange={(e) => setComposer((cur) => ({ ...cur, name: e.target.value }))}
                />
              </div>

              <div className="sb-field">
                <span className="sb-flabel" id="th-intent-l">
                  {x(IM.invest_thesis_intent_label)}
                </span>
                <div className="sb-pills" role="group" aria-labelledby="th-intent-l">
                  {THESIS_INTENTS.map((i) => (
                    <button
                      key={i}
                      type="button"
                      aria-pressed={composer.intent === i}
                      onClick={() => setComposer((cur) => ({ ...cur, intent: i }))}
                    >
                      {x(IM[INTENT_LABEL[i]])}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sb-field">
                <label className="sb-flabel" htmlFor="th-story">
                  {x(IM.invest_thesis_story_label)}
                </label>
                <textarea
                  className="sb-input"
                  id="th-story"
                  rows={3}
                  maxLength={600}
                  value={composer.thesis}
                  placeholder={x(IM.invest_thesis_story_ph)}
                  onChange={(e) => setComposer((cur) => ({ ...cur, thesis: e.target.value }))}
                />
              </div>

              <div className="sb-field">
                <label className="sb-flabel" htmlFor="th-tally">
                  {x(IM.invest_thesis_tally_label)}
                </label>
                <textarea
                  className="sb-input"
                  id="th-tally"
                  rows={2}
                  maxLength={800}
                  value={composer.tallyDescription}
                  placeholder={x(IM.invest_thesis_tally_ph)}
                  onChange={(e) =>
                    setComposer((cur) => ({ ...cur, tallyDescription: e.target.value }))
                  }
                />
                <div className="sb-row-actions" style={{ marginTop: 8 }}>
                  <button
                    type="button"
                    className="sb-btn sb-btn-secondary sb-btn-sm"
                    disabled={
                      !composer.symbol ||
                      composer.tallyDescription.trim().length < 10 ||
                      composer.tallyBusy
                    }
                    onClick={() => void runTallyDraft()}
                  >
                    {composer.tallyBusy ? (
                      <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                    ) : (
                      <Sparkles size={14} aria-hidden="true" />
                    )}
                    {composer.tallyBusy
                      ? x(IM.invest_thesis_tally_drafting)
                      : x(IM.invest_thesis_tally_draft)}
                  </button>
                </div>
                {composer.tallyNote && (
                  <p className="sb-helper">
                    {x(IM.invest_thesis_tally_note)}{' '}
                    {composer.prevDraft && (
                      <button
                        type="button"
                        className="sb-linklike"
                        style={{ fontSize: 'inherit' }}
                        onClick={undoTallyDraft}
                      >
                        {x(IM.invest_thesis_tally_undo)}
                      </button>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="sb-card" style={{ marginTop: 14 }}>
            <div className="sb-card-pad">
              <h3>{x(IM.invest_thesis_add_break)}</h3>
              <p className="sb-helper">{x(IM.invest_thesis_zone_break_hint)}</p>
              <RulesAccordion
                drafts={composer.breakDrafts}
                onChange={(next) => setComposer((cur) => ({ ...cur, breakDrafts: next }))}
                idPrefix="thb"
                bookCurrency={bookCurrency}
                signalOnly
              />
            </div>
          </div>

          <div className="sb-card" style={{ marginTop: 14 }}>
            <div className="sb-card-pad">
              <h3>{x(IM.invest_thesis_add_drift)}</h3>
              <p className="sb-helper">{x(IM.invest_thesis_zone_drift_hint)}</p>
              <RulesAccordion
                drafts={composer.driftDrafts}
                onChange={(next) => setComposer((cur) => ({ ...cur, driftDrafts: next }))}
                idPrefix="thd"
                bookCurrency={bookCurrency}
                signalOnly
              />
            </div>
          </div>

          <div className="sb-list-actions" style={{ marginTop: 16 }}>
            <button
              type="button"
              className="sb-btn sb-btn-primary"
              disabled={!composer.symbol || !composer.thesis.trim() || busy !== null}
              onClick={() => void save()}
            >
              {busy === 'save' && (
                <Loader2 size={15} className="animate-spin" aria-hidden="true" />
              )}
              {x(IM.invest_thesis_save)}
            </button>
            <button
              type="button"
              className="sb-btn sb-btn-secondary"
              onClick={() => setView({ kind: 'list' })}
            >
              {x(IM.invest_thesis_cancel)}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
